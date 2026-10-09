"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignOutButton({ className = "" }: { className?: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsPending(true);
    setError(null);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setError("No fue posible cerrar la sesión. Inténtalo nuevamente.");
        return;
      }

      window.location.replace("/auth/sign-in");
    } catch {
      setError("No fue posible cerrar la sesión. Inténtalo nuevamente.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className={`flex items-center rounded-xl border border-border bg-bg px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        disabled={isPending}
        onClick={handleSignOut}
        type="button"
      >
        <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-secondary" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
        {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
