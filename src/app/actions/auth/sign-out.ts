"use server";

import { redirect } from "next/navigation";
import {supabaseServer} from "@/lib/supabase/server";

export async function signOut() {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();

    // after sign out, cookies are cleared → user becomes unauthenticated
    redirect("/login");
}
