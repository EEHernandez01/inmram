export { updateSession as proxy } from "@/lib/supabase/proxy";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/propiedades/:path*",
    "/contratos/:path*",
    "/cobranza/:path*",
    "/buscar/:path*",
    "/inflacion/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
  ],
};
