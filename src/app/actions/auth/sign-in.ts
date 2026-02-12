"use server";

/**
 * Server action that authenticates a user with email/password.
 */
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function signIn(formData: FormData): Promise<void> {
    // Normalize credential fields from submitted form data.
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        if (
            error.message.toLowerCase().includes("email") &&
            error.message.toLowerCase().includes("confirm")
        ) {
            redirect("/login?error=email-not-verified");
        }

        redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/week");
}
