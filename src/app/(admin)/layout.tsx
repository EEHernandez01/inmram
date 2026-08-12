import { AdminShell } from "@/components/dashboard/admin-shell";

/**
 * Comparte la navegación y la sesión entre todos los módulos autenticados.
 * El grupo no cambia las URLs públicas de las rutas que contiene.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>;
}
