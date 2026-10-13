import { validCronAuthorization } from "@/lib/http/route-security";
import { sincronizarIndiceInpcBanxico } from "@/lib/services/inflation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!validCronAuthorization(request)) return Response.json({ error: "No autorizado." }, { status: 401 });

  return Response.json(await sincronizarIndiceInpcBanxico());
}
