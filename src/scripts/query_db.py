from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from logging import basicConfig, getLogger, INFO
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama.llms import OllamaLLM

basicConfig(level=INFO)
logger = getLogger(__name__)
logger.setLevel(INFO)


def main():
    # Charger le modèle d'embedding local
    embedding_model = OllamaEmbeddings(model="mxbai-embed-large")

    # Charger la base Chroma existante
    db = Chroma(
        persist_directory="chroma",
        embedding_function=embedding_model,
    )

    # Question utilisateur
    query_text = "what does fossy keyboard do?"

    # Recherche des chunks les plus similaires avec les scores
    results = db.similarity_search_with_score(query_text, k=3)

    if not results:
        logger.info("No documents found.")
        return

    # Afficher les résultats
    for doc, score in results:
        logger.info(
            f"Score: {score:.4f}\nMetadata: {doc.metadata}\nExcerpt:\n{doc.page_content[:300]}...\n"
        )

    # similarity threshold
    threshold = 0.6
    best_results = [doc for doc, score in results if score >= threshold]

    # sort results by score descending
    best_results = sorted(
        best_results,
        key=lambda x: next(score for d, score in results if d == x),
        reverse=True,
    )

    if not best_results:
        logger.info("No good match found (all scores below threshold).")
        return

    # Preparing the prompt for the LLM
    content_text = "\n\n---\n\n".join(doc.page_content for doc in best_results)
    logger.info(f"Combined content for prompt:\n\n{content_text[:4000]}...")

    prompt_template = f"""
You are a knowledgeable assistant. Use the following context to answer the question.

{content_text}

Question: {query_text}
Answer:
"""
    prompt = ChatPromptTemplate.from_template(prompt_template)

    llm = OllamaLLM(model="mistral:latest")

    response = llm(prompt.format())

    logger.info(f"LLM response:\n\n{response}")

if __name__ == "__main__":
    main()
