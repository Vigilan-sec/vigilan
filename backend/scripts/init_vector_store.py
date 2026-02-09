#!/usr/bin/env python3
"""Initialize the ChromaDB vector store inside the Docker container."""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.embeddings import get_embedding_model
from app.rag.loaders import load_documents, split_documents
from app.rag.vector_store import create_vector_store, reset_chroma_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    try:
        # Define paths
        data_dir = "/app/data/pdf"
        persist_dir = "/app/chroma"

        logger.info(f"Data directory: {data_dir}")
        logger.info(f"Vector store directory: {persist_dir}")

        # Check if data directory exists
        if not Path(data_dir).exists():
            logger.error(f"Data directory not found: {data_dir}")
            return 1

        # Reset existing vector store
        logger.info("Resetting existing vector store...")
        reset_chroma_db(persist_dir)

        # Load documents
        logger.info(f"Loading documents from {data_dir}...")
        documents = load_documents(data_dir)

        if not documents:
            logger.warning(f"No documents found in {data_dir}")
            return 1

        logger.info(f"Loaded {len(documents)} documents")

        # Split documents
        logger.info("Splitting documents into chunks...")
        chunks = split_documents(documents)
        logger.info(f"Created {len(chunks)} chunks")

        # Get embedding model
        logger.info("Initializing embedding model...")
        embedding_model = get_embedding_model()

        # Create vector store
        logger.info("Creating vector store...")
        db = create_vector_store(chunks, embedding_model, persist_dir)

        logger.info("✓ Vector store created successfully!")
        return 0

    except Exception as e:
        logger.exception(f"Error initializing vector store: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
