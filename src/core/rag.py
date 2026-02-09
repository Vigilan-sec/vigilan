from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
from langchain_community.vectorstores import Chroma as ChromaVectorStore
from typing import Iterable
from logging import getLogger

logger = getLogger(__name__)


def generate_response(query: str, relevant_docs: list) -> str:
    """
    Generate a response using an LLM based on the query and relevant documents.
    Args:
        query (str): The user's question.
        relevant_docs (list): A list of relevant documents.
    Returns:
        response (str): The generated response.
    """

    # Merge document contents for the prompt
    content_text = (
        "\n\n---\n\n".join(doc.page_content for doc, _ in relevant_docs)
        if relevant_docs
        else "No relevant document"
    )

    prompt_text = """
You are an assistant that answers questions using ONLY the provided context.

Rules:
1) Use only the information present in the CONTEXT section below.
2) Do NOT invent, infer, or hallucinate facts that are not contained in the context.
3) If the answer cannot be found in the context, say that you did not find the answer in the provided context.
4) If the user greets you or try to engage in small talk, respond politely that you are an AI assistant and can only answer questions based on the provided context.

CONTEXT:
{content_text}

QUESTION: {query}

Answer:
"""

    prompt = ChatPromptTemplate.from_template(prompt_text)
    formatted_prompt = prompt.format(content_text=content_text, query=query)

    llm = OllamaLLM(model="mistral:latest")
    try:
        response = llm.invoke(formatted_prompt)
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        response = "Error generating response."
    # Normalize a few possible polite refusals into the canonical phrase
    if isinstance(response, str):
        low = response.strip().lower()
        if low in ("i don't know", "i do not know", "cannot answer", "i'm not sure"):
            return "I don't know"
    return response


def run_rag_pipeline(query: str, embeddings, persist_dir: str) -> dict:
    """A small helper to run a RAG-style pipeline for tests.

    This function will load a vectorstore from `persist_dir`, run a
    similarity search and then generate a response. It's intentionally
    small and deterministic to make testing easier.
    Args:
        query (str): The user's question.
        embeddings: The embedding model to use.
        persist_dir (str): Directory of the Chroma vector store.
    Returns:
        dict: A dictionary with either the response or an error message.
    """
    # Load vector store
    try:
        db = ChromaVectorStore(
            persist_directory=persist_dir, embedding_function=embeddings
        )
    except Exception:
        # If the vectorstore cannot be loaded we return an error-shaped dict
        return {"error": "failed to load vectorstore"}

    results = db.similarity_search_with_score(query, k=2)
    response = generate_response(query, results)
    return {"response": response}
