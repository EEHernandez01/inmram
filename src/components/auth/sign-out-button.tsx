"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
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
        className="rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleSignOut}
        type="button"
      >
        {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}
