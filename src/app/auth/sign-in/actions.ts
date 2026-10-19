"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export type SignInState = {
  email?: string;
  error?: string;
  invalidField?: "email" | "password";
};

export async function signInWithEmail(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const input = signInSchema.safeParse({
    email,
    password: formData.get("password"),
  });

  if (!input.success) {
    const invalidField = input.error.issues.some(
      (issue) => issue.path[0] === "email",
    )
      ? "email"
      : "password";

    return {
      email,
      error: "Revisa el correo y la contraseña capturados.",
      invalidField,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input.data);

  if (error) {
    return {
      email: input.data.email,
      error: "No fue posible iniciar sesión con esas credenciales.",
      invalidField: "password",
    };
  }

  redirect("/dashboard");
}
