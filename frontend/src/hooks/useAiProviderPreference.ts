"use client";

import { useEffect, useState } from "react";

import type { AiProvider } from "@/lib/types";

const STORAGE_KEY = "vigilan.ai.provider";

export function getAiProviderLabel(provider: AiProvider): string {
  return provider === "nim" ? "Kimi via NVIDIA NIM" : "Ollama";
}

export function useAiProviderPreference() {
  const [provider, setProvider] = useState<AiProvider>(() => {
    if (typeof window === "undefined") {
      return "ollama";
    }
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      return stored === "nim" || stored === "ollama" ? stored : "ollama";
    } catch {
      return "ollama";
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, provider);
    } catch {
      // Ignore storage failures and keep the in-memory selection.
    }
  }, [provider]);

  return { provider, setProvider };
}
