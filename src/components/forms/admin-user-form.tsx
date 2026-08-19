"use client";

import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { authClient } from "@/lib/auth/client";

type AdminUserResponse = {
  error?: string;
  id?: string;
};

export function AdminUserForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError(null);
    setSuccess(null);
    setPending(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

    if (password !== passwordConfirm) {
      setPending(false);
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const createdUser = await authClient.admin.createUser(
        {
          email,
          password,
          name: email.split("@")[0] || email,
          role: "admin",
        },
        { throw: true },
      );

      const response = await fetch("/api/configuracion/usuarios", {
        body: JSON.stringify({
          neonAuthUserId: createdUser.data.user.id,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json().catch(() => ({}))) as AdminUserResponse;

      if (!response.ok) {
        try {
          await authClient.admin.removeUser(
            { userId: createdUser.data.user.id },
            { throw: true },
          );
        } catch {
          // Si el rollback falla, dejamos el error original visible.
        }

        throw new Error(payload.error || "No fue posible registrar el usuario.");
      }

      setSuccess("Usuario administrativo creado correctamente.");
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible registrar el usuario.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <Field label="Correo electrónico" hint="La cuenta se creará en Neon Auth con este correo.">
          <Input autoComplete="email" maxLength={254} name="email" required type="email" />
        </Field>
        <Field label="Contraseña" hint="Se guardará en Neon Auth; no se almacena en UsuarioSistema.">
          <Input autoComplete="new-password" minLength={8} name="password" required type="password" />
        </Field>
        <Field label="Confirmar contraseña">
          <Input autoComplete="new-password" minLength={8} name="passwordConfirm" required type="password" />
        </Field>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}
      {success ? <Alert variant="success">{success}</Alert> : null}

      <Button
        disabled={pending}
        type="submit"
      >
        {pending ? "Registrando…" : "Crear usuario"}
      </Button>
    </form>
  );
}