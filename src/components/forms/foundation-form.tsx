"use client";

import { useActionState } from "react";

import type { FoundationActionState } from "@/app/_actions/foundation";
import { FormStatus } from "@/components/ui/form-status";

const initialState: FoundationActionState = {};

export function FoundationForm({
  action,
  children,
  submitLabel,
}: {
  action: (
    state: FoundationActionState | undefined,
    formData: FormData,
  ) => Promise<FoundationActionState | undefined>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {children}
      <FormStatus message={state?.error} />
      <button
        className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
