from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_unstructured import UnstructuredLoader
from logging import getLogger

logger = getLogger(__name__)


def load_documents(data_dir: str) -> list[Document]:
    """
    Load documents from a directory.
    Supports PDF, Markdown, and Text files.
    Args:
        data_dir (str): The directory to load documents from.
    Returns:
        list[Document]: A list of loaded documents.
    """
    documents = []
    for path in Path(data_dir).rglob("*"):
        if path.suffix.lower() == ".pdf":
            loader = PyPDFLoader(str(path))
        elif path.suffix.lower() == ".md":
            loader = UnstructuredLoader(str(path))
        elif path.suffix.lower() == ".txt":
            loader = TextLoader(str(path))
        else:
            continue
        try:
            docs = loader.load()
            if docs:
                documents.extend(docs)
        except Exception as e:
            logger.warning(f"Failed to load {path}: {e}")
    logger.info(f"{len(documents)} documents loaded from {data_dir}")
    return documents


def split_documents(
    documents: list[Document], chunk_size=1000, chunk_overlap=200
) -> list[Document]:
    """
    Split documents into smaller chunks.
    Args:
        documents (list[Document]): List of documents to split.
        chunk_size (int): Size of each chunk.
        chunk_overlap (int): Overlap between chunks.
    Returns:
        list[Document]: List of chunked documents.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    chunks = text_splitter.split_documents(documents)
    logger.info(f"Documents split into {len(chunks)} chunks")
    return chunks


def add_documents_to_vector_store(
    db, documents: list[Document], embeddings, persist_dir="chroma"
):
    """
    Add documents to the vector store.
    Args:
        db: Existing vector store instance.
        documents (list[Document]): List of documents to add.
        embeddings: Embedding model instance.
        persist_dir (str): Directory to persist the vector store.
    """
    from app.rag.vector_store import create_vector_store

    if not documents:
        logger.warning("No documents to add to the vector store.")
        return db
    try:
        new_db = create_vector_store(documents, embeddings, persist_dir)
        logger.info(f"Added {len(documents)} documents to the vector store.")
        return new_db
    except Exception as e:
        logger.error(f"Failed to add documents to vector store: {e}")
        return db
