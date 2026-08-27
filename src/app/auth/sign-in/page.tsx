"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert } from "@/components/ui/alert";
import { signInWithEmail, type SignInState } from "./actions";

const initialState: SignInState = {};

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(
    signInWithEmail,
    initialState,
  );
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.error) return;

    const target = state.invalidField === "email" ? emailRef : passwordRef;
    target.current?.focus();
  }, [state.error, state.invalidField]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-10">
      <section className="w-full max-w-md rounded-card border border-border bg-surface p-6 sm:p-8">
        <div className="mb-8">
          <p className="font-serif text-lg font-semibold text-brand">
            INMOBILIARIA RAMOS-ROSCH
          </p>
          <h1 className="mt-5 font-serif text-2xl font-semibold text-ink">
            Acceso al sistema
          </h1>
          <p className="mt-2 text-sm text-ink-secondary">
            Ingresa con la cuenta asignada por el administrador.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          <div>
            <label
              className="mb-2 block text-sm font-semibold text-ink"
              htmlFor="email"
            >
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              aria-describedby={state.error ? "sign-in-error" : undefined}
              aria-invalid={state.invalidField === "email"}
              className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-secondary focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              defaultValue={state.email}
              id="email"
              name="email"
              placeholder="nombre@empresa.com"
              ref={emailRef}
              required
              type="email"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-ink"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              aria-describedby={state.error ? "sign-in-error" : undefined}
              aria-invalid={state.invalidField === "password"}
              className="w-full rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-secondary focus:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              id="password"
              minLength={8}
              name="password"
              placeholder="Tu contraseña"
              ref={passwordRef}
              required
              type="password"
            />
          </div>

          {state.error ? (
            <Alert id="sign-in-error" variant="danger">
              {state.error}
            </Alert>
          ) : null}

          <button
            className="w-full rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Validando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-secondary">
          El registro público está deshabilitado. Solicita una cuenta al
          administrador del sistema.
        </p>
      </section>
    </main>
  );
}
