from langchain_ollama import OllamaEmbeddings as _RealOllamaEmbeddings


# wrapper so tests importing `OllamaEmbeddings` from
# `src.embeddings` get a predictable object with a `model_name`
# attribute while still delegating behavior to the real implementation.
class OllamaEmbeddings:
    def __init__(self, model, **kwargs):
        # keep the real implementation for actual embedding calls
        self._impl = _RealOllamaEmbeddings(model=model, **kwargs)
        # expose a simple attribute used by tests
        self.model_name = model

    def __getattr__(self, name):
        # Delegate unknown attributes/methods to the real implementation
        return getattr(self._impl, name)


def get_embedding_model(model_name="mxbai-embed-large") -> OllamaEmbeddings:
    """
    Get an instance of the OllamaEmbeddings model.

    Args:
        model_name (str): The name of the model to use.

    Returns:
        OllamaEmbeddings: An instance of the OllamaEmbeddings model.
    """
    return OllamaEmbeddings(model=model_name)
