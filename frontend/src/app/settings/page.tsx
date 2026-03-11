"use client";

import { FormEvent, useEffect, useState } from "react";

import Header from "@/components/layout/Header";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getAiProviderLabel,
  useAiProviderPreference,
} from "@/hooks/useAiProviderPreference";

export default function SettingsPage() {
  const { status } = useWebSocket();
  const { provider } = useAiProviderPreference();
  const { kimiApiKey, setKimiApiKey } = useAppSettings();
  const [draftKey, setDraftKey] = useState(kimiApiKey);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setDraftKey(kimiApiKey);
  }, [kimiApiKey]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setKimiApiKey(draftKey.trim());
    setFeedback(
      draftKey.trim()
        ? "Kimi API key saved in this browser."
        : "Stored Kimi API key cleared from this browser.",
    );
  };

  const handleClear = () => {
    setDraftKey("");
    setKimiApiKey("");
    setFeedback("Stored Kimi API key cleared from this browser.");
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" wsStatus={status} />
      <div className="space-y-6 p-6">
        <section className="rounded-xl border border-app surface-2 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-strong">AI providers</h2>
            <p className="mt-1 text-xs text-subtle">
              Configure client-side access for Kimi and keep Ollama ready as the
              local fallback. The current session preference is{" "}
              <span className="font-semibold text-strong">
                {getAiProviderLabel(provider)}
              </span>
              .
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs text-muted">
              Kimi API key
              <input
                type="password"
                value={draftKey}
                onChange={(event) => {
                  setDraftKey(event.target.value);
                  setFeedback(null);
                }}
                placeholder="Paste your NVIDIA NIM / Kimi API key"
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                autoComplete="off"
              />
            </label>

            <div className="rounded-lg border border-app surface-1 px-4 py-3 text-xs text-subtle">
              Stored only in your current browser profile. The key is sent to the
              backend only when you actively use Kimi for alert explanations or
              Assistant conversations.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
              >
                Save key
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-app px-4 py-2 text-sm text-subtle transition-colors hover:text-strong"
              >
                Clear key
              </button>
            </div>
          </form>

          {feedback && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {feedback}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-app surface-2 p-6">
          <h2 className="text-sm font-semibold text-strong">
            Future platform settings
          </h2>
          <p className="mt-2 text-sm text-subtle">
            This area is reserved for upcoming user preferences and integration
            options. For now, it centralizes the Kimi setup so the Assistant and
            alert explanation flows can reuse it.
          </p>
        </section>
      </div>
    </div>
  );
}
