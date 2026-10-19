export { updateSession as proxy } from "@/lib/supabase/proxy";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/propiedades/:path*",
    "/contratos/:path*",
    "/cobranza/:path*",
    "/inflacion/:path*",
    "/agua/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
  ],
};
