"use client";

import { FormEvent, useEffect, useState } from "react";
import useSWR from "swr";

import UserAccessCard from "@/components/admin/UserAccessCard";
import { useAuth } from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  getAiProviderLabel,
  useAiProviderPreference,
} from "@/hooks/useAiProviderPreference";
import { useWebSocket } from "@/hooks/useWebSocket";
import { createUser, fetchUsers, updateUser } from "@/lib/api";
import type { CreateUserPayload, ManagedUser, UpdateUserPayload } from "@/lib/types";

const emptyUserForm: CreateUserPayload = {
  username: "",
  password: "",
  full_name: "",
  email: "",
  is_admin: false,
  can_access_ai: false,
  can_manage_ips: false,
};

export default function SettingsPage() {
  const { status } = useWebSocket();
  const { user } = useAuth();
  const { provider } = useAiProviderPreference();
  const { kimiApiKey, setKimiApiKey } = useAppSettings();
  const {
    data,
    mutate,
    isLoading,
  } = useSWR<ManagedUser[]>(user?.is_admin ? "platform-users" : null, fetchUsers);
  const [draftKey, setDraftKey] = useState(kimiApiKey);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUserPayload>(emptyUserForm);
  const [submitting, setSubmitting] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

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

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setUserError(null);
    try {
      await createUser(form);
      setForm(emptyUserForm);
      await mutate();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (userId: number, payload: UpdateUserPayload) => {
    await updateUser(userId, payload);
    await mutate();
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
                className="btn-primary rounded-md border px-4 py-2 text-sm font-semibold transition-colors"
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
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-strong">User management</h2>
            <p className="mt-1 text-xs text-subtle">
              Create local accounts and update access rights directly from the
              settings page.
            </p>
          </div>

          {!user?.is_admin ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              Only administrators can manage platform users.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl border border-app surface-1 p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-strong">Create platform user</h3>
                  <p className="mt-1 text-xs text-subtle">
                    Create a local account and pre-stage future AI / IPS permissions.
                  </p>
                </div>

                <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-2">
                  <label className="text-xs text-muted">
                    Username
                    <input
                      value={form.username}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, username: event.target.value }))
                      }
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                      required
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Password
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                      required
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Full name
                    <input
                      value={form.full_name || ""}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, full_name: event.target.value }))
                      }
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Email
                    <input
                      value={form.email || ""}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-app surface-2 px-3 py-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.is_admin || false}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, is_admin: event.target.checked }))
                      }
                    />
                    Grant administrator access
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-app surface-2 px-3 py-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.can_access_ai || false}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, can_access_ai: event.target.checked }))
                      }
                    />
                    Mark for AI access later
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-app surface-2 px-3 py-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={form.can_manage_ips || false}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, can_manage_ips: event.target.checked }))
                      }
                    />
                    Mark for IPS control later
                  </label>
                  <div className="flex items-end justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary rounded-md border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Creating..." : "Create user"}
                    </button>
                  </div>
                </form>

                {userError && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {userError}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-strong">Existing users</h3>
                  <p className="mt-1 text-xs text-subtle">
                    Enable, disable, or update account permissions and reset passwords.
                  </p>
                </div>
                {isLoading ? (
                  <div className="rounded-xl border border-app surface-1 p-5 text-sm text-subtle">
                    Loading users...
                  </div>
                ) : (
                  (data || []).map((managedUser) => (
                    <UserAccessCard
                      key={`${managedUser.id}-${managedUser.disabled}-${managedUser.is_admin}-${managedUser.can_access_ai}-${managedUser.can_manage_ips}-${managedUser.full_name ?? ""}-${managedUser.email ?? ""}`}
                      user={managedUser}
                      onSave={handleUpdate}
                    />
                  ))
                )}
              </div>
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
