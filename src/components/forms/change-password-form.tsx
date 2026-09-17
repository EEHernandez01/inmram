"use client";

import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { authClient } from "@/lib/auth/client";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    setError(null);
    setSuccess(false);
    if (newPassword.length < 8) return setError("La nueva contraseña debe tener al menos 8 caracteres.");
    if (newPassword !== confirmation) return setError("La confirmación de contraseña no coincide.");

    setPending(true);
    try {
      await authClient.changePassword({ currentPassword, newPassword }, { throw: true });
      form.reset();
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible cambiar la contraseña.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">Contraseña actualizada correctamente.</Alert> : null}
      <div className="grid gap-5 md:grid-cols-3">
        <Field label="Contraseña actual"><Input autoComplete="current-password" name="currentPassword" required type="password" /></Field>
        <Field label="Nueva contraseña"><Input autoComplete="new-password" minLength={8} name="newPassword" required type="password" /></Field>
        <Field label="Confirmar nueva contraseña"><Input autoComplete="new-password" minLength={8} name="confirmation" required type="password" /></Field>
      </div>
      <div className="flex justify-end border-t border-brand/10 pt-5"><Button disabled={pending} type="submit">{pending ? "Actualizando…" : "Cambiar contraseña"}</Button></div>
    </form>
  );
}
