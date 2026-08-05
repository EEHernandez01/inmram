import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/propiedades/:path*",
    "/contratos/:path*",
    "/cobranza/:path*",
    "/inflacion/:path*",
    "/inflacion/:path*",
    "/agua/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
  ],
};
