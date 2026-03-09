"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState("https:");
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setNextPath(params.get("next") || "/");
    }, 0);
  }, []);
  useEffect(() => {
    window.setTimeout(() => setProtocol(window.location.protocol), 0);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, nextPath, router, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_40%),var(--surface-1)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-app surface-2 p-8 shadow-2xl shadow-black/20">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Vigilan Secure Console</p>
          <h1 className="mt-2 text-2xl font-semibold text-strong">Local admin sign-in</h1>
          <p className="mt-2 text-sm text-subtle">
            Sign in with the local admin account to access alerts, flows, playbooks, and live cyber views.
          </p>
        </div>

        {protocol !== "https:" && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            Secure cookies require the HTTPS gateway. Open the UI from{" "}
            <span className="font-mono">https://localhost:3443</span>.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-muted">
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-2 w-full rounded-md border px-3 py-2.5 text-sm input-base"
              autoComplete="username"
              required
            />
          </label>
          <label className="block text-sm text-muted">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border px-3 py-2.5 text-sm input-base"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-blue-500/20 px-4 py-2.5 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-app surface-1 px-4 py-3 text-xs text-subtle">
          Local-only auth is backed by the backend SQLite database and secured with an HttpOnly session cookie.
        </div>
      </div>
    </div>
  );
}
