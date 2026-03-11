"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import SeverityBadge from "@/components/alerts/SeverityBadge";
import Header from "@/components/layout/Header";
import MarkdownContent from "@/components/shared/MarkdownContent";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getAiProviderLabel,
  useAiProviderPreference,
} from "@/hooks/useAiProviderPreference";
import { useWebSocket } from "@/hooks/useWebSocket";
import { chatWithAssistant, fetchAlerts } from "@/lib/api";
import type {
  AiProvider,
  AlertRecord,
  AssistantChatMessage,
} from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

const RECENT_ALERT_LIMIT = 20;

interface ChatMessage extends AssistantChatMessage {
  id: string;
  provider?: AiProvider;
  model?: string;
  error?: boolean;
}

function buildConversation(messages: ChatMessage[]): AssistantChatMessage[] {
  return messages.map(({ role, content }) => ({ role, content }));
}

export default function AssistantPage() {
  const { status } = useWebSocket();
  const { provider, setProvider } = useAiProviderPreference();
  const { kimiApiKey } = useAppSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAlertCount, setLastAlertCount] = useState(0);

  const { data: alertsPage, isLoading: isLoadingAlerts } = useSWR(
    "assistant-recent-alerts",
    () =>
      fetchAlerts({
        page: 1,
        per_page: RECENT_ALERT_LIMIT,
      }),
  );

  const recentAlerts = useMemo<AlertRecord[]>(
    () => alertsPage?.items || [],
    [alertsPage],
  );
  const kimiEnabled = kimiApiKey.trim().length > 0;
  const providerNeedsKey = provider === "nim" && !kimiEnabled;

  useEffect(() => {
    setLastAlertCount(recentAlerts.length);
  }, [recentAlerts.length]);

  const requestAssistant = useCallback(
    async (conversation: AssistantChatMessage[]) => {
      setIsLoadingReply(true);
      setError(null);
      try {
        const response = await chatWithAssistant({
          messages: conversation,
          provider,
          kimi_api_key: provider === "nim" ? kimiApiKey.trim() : null,
          recent_alerts_limit: RECENT_ALERT_LIMIT,
        });

        setLastAlertCount(response.alert_count);
        setMessages((current) => [
          ...current,
          {
            id: `${response.provider}-${Date.now()}`,
            role: "assistant",
            content: response.message,
            provider: response.provider,
            model: response.model,
          },
        ]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to contact assistant";
        setError(message);
        setMessages((current) => [
          ...current,
          {
            id: `assistant-error-${Date.now()}`,
            role: "assistant",
            content: message,
            error: true,
          },
        ]);
      } finally {
        setIsLoadingReply(false);
      }
    },
    [kimiApiKey, provider],
  );

  useEffect(() => {
    if (providerNeedsKey) {
      setError(null);
      setIsLoadingReply(false);
      setMessages([
        {
          id: "assistant-kimi-missing-key",
          role: "assistant",
          content:
            "Kimi is selected, but no API key is configured yet. Add it from Settings or switch back to Ollama to generate the recent-alert recap.",
          error: true,
        },
      ]);
      return;
    }

    setMessages([]);
    void requestAssistant([]);
  }, [providerNeedsKey, provider, requestAssistant]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoadingReply) {
      return;
    }

    if (providerNeedsKey) {
      setError("Add your Kimi API key in Settings before using Kimi.");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedQuestion,
    };
    const nextConversation = [...messages, userMessage];
    setMessages(nextConversation);
    setQuestion("");
    await requestAssistant(buildConversation(nextConversation));
  };

  const handleProviderChange = (nextProvider: AiProvider) => {
    setProvider(nextProvider);
    setQuestion("");
  };

  return (
    <div className="min-h-screen">
      <Header title="Assistant" wsStatus={status} />
      <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section className="flex min-h-[70vh] flex-col rounded-xl border border-app surface-2">
          <div className="border-b border-app px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-strong">
                  Recent-alert copilot
                </h2>
                <p className="mt-1 text-xs text-subtle">
                  Ask for prioritization, explanations, or next steps based on
                  the latest alerts seen by Vigilan.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="assistant-provider"
                  className="text-xs font-medium text-muted"
                >
                  Model
                </label>
                <select
                  id="assistant-provider"
                  value={provider}
                  onChange={(event) =>
                    handleProviderChange(event.target.value as AiProvider)
                  }
                  className="min-w-60 rounded-md border bg-transparent px-3 py-2 text-sm input-base"
                >
                  <option value="ollama">Ollama</option>
                  <option value="nim">Kimi via NVIDIA NIM</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-subtle">
              <span className="rounded-full border border-app px-2 py-1">
                Provider: {getAiProviderLabel(provider)}
              </span>
              <span className="rounded-full border border-app px-2 py-1">
                Alerts in scope: {lastAlertCount || recentAlerts.length}
              </span>
              {provider === "nim" && (
                <span className="rounded-full border border-app px-2 py-1">
                  Kimi key: {kimiEnabled ? "configured" : "missing"}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-3xl rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto border-blue-500/30 bg-blue-500/10 text-blue-50"
                    : message.error
                      ? "border-red-500/30 bg-red-500/10 text-red-100"
                      : "border-app surface-1 text-strong"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-wide">
                  <span>
                    {message.role === "user" ? "You" : "Assistant"}
                  </span>
                  {message.provider && message.model && (
                    <span className="text-subtle normal-case">
                      {getAiProviderLabel(message.provider)} - {message.model}
                    </span>
                  )}
                </div>
                {message.role === "user" ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <MarkdownContent content={message.content} />
                )}
              </div>
            ))}

            {isLoadingReply && (
              <div className="max-w-3xl rounded-2xl border border-app surface-1 px-4 py-3 text-sm text-subtle">
                Analyzing the latest alerts with {getAiProviderLabel(provider)}...
              </div>
            )}
          </div>

          <div className="border-t border-app px-5 py-4">
            {providerNeedsKey && (
              <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Add your Kimi API key in{" "}
                <Link href="/settings" className="font-semibold underline">
                  Settings
                </Link>{" "}
                or switch back to Ollama to chat.
              </div>
            )}
            {error && !providerNeedsKey && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about suspicious sources, top priorities, or what to investigate next..."
                className="min-h-28 w-full rounded-xl border px-4 py-3 text-sm input-base"
                disabled={isLoadingReply}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-subtle">
                  Example: “Which alerts look the most critical right now?”
                </p>
                <button
                  type="submit"
                  disabled={isLoadingReply || !question.trim()}
                  className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-app surface-2 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-strong">
                Recent alerts in context
              </h2>
              <Link
                href="/alerts"
                className="text-xs text-muted transition-colors hover:text-strong"
              >
                Open alerts &rarr;
              </Link>
            </div>
            <p className="mt-1 text-xs text-subtle">
              The assistant recap is grounded in the latest {RECENT_ALERT_LIMIT} alerts.
            </p>

            <div className="mt-4 space-y-3">
              {isLoadingAlerts ? (
                <div className="rounded-lg border border-app surface-1 px-4 py-6 text-center text-sm text-subtle">
                  Loading recent alerts...
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="rounded-lg border border-app surface-1 px-4 py-6 text-center text-sm text-subtle">
                  No recent alerts available.
                </div>
              ) : (
                recentAlerts.slice(0, 10).map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/alerts/${alert.id}`}
                    className="block rounded-lg border border-app surface-1 px-4 py-3 transition-colors hover-surface-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-strong">{alert.signature}</p>
                        <p className="mt-1 text-xs text-subtle">
                          {formatTimestamp(alert.timestamp)} • {alert.src_ip} →{" "}
                          {alert.dest_ip}
                        </p>
                      </div>
                      <SeverityBadge severity={alert.severity} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-app surface-2 p-5">
            <h2 className="text-sm font-semibold text-strong">Quick prompts</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {[
                "Summarize the main attack patterns you see.",
                "Which alerts should I investigate first and why?",
                "What containment steps would you recommend right now?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setQuestion(prompt)}
                  className="rounded-lg border border-app px-3 py-2 text-left text-subtle transition-colors hover-surface-3 hover:text-strong"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
