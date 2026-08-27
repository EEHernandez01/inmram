import "server-only";

import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { DomainError } from "@/lib/domain/errors";

export function isSameOrigin(request: Request) {
  const url = new URL(request.url);
  return request.headers.get("origin") === url.origin;
}

export function sameOriginRedirectUrl(
  request: Request,
  destination: FormDataEntryValue | null,
  fallback: string,
) {
  const requestUrl = new URL(request.url);
  const candidate = new URL(String(destination ?? fallback), requestUrl);
  return candidate.origin === requestUrl.origin
    ? candidate
    : new URL(fallback, requestUrl);
}

export function safeRouteError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Revisa los datos capturados.";
  }
  if (error instanceof DomainError) return error.message;
  return "No fue posible completar la operación.";
}

export function validCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const provided = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
