import { Sidebar } from "@/components/dashboard/sidebar";
import { getSystemUser } from "@/lib/auth/authorization";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const { session, user } = await getSystemUser();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar
        alias={user.perfil?.alias}
        email={session.user.email}
        name={user.perfil?.nombreCompleto || session.user.name || session.user.email}
        role={user.rol}
      />
      <div className="lg:pl-[272px]">
        <main className="mx-auto max-w-[1280px] px-5 py-7 sm:px-9 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
