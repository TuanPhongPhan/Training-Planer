"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function resendConfirmation(formData: FormData): Promise<void> {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const supabase = await supabaseServer();

    await supabase.auth.resend({
        type: "signup",
        email,
    });
}
