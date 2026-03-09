"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";
import Header from "@/components/layout/Header";
import UserAccessCard from "@/components/admin/UserAccessCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWebSocket } from "@/hooks/useWebSocket";
import { createUser, fetchUsers, updateUser } from "@/lib/api";
import type { CreateUserPayload, ManagedUser, UpdateUserPayload } from "@/lib/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { status } = useWebSocket();
  const {
    data,
    mutate,
    isLoading,
  } = useSWR<ManagedUser[]>(
    user?.is_admin ? "platform-users" : null,
    fetchUsers,
  );
  const [form, setForm] = useState<CreateUserPayload>({
    username: "",
    password: "",
    full_name: "",
    email: "",
    is_admin: false,
    can_access_ai: false,
    can_manage_ips: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen">
        <Header title="User Management" wsStatus={status} />
        <div className="p-6">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
            Only administrators can manage platform users.
          </div>
        </div>
      </div>
    );
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createUser(form);
      setForm({
        username: "",
        password: "",
        full_name: "",
        email: "",
        is_admin: false,
        can_access_ai: false,
        can_manage_ips: false,
      });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
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
      <Header title="User Management" wsStatus={status} />
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-app surface-2 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-strong">Create platform user</h2>
            <p className="mt-1 text-xs text-subtle">
              Create a local account and pre-stage future AI / IPS permissions.
            </p>
          </div>

          <form onSubmit={handleCreate} className="grid gap-4 lg:grid-cols-2">
            <label className="text-xs text-muted">
              Username
              <input
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                required
              />
            </label>
            <label className="text-xs text-muted">
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
                required
              />
            </label>
            <label className="text-xs text-muted">
              Full name
              <input
                value={form.full_name || ""}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
              />
            </label>
            <label className="text-xs text-muted">
              Email
              <input
                value={form.email || ""}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={form.is_admin || false}
                onChange={(event) => setForm((prev) => ({ ...prev, is_admin: event.target.checked }))}
              />
              Grant administrator access
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={form.can_access_ai || false}
                onChange={(event) => setForm((prev) => ({ ...prev, can_access_ai: event.target.checked }))}
              />
              Mark for AI access later
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={form.can_manage_ips || false}
                onChange={(event) => setForm((prev) => ({ ...prev, can_manage_ips: event.target.checked }))}
              />
              Mark for IPS control later
            </label>
            <div className="flex items-end justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create user"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-strong">Existing users</h2>
            <p className="mt-1 text-xs text-subtle">
              Enable, disable, or update account permissions and reset passwords.
            </p>
          </div>
          {isLoading ? (
            <div className="rounded-xl border border-app surface-2 p-5 text-sm text-subtle">
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
    </div>
  );
}
