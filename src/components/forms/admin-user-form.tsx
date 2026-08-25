"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { authClient } from "@/lib/auth/client";

type Role = "ADMINISTRADOR" | "GESTOR" | "PROPIETARIO" | "SOLO_LECTURA";
type Owner = { id: string; nombre: string; usuarioSistemaId?: string | null };
type SystemUser = { id: string; neonAuthUserId: string; rol: Role; activo: boolean; perfil: { nombreCompleto: string } | null; propietario: { id: string } | null };
type AuthUser = { id: string; email: string };

const roles: { value: Role; label: string; description: string }[] = [
  { value: "ADMINISTRADOR", label: "Administrador", description: "Control total, usuarios y actividad." },
  { value: "GESTOR", label: "Gestor", description: "Opera inmuebles, contratos y cobranza." },
  { value: "PROPIETARIO", label: "Propietario", description: "Ve sus inmuebles y registra sus pagos." },
  { value: "SOLO_LECTURA", label: "Solo lectura", description: "Consulta interna sin modificaciones." },
];

async function save(payload: unknown, method = "POST") {
  const response = await fetch("/api/configuracion/usuarios", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No fue posible guardar el usuario.");
}

function roleInfo(role: Role) { return roles.find((item) => item.value === role)!; }

export function AdminUserForm({ owners, users }: { owners: Owner[]; users: SystemUser[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState<Role>("GESTOR");
  const [emails, setEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    void authClient.admin.listUsers({ query: { limit: 100 } }).then((result) => {
      const authUsers = (result.data?.users ?? []) as AuthUser[];
      setEmails(Object.fromEntries(authUsers.map((user) => [user.id, user.email])));
    }).catch(() => undefined);
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const password = String(form.get("password") ?? "");
      if (password !== form.get("passwordConfirm")) throw new Error("Las contraseñas no coinciden.");
      const propietarioId = String(form.get("propietarioId") || "") || null;
      if (newRole === "PROPIETARIO" && !propietarioId) throw new Error("Selecciona el propietario vinculado.");
      const email = String(form.get("email")); const nombreCompleto = String(form.get("nombreCompleto"));
      const created = await authClient.admin.createUser({ email, password, name: nombreCompleto, role: "user" }, { throw: true });
      try {
        await save({ neonAuthUserId: created.user.id, rol: newRole, propietarioId, nombreCompleto });
      } catch (saveError) {
        await authClient.admin.removeUser({ userId: created.user.id }, { throw: true }).catch(() => undefined);
        throw saveError;
      }
      window.location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible crear el usuario."); setPending(false); }
  }

  async function update(user: SystemUser, form: HTMLFormElement) {
    setPending(true); setError(null);
    try {
      const data = new FormData(form);
      await save({ id: user.id, rol: data.get("rol"), activo: data.get("activo") === "on", propietarioId: String(data.get("propietarioId") || "") || null }, "PATCH");
      window.location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible actualizar el usuario."); setPending(false); }
  }

  async function reset(user: SystemUser, form: HTMLFormElement) {
    const password = String(new FormData(form).get("newPassword") || "");
    if (password.length < 8) return setError("Captura una contraseña temporal de al menos 8 caracteres.");
    try {
      await authClient.admin.setUserPassword({ userId: user.neonAuthUserId, newPassword: password }, { throw: true });
      await save({ id: user.id, action: "PASSWORD_RESET" }, "PATCH");
      form.reset(); alert("Contraseña restablecida correctamente.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible restablecer la contraseña."); }
  }

  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-bg px-4 py-3 text-sm text-ink-secondary">
      <span><strong className="text-ink">{users.filter((user) => user.activo).length}</strong> cuentas activas de {users.length}</span>
      <Button onClick={() => setCreating((value) => !value)} variant="secondary">{creating ? "Cerrar alta" : "Crear cuenta"}</Button>
    </div>

    {creating ? <form className="space-y-6 rounded-xl border border-brand/30 bg-bg/50 p-5" onSubmit={create}>
      <div><h3 className="font-serif text-xl font-semibold text-ink">Nueva cuenta</h3><p className="mt-1 text-sm text-ink-secondary">La cuenta iniciará con la contraseña temporal indicada.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre completo"><Input name="nombreCompleto" placeholder="Nombre de la persona" required /></Field><Field label="Correo electrónico"><Input autoComplete="email" name="email" placeholder="nombre@correo.com" required type="email" /></Field><Field label="Contraseña temporal"><Input autoComplete="new-password" minLength={8} name="password" required type="password" /></Field><Field label="Confirmar contraseña"><Input autoComplete="new-password" minLength={8} name="passwordConfirm" required type="password" /></Field></div>
      <fieldset><legend className="text-sm font-semibold text-ink">Rol de acceso</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{roles.map((role) => <label className={newRole === role.value ? "cursor-pointer rounded-xl border border-brand bg-brand-soft p-3" : "cursor-pointer rounded-xl border border-border bg-surface p-3"} key={role.value}><input checked={newRole === role.value} className="sr-only" name="rol" onChange={() => setNewRole(role.value)} type="radio" value={role.value} /><span className="block text-sm font-semibold text-ink">{role.label}</span><span className="mt-1 block text-xs text-ink-secondary">{role.description}</span></label>)}</div></fieldset>
      {newRole === "PROPIETARIO" ? <Field hint="Este vínculo define los inmuebles y facturas que podrá consultar." label="Propietario vinculado"><Select name="propietarioId" required><option value="">Selecciona un propietario</option>{owners.filter((owner) => !owner.usuarioSistemaId).map((owner) => <option key={owner.id} value={owner.id}>{owner.nombre}</option>)}</Select></Field> : null}
      <Button disabled={pending} type="submit">{pending ? "Creando…" : "Crear cuenta"}</Button>
    </form> : null}

    {error ? <Alert variant="danger">{error}</Alert> : null}
    <section><div className="mb-4"><h3 className="font-serif text-xl font-semibold text-ink">Cuentas existentes</h3><p className="mt-1 text-sm text-ink-secondary">Cambia los permisos, vínculos y estado de acceso de cada persona.</p></div><div className="space-y-4">{users.map((user) => {
      const role = roleInfo(user.rol);
      return <form className="rounded-xl border border-border bg-surface p-4 sm:p-5" key={user.id} onSubmit={(event) => { event.preventDefault(); void update(user, event.currentTarget); }}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ink">{user.perfil?.nombreCompleto ?? "Sin perfil"}</p><p className="mt-1 text-sm text-ink-secondary">{emails[user.neonAuthUserId] ?? "Correo no disponible"}</p></div><span className={user.activo ? "rounded-pill bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand" : "rounded-pill bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger"}>{user.activo ? "Activa" : "Desactivada"}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="Rol"><Select defaultValue={user.rol} name="rol">{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field><Field label="Propietario vinculado"><Select defaultValue={user.propietario?.id ?? ""} name="propietarioId"><option value="">No vinculado</option>{owners.filter((owner) => !owner.usuarioSistemaId || owner.id === user.propietario?.id).map((owner) => <option key={owner.id} value={owner.id}>{owner.nombre}</option>)}</Select></Field><div className="flex items-end"><label className="flex h-[42px] items-center gap-2 text-sm font-semibold text-ink"><input defaultChecked={user.activo} name="activo" type="checkbox" /> Permitir acceso</label></div></div>
        <div className="mt-5 flex flex-wrap gap-3"><Button disabled={pending} type="submit">Guardar cambios</Button><details className="rounded border border-border px-3 py-2 text-sm"><summary className="cursor-pointer font-semibold text-ink">Restablecer contraseña</summary><div className="mt-3 flex flex-wrap gap-2"><Input minLength={8} name="newPassword" placeholder="Nueva contraseña temporal" type="password" /><Button onClick={(event) => { event.preventDefault(); void reset(user, event.currentTarget.form!); }} type="button" variant="secondary">Guardar contraseña</Button></div></details></div>
        <p className="mt-4 text-xs text-ink-secondary">{role.description}</p>
      </form>;
    })}</div></section>
  </div>;
}
