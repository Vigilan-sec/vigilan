"use client";

import { useState, useEffect, useCallback } from "react";
import { explainAlert } from "@/lib/api";
import MarkdownContent from "@/components/shared/MarkdownContent";
import {
  getAiProviderLabel,
  useAiProviderPreference,
} from "@/hooks/useAiProviderPreference";
import { useAppSettings } from "@/hooks/useAppSettings";
import type {
  AiProvider,
  AlertRecord,
  AlertExplanationResponse,
} from "@/lib/types";

interface ExplanationModalProps {
  alert: AlertRecord;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExplanationModal({
  alert,
  isOpen,
  onClose,
}: ExplanationModalProps) {
  const { provider, setProvider } = useAiProviderPreference();
  const { kimiApiKey } = useAppSettings();
  const [explanation, setExplanation] =
    useState<AlertExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (provider === "nim" && !kimiApiKey.trim()) {
      setIsLoading(false);
      setError("Kimi is selected, but no API key is configured in Settings.");
      return;
    }
    try {
      // Parse protocol context from JSON strings
      const parseJson = (raw: string | null) => {
        if (!raw) return undefined;
        try {
          return JSON.parse(raw);
        } catch {
          return undefined;
        }
      };

      const result = await explainAlert({
        signature: alert.signature,
        category: alert.category,
        severity: alert.severity,
        src_ip: alert.src_ip,
        dest_ip: alert.dest_ip,
        proto: alert.proto,
        app_proto: alert.app_proto,
        action: alert.action,
        payload_printable: alert.payload_printable,
        http_context: parseJson(alert.http_json),
        dns_context: parseJson(alert.dns_json),
        tls_context: parseJson(alert.tls_json),
        provider,
        kimi_api_key: provider === "nim" ? kimiApiKey.trim() : null,
      });
      setExplanation(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch explanation",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    alert.signature,
    alert.category,
    alert.severity,
    alert.src_ip,
    alert.dest_ip,
    alert.proto,
    alert.app_proto,
    alert.action,
    alert.payload_printable,
    alert.http_json,
    alert.dns_json,
    alert.tls_json,
    provider,
    kimiApiKey,
  ]);

  useEffect(() => {
    if (isOpen && !explanation) {
      fetchExplanation();
    }
  }, [isOpen, explanation, fetchExplanation]);

  const handleClose = () => {
    setExplanation(null);
    setError(null);
    onClose();
  };

  const handleProviderChange = (nextProvider: AiProvider) => {
    setProvider(nextProvider);
    setExplanation(null);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Alert Explanation
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {/* Alert Info */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {alert.signature}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Category:</span> {alert.category}
              </div>
              <div>
                <span className="font-medium">Severity:</span> {alert.severity}
              </div>
              <div>
                <span className="font-medium">Source:</span> {alert.src_ip}
                {alert.src_port && `:${alert.src_port}`}
              </div>
              <div>
                <span className="font-medium">Destination:</span>{" "}
                {alert.dest_ip}
                {alert.dest_port && `:${alert.dest_port}`}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/40">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <label
                  htmlFor="ai-provider"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Explanation provider
                </label>
                <select
                  id="ai-provider"
                  value={provider}
                  onChange={(event) =>
                    handleProviderChange(event.target.value as AiProvider)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 md:min-w-64"
                >
                  <option value="ollama">Ollama</option>
                  <option value="nim">Kimi via NVIDIA NIM</option>
                </select>
              </div>
              <p className="max-w-md text-xs text-gray-500 dark:text-gray-400">
                This choice is stored for the current browser session only.
                If you use Kimi, add the API key from Settings. Ollama stays
                available even if Kimi is configured.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing alert with {getAiProviderLabel(provider)}...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h4 className="text-red-800 dark:text-red-300 font-medium mb-1">
                    Error
                  </h4>
                  <p className="text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchExplanation}
                className="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Explanation Content */}
          {explanation && !isLoading && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="rounded-full border border-gray-300 px-2 py-1 dark:border-gray-600">
                  Provider: {getAiProviderLabel(explanation.provider)}
                </span>
                <span className="rounded-full border border-gray-300 px-2 py-1 font-mono dark:border-gray-600">
                  Model: {explanation.model}
                </span>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <MarkdownContent
                  content={explanation.explanation}
                  className="text-gray-800 dark:text-gray-200"
                />
              </div>

              {explanation.sources_found > 0 && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
                  Based on {explanation.sources_found} relevant document
                  {explanation.sources_found > 1 ? "s" : ""} from the security
                  knowledge base.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
