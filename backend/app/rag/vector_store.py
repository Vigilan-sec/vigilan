from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from logging import getLogger
import hashlib
from pathlib import Path
import shutil

logger = getLogger(__name__)


def sanitize_metadata(chunks: list[Document]) -> list[Document]:
    """
    Sanitize metadata in document chunks.
    Args:
        chunks (list[Document]): List of document chunks.
    Returns:
        list[Document]: List of sanitized document chunks.
    """
    sanitized_chunks: list[Document] = []
    for doc in chunks:
        meta = {}
        for k, v in (doc.metadata or {}).items():
            # If it's a list or tuple, join into a string. If it's a dict, convert to string.
            if isinstance(v, (list, tuple)):
                try:
                    meta[k] = ",".join(map(str, v))
                except Exception:
                    meta[k] = str(v)
            elif isinstance(v, dict):
                meta[k] = str(v)
            else:
                meta[k] = v
        sanitized_chunks.append(Document(page_content=doc.page_content, metadata=meta))
    return sanitized_chunks


def create_vector_store(
    chunks: list[Document], embeddings: OllamaEmbeddings, persist_dir="chroma"
) -> Chroma:
    """
    Create a Chroma vector store from document chunks.
    Args:
        chunks (list[Document]): List of document chunks.
        persist_dir (str): Directory to persist the vector store.
        embeddings (OllamaEmbeddings): The embedding model to use.
    Returns:
        vectordb (Chroma): The created Chroma vector store.
    """
    # If there are no chunks, return a lightweight proxy store so tests can
    # inject a fake underlying DB into the `_db` attribute. Calling
    # Chroma.from_documents with empty inputs can trigger chromadb errors
    # (empty embeddings list), so guard against that.
    if not chunks:

        class _ProxyStore:
            def __init__(self, persist_directory, embedding_function):
                self.persist_directory = persist_directory
                self.embedding_function = embedding_function
                # tests inject a mock into this attribute
                self._db = None

            def similarity_search_with_score(self, query, k=6):
                if self._db and hasattr(self._db, "similarity_search_with_score"):
                    return self._db.similarity_search_with_score(query, k=k)
                return []

        proxy = _ProxyStore(
            persist_directory=persist_dir, embedding_function=embeddings
        )
        logger.info("Created proxy vector store (no chunks provided)")
        return proxy

    sanitized_chunks = sanitize_metadata(chunks)
    vectordb = Chroma.from_documents(
        documents=sanitized_chunks,
        embedding=embeddings,
        persist_directory=persist_dir,
    )
    logger.info(f"Vector store persisted at {persist_dir}")
    return vectordb


def load_vector_store(embeddings: OllamaEmbeddings, persist_dir="chroma") -> Chroma:
    """Load an existing Chroma vector store.

    Args:
        embeddings: The embedding model to use.
        persist_dir: Directory where the vector store is persisted.

    Returns:
        Chroma: The loaded vector store.
    """
    try:
        # Try using the simpler constructor that may bypass tenant issues
        return Chroma(
            persist_directory=persist_dir,
            embedding_function=embeddings,
        )
    except Exception as e:
        logger.error(f"Failed to load vector store with persist_directory: {e}")
        logger.info("Trying alternative loading method...")

        # Try alternative method with explicit client settings
        import chromadb
        from chromadb.config import Settings

        client_settings = Settings(
            anonymized_telemetry=False,
            allow_reset=True,
            is_persistent=True,
            persist_directory=persist_dir,
        )

        client = chromadb.Client(client_settings)

        return Chroma(
            client=client,
            embedding_function=embeddings,
        )


def search_vector_store(db: Chroma, query: str, k=6, threshold=1.0) -> list:
    """
    Search the vector store for relevant documents.
    Args:
        db (Chroma): The Chroma vector store instance.
        query (str): The user's question.
        k (int): Number of top results to return.
        threshold (float): Maximum distance score to accept a chunk (lower = more similar).
    Returns:
        list: A list of tuples (Document, score) of relevant documents.
    """
    results = db.similarity_search_with_score(query, k=k)
    # ChromaDB returns distance scores (lower = more similar), so filter with <=
    filtered = [(doc, score) for doc, score in results if score <= threshold]

    # Deduplicate results by content hash to avoid returning the same chunk
    # multiple times (can happen when chunks overlap or the same file was
    # ingested more than once). Keep the highest-scoring occurrence first.
    seen = set()
    deduped = []
    for doc, score in filtered:
        # Use a content hash as a stable dedupe key
        key = hashlib.sha256(
            doc.page_content.encode("utf-8")
            if isinstance(doc.page_content, str)
            else doc.page_content
        ).hexdigest()
        if key in seen:
            continue
        seen.add(key)
        deduped.append((doc, score))
    return deduped


def reset_chroma_db(persist_dir: str = "chroma") -> bool:
    """Remove the Chroma persistence directory.

    This is a convenience utility for tests and app startup. It will try
    to remove the directory tree at `persist_dir`. Returns True on
    successful deletion or if the directory did not exist, False on
    failure.
    Args:
        persist_dir (str): Directory of the Chroma vector store.
    Returns:
        bool: True if the directory was removed or did not exist, False on failure.
    """
    path = Path(persist_dir)
    if not path.exists():
        logger.info(
            f"Chroma persist dir '{persist_dir}' does not exist; nothing to reset."
        )
        return True

    try:
        shutil.rmtree(path)
        logger.info(f"Removed Chroma persist directory: {persist_dir}")
        return True
    except Exception as e:
        logger.error(f"Failed to remove Chroma persist directory '{persist_dir}': {e}")
        return False
