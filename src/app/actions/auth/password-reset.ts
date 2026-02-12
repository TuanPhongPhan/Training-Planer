"use server";

/**
 * Server actions for password-reset workflows.
 * `requestPasswordReset` sends a reset link and `updatePassword` saves a new password.
 */
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData): Promise<void> {
    // Normalize email input before passing it to Supabase.
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const supabase = await supabaseServer();

    const origin = (await headers()).get("origin") ?? "";
    const redirectTo = `${origin}/auth/callback?next=/password/reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);

    // Simple UX: send them back to log in with a hint
    redirect("/login?reset=sent");
}

export async function updatePassword(formData: FormData): Promise<void> {
    // Read the new password from the submitted form payload.
    const password = String(formData.get("password") ?? "");
    const supabase = await supabaseServer();

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);

    redirect("/week");
}
