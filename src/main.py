import logging
from pathlib import Path

try:
    from core.loaders import load_documents, split_documents
    from core.embeddings import get_embedding_model
    from core.vector_store import (
        load_vector_store,
        search_vector_store,
        create_vector_store,
    )
    from core.rag import generate_response
except Exception:
    from src.core.loaders import load_documents, split_documents
    from src.core.embeddings import get_embedding_model
    from src.core.vector_store import (
        load_vector_store,
        search_vector_store,
        create_vector_store,
    )
    from src.core.rag import generate_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    try:
        # Define data directory
        data_dir = "data/pdf"
        persist_dir = "chroma"

        # Get embedding model
        embedding_model = get_embedding_model()

        # Check if vector store exists, if not create it from documents
        if not Path(persist_dir).exists():
            logger.info("Vector store not found. Loading and indexing documents...")

            # Load documents from data directory
            documents = load_documents(data_dir)

            if not documents:
                logger.warning(f"No documents found in {data_dir}")
                return

            # Split documents into chunks
            chunks = split_documents(documents)

            # Create vector store
            db = create_vector_store(chunks, embedding_model, persist_dir)
        else:
            logger.info("Loading existing vector store...")
            db = load_vector_store(embedding_model, persist_dir)

        # Query the RAG system
        query = "What is an sql injection"
        results = search_vector_store(db, query)
        logger.info(f"Found {len(results)} relevant documents")

        response = generate_response(query, results)
        logger.info(f"LLM response:\n{response}")

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
