from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, cast

import httpx
from langchain_ollama.llms import OllamaLLM

from app.config import settings

ProviderName = Literal["ollama", "nim"]


class ProviderConfigurationError(RuntimeError):
    """Raised when a selected LLM provider is missing required configuration."""


@dataclass(frozen=True)
class LLMInvocationResult:
    text: str
    provider: ProviderName
    model: str


def resolve_provider_name(provider: str | None) -> ProviderName:
    if not provider:
        return settings.llm_provider_default

    normalized = provider.strip().lower()
    if normalized not in {"ollama", "nim"}:
        raise ValueError(f"Unsupported LLM provider: {provider}")
    return cast(ProviderName, normalized)


def resolve_provider_model(provider: ProviderName) -> str:
    if provider == "nim":
        return settings.nim_model
    return settings.ollama_model


def _extract_nim_text(payload: dict) -> str:
    choices = payload.get("choices") or []
    if not choices:
        raise ProviderConfigurationError("NVIDIA NIM returned no choices")

    message = choices[0].get("message") or {}
    content = message.get("content")
    if isinstance(content, list):
        parts = [
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        ]
        text = "".join(parts).strip()
        if text:
            return text
    if isinstance(content, str) and content.strip():
        return content
    raise ProviderConfigurationError("NVIDIA NIM returned an empty response")


def _invoke_nim(prompt: str) -> LLMInvocationResult:
    if not settings.nim_api_key:
        raise ProviderConfigurationError(
            "Kimi via NVIDIA NIM is not configured. Set VIGILAN_NIM_API_KEY in your environment."
        )

    response = httpx.post(
        f"{settings.nim_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.nim_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.nim_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        },
        timeout=settings.nim_timeout_seconds,
    )
    response.raise_for_status()
    payload = response.json()
    return LLMInvocationResult(
        text=_extract_nim_text(payload),
        provider="nim",
        model=settings.nim_model,
    )


def _invoke_ollama(prompt: str) -> LLMInvocationResult:
    llm = OllamaLLM(model=settings.ollama_model, base_url=settings.ollama_host)
    response = llm.invoke(prompt)
    return LLMInvocationResult(
        text=response if isinstance(response, str) else str(response),
        provider="ollama",
        model=settings.ollama_model,
    )


def invoke_llm(prompt: str, provider: str | None = None) -> LLMInvocationResult:
    selected_provider = resolve_provider_name(provider)
    if selected_provider == "nim":
        return _invoke_nim(prompt)
    return _invoke_ollama(prompt)
