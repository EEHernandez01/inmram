import { AdminShell } from "@/components/dashboard/admin-shell";

export const dynamic = "force-dynamic";

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
