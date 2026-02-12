/**
 * API endpoint for authenticated password updates.
 * Expects JSON: { password: string }.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    // Parse and validate request payload before updating auth profile.
    const { password } = (await req.json()) as { password?: string };

    if (!password || password.length < 6) {
        return NextResponse.json({ ok: false, message: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
