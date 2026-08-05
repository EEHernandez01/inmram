import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/server";

export const getCurrentSession = cache(async () => {
  const { data, error } = await auth.getSession();

  if (error) {
    throw new Error("No fue posible validar la sesión actual.", {
      cause: error,
    });
  }

  return data;
});

export const requireSession = cache(async () => {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return session;
});
