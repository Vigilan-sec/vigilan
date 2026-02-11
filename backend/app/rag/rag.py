import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM
from langchain_chroma import Chroma
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

    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    llm = OllamaLLM(model="mistral:latest", base_url=ollama_host)
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


def generate_alert_explanation(alert_data: dict, relevant_docs: list) -> str:
    """
    Generate an explanation and mitigation advice for a security alert.
    Args:
        alert_data (dict): The alert data (signature, category, severity, etc.)
        relevant_docs (list): A list of relevant documents from vector search.
    Returns:
        response (str): The generated explanation and recommendations.
    """
    # Merge document contents for the prompt
    content_text = (
        "\n\n---\n\n".join(doc.page_content for doc, _ in relevant_docs)
        if relevant_docs
        else "No relevant document"
    )

    signature = alert_data.get("signature", "Unknown alert")
    category = alert_data.get("category", "Unknown category")
    severity = alert_data.get("severity", "Unknown")
    src_ip = alert_data.get("src_ip", "Unknown")
    dest_ip = alert_data.get("dest_ip", "Unknown")
    proto = alert_data.get("proto", "Unknown")
    app_proto = alert_data.get("app_proto") or "N/A"
    action = alert_data.get("action") or "N/A"
    payload_printable = alert_data.get("payload_printable") or "N/A"
    http_context = alert_data.get("http_context") or {}
    dns_context = alert_data.get("dns_context") or {}
    tls_context = alert_data.get("tls_context") or {}

    # Build protocol context section
    proto_context_parts = []
    if http_context:
        proto_context_parts.append(f"HTTP: method={http_context.get('http_method', 'N/A')}, "
                                   f"host={http_context.get('hostname', 'N/A')}, "
                                   f"url={http_context.get('url', 'N/A')}, "
                                   f"user_agent={http_context.get('http_user_agent', 'N/A')}, "
                                   f"status={http_context.get('status', 'N/A')}")
    if dns_context:
        proto_context_parts.append(f"DNS: type={dns_context.get('type', 'N/A')}, "
                                   f"query={dns_context.get('rrname', 'N/A')}, "
                                   f"rrtype={dns_context.get('rrtype', 'N/A')}, "
                                   f"rcode={dns_context.get('rcode', 'N/A')}")
    if tls_context:
        proto_context_parts.append(f"TLS: sni={tls_context.get('sni', 'N/A')}, "
                                   f"version={tls_context.get('version', 'N/A')}, "
                                   f"subject={tls_context.get('subject', 'N/A')}, "
                                   f"issuer={tls_context.get('issuerdn', 'N/A')}")
    proto_context_str = "\n".join(proto_context_parts) if proto_context_parts else "N/A"

    prompt_text = """
You are a cybersecurity expert assistant. A security alert has been triggered by Suricata IDS/IPS and you need to explain it and provide protection recommendations.

ALERT DETAILS:
- Signature: {signature}
- Category: {category}
- Severity: {severity}
- Action taken: {action}
- Source: {src_ip} -> Destination: {dest_ip}
- Protocol: {proto} (App: {app_proto})

PAYLOAD (printable):
{payload_printable}

PROTOCOL CONTEXT:
{proto_context_str}

CONTEXT FROM SECURITY DOCUMENTATION:
{content_text}

Based on the alert details, payload, protocol context, and the provided security documentation, please:
1) Explain what this alert means and what attack or suspicious activity it detected
2) Analyze the payload and protocol context to provide specific insights
3) Assess the potential risk and impact
4) Provide specific recommendations on how to protect against or mitigate this threat
5) Suggest any additional security measures that should be taken

If the provided documentation doesn't contain relevant information, use your cybersecurity knowledge to provide a helpful explanation.

Response:
"""

    prompt = ChatPromptTemplate.from_template(prompt_text)
    formatted_prompt = prompt.format(
        signature=signature,
        category=category,
        severity=severity,
        action=action,
        src_ip=src_ip,
        dest_ip=dest_ip,
        proto=proto,
        app_proto=app_proto,
        payload_printable=payload_printable,
        proto_context_str=proto_context_str,
        content_text=content_text,
    )

    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    llm = OllamaLLM(model="mistral:latest", base_url=ollama_host)
    try:
        response = llm.invoke(formatted_prompt)
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        response = "Error generating alert explanation."

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
        db = Chroma(persist_directory=persist_dir, embedding_function=embeddings)
    except Exception:
        # If the vectorstore cannot be loaded we return an error-shaped dict
        return {"error": "failed to load vectorstore"}

    results = db.similarity_search_with_score(query, k=2)
    response = generate_response(query, results)
    return {"response": response}
