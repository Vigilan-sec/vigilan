import argparse
import logging


# Try local imports first and fall back to package-qualified imports.
from core.embeddings import get_embedding_model
from core.vector_store import load_vector_store, search_vector_store
from core.rag import generate_response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="RAG Chatbot CLI using Ollama & Chroma"
    )
    parser.add_argument(
        "--query", type=str, required=True, help="Question to ask the RAG system"
    )
    parser.add_argument("--k", type=int, default=3, help="Number of chunks to retrieve")
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.6,
        help="Minimum similarity score to accept a chunk",
    )
    parser.add_argument(
        "--persist-dir",
        type=str,
        default="chroma",
        help="Directory of the Chroma vector store",
    )

    args = parser.parse_args()

    try:
        embedding_model = get_embedding_model()
        db = load_vector_store(embedding_model, persist_dir=args.persist_dir)

        results = search_vector_store(
            db, args.query, k=args.k, threshold=args.threshold
        )
        logger.info(f"Found {len(results)} relevant documents")

        response = generate_response(args.query, results)
        logger.info(f"\n\n=== LLM Response ===\n{response}\n")

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
