import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.rag.embeddings import get_embedding_model
from app.rag.vector_store import load_vector_store, search_vector_store
from app.rag.rag import generate_alert_explanation
from app.rag.providers import ProviderConfigurationError, resolve_provider_name

logger = logging.getLogger(__name__)

router = APIRouter(tags=["rag"])


class AlertExplanationRequest(BaseModel):
    signature: str
    category: str | None = None
    severity: int | None = None
    src_ip: str | None = None
    dest_ip: str | None = None
    proto: str | None = None
    app_proto: str | None = None
    action: str | None = None
    payload_printable: str | None = None
    http_context: dict | None = None
    dns_context: dict | None = None
    tls_context: dict | None = None
    provider: Literal["ollama", "nim"] | None = None


class AlertExplanationResponse(BaseModel):
    explanation: str
    sources_found: int
    provider: Literal["ollama", "nim"]
    model: str


# Global variables for RAG system (lazy loaded)
_embedding_model = None
_vector_db = None
_rag_initialized = False


def initialize_rag():
    """Initialize the RAG system (embedding model + vector store)."""
    global _embedding_model, _vector_db, _rag_initialized

    if _rag_initialized:
        return

    try:
        # TEMPORARY: Disable vector store due to ChromaDB version compatibility issues
        # TODO: Recreate vector store inside Docker container with compatible ChromaDB version
        logger.info("Initializing LLM without vector store (compatibility issue)")
        _embedding_model = get_embedding_model()
        _vector_db = None
        _rag_initialized = True  # Mark as initialized so we don't retry
        logger.info(
            "LLM initialized, will provide explanations based on general security knowledge"
        )

    except Exception as e:
        logger.warning(f"RAG initialization issue: {e}")
        logger.info("Continuing without vector store - will use LLM general knowledge")
        _rag_initialized = True  # Mark as initialized even on error
        _vector_db = None
        try:
            _embedding_model = get_embedding_model()
        except:
            pass


@router.post("/explain-alert", response_model=AlertExplanationResponse)
async def explain_alert(request: AlertExplanationRequest):
    """
    Explain a security alert and provide mitigation recommendations using RAG.
    """
    # Initialize RAG system on first request
    initialize_rag()

    # Prepare alert data for explanation
    alert_data = {
        "signature": request.signature,
        "category": request.category,
        "severity": request.severity,
        "src_ip": request.src_ip,
        "dest_ip": request.dest_ip,
        "proto": request.proto,
        "app_proto": request.app_proto,
        "action": request.action,
        "payload_printable": request.payload_printable,
        "http_context": request.http_context,
        "dns_context": request.dns_context,
        "tls_context": request.tls_context,
    }

    try:
        selected_provider = resolve_provider_name(request.provider)
        relevant_docs = []
        sources_found = 0

        # Try to use RAG if available (currently disabled)
        if _vector_db is not None:
            try:
                # Create a search query based on the alert
                search_query = f"{request.signature} {request.category or ''}"

                # Search for relevant documents
                relevant_docs = search_vector_store(
                    _vector_db, search_query, k=3, threshold=1.0
                )
                sources_found = len(relevant_docs)

                logger.info(
                    f"Found {sources_found} relevant documents for alert: {request.signature}"
                )
            except Exception as e:
                logger.warning(
                    f"Vector search failed, falling back to general explanation: {e}"
                )
        else:
            logger.info(
                "Vector store not available, providing general security explanation"
            )

        # Generate explanation using LLM (with or without RAG context)
        explanation = generate_alert_explanation(
            alert_data,
            relevant_docs,
            provider=selected_provider,
        )

        return AlertExplanationResponse(
            explanation=explanation.text,
            sources_found=sources_found,
            provider=explanation.provider,
            model=explanation.model,
        )

    except ProviderConfigurationError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception(f"Error generating alert explanation: {e}")
        # Check if it's an Ollama connection error
        error_msg = str(e).lower()
        if (
            "connection" in error_msg
            or "refused" in error_msg
            or "timeout" in error_msg
        ):
            detail = "Could not connect to Ollama. Please ensure Ollama is running and accessible."
        else:
            detail = f"Failed to generate alert explanation: {str(e)}"

        raise HTTPException(status_code=503, detail=detail)
