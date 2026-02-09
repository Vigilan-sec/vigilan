from langchain.document_loaders import PyPDFLoader
from langchain.document_loaders import TextLoader
from langchain_unstructured import UnstructuredLoader
from logging import basicConfig, getLogger, INFO
from langchain.docstore.document import Document
from pathlib import Path
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

basicConfig(level=INFO)
logger = getLogger(__name__)
logger.setLevel(INFO)


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
        documents.extend(loader.load())
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
    logger.info(f"Number of chunks: {len(chunks)}")

    document = chunks[0]
    logger.info(document.page_content)
    logger.info(document.metadata)

    return chunks


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
    chunks: list[Document], embeddings: OllamaEmbeddings, persist_directory: str
):
    """
    Create a Chroma vector store from document chunks.
    Args:
        chunks (list[Document]): List of document chunks.
        persist_directory (str): Directory to persist the vector store.
        embeddings (OllamaEmbeddings): The embedding model to use.
    Returns:
        Chroma: The created Chroma vector store.
    """
    sanitized_chunks = sanitize_metadata(chunks)
    vectordb = Chroma.from_documents(
        documents=sanitized_chunks,
        embedding=embeddings,
        persist_directory=persist_directory,
    )
    vectordb.persist()
    logger.info(f"saved {len(chunks)} to {persist_directory}")


def main():
    embedding_model = OllamaEmbeddings(model="mxbai-embed-large")
    documents = load_documents(data_dir="data")
    chunks = split_documents(documents)

    create_vector_store(
        chunks=chunks,
        embeddings=embedding_model,
        persist_directory="chroma",
    )


if __name__ == "__main__":
    main()
