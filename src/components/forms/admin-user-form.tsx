"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { authClient } from "@/lib/auth/client";

type Role = "ADMINISTRADOR" | "GESTOR" | "PROPIETARIO" | "SOLO_LECTURA";
type OwnerOption = { value: string; nombre: string; detalle: string };
type SystemUser = {
  id: string;
  neonAuthUserId: string;
  rol: Role;
  activo: boolean;
  propietarioId: string | null;
  propietario: { id: string; nombre: string } | null;
  perfil: { nombreCompleto: string } | null;
};
type AuthUser = { id: string; email: string };

const roles: { value: Role; label: string; description: string }[] = [
  { value: "ADMINISTRADOR", label: "Administrador", description: "Control total, usuarios y actividad." },
  { value: "GESTOR", label: "Gestor", description: "Opera inmuebles, contratos y cobranza." },
  { value: "PROPIETARIO", label: "Propietario", description: "Consulta únicamente los inmuebles y resultados de su propietario vinculado." },
  { value: "SOLO_LECTURA", label: "Solo lectura", description: "Consulta interna sin modificaciones." },
];

async function save(payload: unknown, method = "POST") {
  const response = await fetch("/api/configuracion/usuarios", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No fue posible guardar el usuario.");
}

function roleInfo(role: Role) { return roles.find((item) => item.value === role)!; }

function OwnerSelect({ value, onChange, required = false, owners }: { value: string; onChange: (value: string) => void; required?: boolean; owners: OwnerOption[] }) {
  return (
    <Field hint={owners.length === 0 ? "Primero registra un propietario en Configuración > Propietarios." : "Esta cuenta verá solo los inmuebles de este propietario."} label="Propietario vinculado">
      <Select name="propietarioId" onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        <option value="">Selecciona un propietario</option>
        {owners.map((owner) => <option key={owner.value} value={owner.value}>{owner.nombre}</option>)}
      </Select>
    </Field>
  );
}

export function AdminUserForm({ users = [], owners = [] }: { users?: SystemUser[]; owners?: OwnerOption[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState<Role>("GESTOR");
  const [newOwnerId, setNewOwnerId] = useState("");
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Role>>({});
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
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
      const email = String(form.get("email")); const nombreCompleto = String(form.get("nombreCompleto"));
      const propietarioId = newRole === "PROPIETARIO" ? newOwnerId : null;
      const created = await authClient.admin.createUser({ email, password, name: nombreCompleto, role: "user" }, { throw: true });
      try {
        await save({ neonAuthUserId: created.user.id, rol: newRole, nombreCompleto, propietarioId });
      } catch (saveError) {
        await authClient.admin.removeUser({ userId: created.user.id }, { throw: true }).catch(() => undefined);
        throw saveError;
      }
      window.location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible crear el usuario."); setPending(false); }
  }

  async function update(user: SystemUser, form: HTMLFormElement) {
    if (pending) return;
    setPending(true); setError(null);
    try {
      const data = new FormData(form);
      const rol = String(data.get("rol")) as Role;
      const propietarioId = rol === "PROPIETARIO" ? String(data.get("propietarioId") ?? "") : null;
      await save({ id: user.id, rol, activo: data.get("activo") === "on", propietarioId }, "PATCH");
      window.location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible actualizar el usuario."); setPending(false); }
  }

  async function reset(user: SystemUser, form: HTMLFormElement) {
    const password = String(new FormData(form).get("newPassword") || "");
    if (password.length < 8) return setError("Captura una nueva contraseña de al menos 8 caracteres.");
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
      <div><h3 className="font-serif text-xl font-semibold text-ink">Nueva cuenta</h3><p className="mt-1 text-sm text-ink-secondary">Define la contraseña de acceso para esta cuenta.</p></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre completo"><Input name="nombreCompleto" placeholder="Nombre de la persona" required /></Field><Field label="Correo electrónico"><Input autoComplete="email" name="email" placeholder="nombre@correo.com" required type="email" /></Field><Field label="Contraseña"><Input autoComplete="new-password" minLength={8} name="password" required type="password" /></Field><Field label="Confirmar contraseña"><Input autoComplete="new-password" minLength={8} name="passwordConfirm" required type="password" /></Field></div>
      <fieldset><legend className="text-sm font-semibold text-ink">Rol de acceso</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{roles.map((role) => <label className={newRole === role.value ? "cursor-pointer rounded-xl border border-brand bg-brand-soft p-3" : "cursor-pointer rounded-xl border border-border bg-surface p-3"} key={role.value}><input checked={newRole === role.value} className="sr-only" name="rol" onChange={() => setNewRole(role.value)} type="radio" value={role.value} /><span className="block text-sm font-semibold text-ink">{role.label}</span><span className="mt-1 block text-xs text-ink-secondary">{role.description}</span></label>)}</div></fieldset>
      {newRole === "PROPIETARIO" ? <OwnerSelect onChange={setNewOwnerId} owners={owners} required value={newOwnerId} /> : null}
      <Button disabled={pending || (newRole === "PROPIETARIO" && owners.length === 0)} type="submit">{pending ? "Creando…" : "Crear cuenta"}</Button>
    </form> : null}

    {error ? <Alert variant="danger">{error}</Alert> : null}
    <section><div className="mb-4"><h3 className="font-serif text-xl font-semibold text-ink">Cuentas existentes</h3><p className="mt-1 text-sm text-ink-secondary">Cambia los permisos, vínculos y estado de acceso de cada persona.</p></div><div className="space-y-4">{users.map((user) => {
      const role = roleInfo(user.rol);
      const selectedRole = roleDrafts[user.id] ?? user.rol;
      const selectedOwnerId = ownerDrafts[user.id] ?? user.propietarioId ?? "";
      return <form className="rounded-xl border border-border bg-surface p-4 sm:p-5" key={user.id} onSubmit={(event) => { event.preventDefault(); void update(user, event.currentTarget); }}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ink">{user.perfil?.nombreCompleto ?? "Sin perfil"}</p><p className="mt-1 text-sm text-ink-secondary">{emails[user.neonAuthUserId] ?? "Correo no disponible"}</p>{user.propietario ? <p className="mt-1 text-xs font-semibold text-brand">Vinculado a: {user.propietario.nombre}</p> : null}</div><span className={user.activo ? "rounded-pill bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand" : "rounded-pill bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger"}>{user.activo ? "Activa" : "Desactivada"}</span></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="Rol"><Select name="rol" onChange={(event) => setRoleDrafts((drafts) => ({ ...drafts, [user.id]: event.target.value as Role }))} value={selectedRole}>{roles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field><div className="flex items-end"><label className="flex h-[42px] items-center gap-2 text-sm font-semibold text-ink"><input defaultChecked={user.activo} name="activo" type="checkbox" /> Permitir acceso</label></div></div>
        {selectedRole === "PROPIETARIO" ? <div className="mt-4 max-w-md"><OwnerSelect onChange={(value) => setOwnerDrafts((drafts) => ({ ...drafts, [user.id]: value }))} owners={owners} required value={selectedOwnerId} /></div> : null}
        <div className="mt-5 flex flex-wrap gap-3"><Button disabled={pending || (selectedRole === "PROPIETARIO" && owners.length === 0)} type="submit">Guardar cambios</Button><details className="rounded border border-border px-3 py-2 text-sm"><summary className="cursor-pointer font-semibold text-ink">Restablecer contraseña</summary><div className="mt-3 flex flex-wrap gap-2"><Input minLength={8} name="newPassword" placeholder="Nueva contraseña" type="password" /><Button onClick={(event) => { event.preventDefault(); void reset(user, event.currentTarget.form!); }} type="button" variant="secondary">Guardar contraseña</Button></div></details></div>
        <p className="mt-4 text-xs text-ink-secondary">{role.description}</p>
      </form>;
    })}</div></section>
  </div>;
}
