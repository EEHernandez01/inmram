import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const getCurrentSession = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    throw new Error("No fue posible validar la sesión actual.", {
      cause: error,
    });
  }

  const claims = data?.claims;
  if (!claims?.sub) return null;

  return {
    user: {
      id: claims.sub,
      email: claims.email ?? "",
      name: typeof claims.user_metadata?.name === "string" ? claims.user_metadata.name : "",
    },
  };
});

export const requireSession = cache(async () => {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return session;
});
