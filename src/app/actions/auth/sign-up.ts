"use server";

/**
 * Server action that creates a new account using email and password.
 */
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function signUp(formData: FormData): Promise<void> {
    // Keep email format consistent for auth lookup and deduplication.
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const supabase = await supabaseServer();

    const { error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    redirect("/login");
}
