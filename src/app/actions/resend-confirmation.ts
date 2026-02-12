"use server";

/**
 * Server action that re-sends the signup confirmation email.
 */
import { supabaseServer } from "@/lib/supabase/server";

export async function resendConfirmation(formData: FormData): Promise<void> {
    // Normalize user input before passing to the auth provider.
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const supabase = await supabaseServer();

    await supabase.auth.resend({
        type: "signup",
        email,
    });
}
