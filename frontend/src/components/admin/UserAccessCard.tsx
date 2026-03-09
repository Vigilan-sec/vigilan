"use client";

import { useState } from "react";
import type { ManagedUser, UpdateUserPayload } from "@/lib/types";

interface UserAccessCardProps {
  user: ManagedUser;
  onSave: (userId: number, payload: UpdateUserPayload) => Promise<void>;
}

export default function UserAccessCard({ user, onSave }: UserAccessCardProps) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [email, setEmail] = useState(user.email || "");
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [disabled, setDisabled] = useState(user.disabled);
  const [canAccessAi, setCanAccessAi] = useState(user.can_access_ai);
  const [canManageIps, setCanManageIps] = useState(user.can_manage_ips);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(user.id, {
        full_name: fullName || null,
        email: email || null,
        is_admin: isAdmin,
        disabled,
        can_access_ai: canAccessAi,
        can_manage_ips: canManageIps,
        new_password: newPassword || undefined,
      });
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-app surface-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-strong">{user.username}</h3>
          <p className="mt-1 text-xs text-subtle">
            Created {new Date(user.created_at).toLocaleString("fr-FR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
          <span className="rounded-full border border-app px-2 py-1 text-subtle">
            {user.is_admin ? "admin" : "platform user"}
          </span>
          <span
            className={`rounded-full border px-2 py-1 ${
              user.disabled
                ? "border-red-500/30 text-red-300"
                : "border-emerald-500/30 text-emerald-300"
            }`}
          >
            {user.disabled ? "disabled" : "enabled"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs text-muted">
          Full name
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
            placeholder="Optional display name"
          />
        </label>
        <label className="text-xs text-muted">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
            placeholder="Optional contact email"
          />
        </label>
        <label className="text-xs text-muted md:col-span-2">
          Reset password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm input-base"
            placeholder="Leave empty to keep current password"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
          <input type="checkbox" checked={isAdmin} onChange={(event) => setIsAdmin(event.target.checked)} />
          Admin access
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
          <input type="checkbox" checked={canAccessAi} onChange={(event) => setCanAccessAi(event.target.checked)} />
          AI access later
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
          <input type="checkbox" checked={canManageIps} onChange={(event) => setCanManageIps(event.target.checked)} />
          IPS control later
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-app surface-1 px-3 py-2 text-xs text-muted">
          <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.target.checked)} />
          Disable account
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-subtle">
          Last login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString("fr-FR") : "Never"}
        </p>
        <button
          type="button"
          onClick={() => void saveChanges()}
          disabled={saving}
          className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
