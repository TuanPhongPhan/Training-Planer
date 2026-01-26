import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;

    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/week";

    if (!code) {
        return NextResponse.redirect(`${origin}/login`);
    }

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(error.message)}`
        );
    }

    return NextResponse.redirect(`${origin}${next}`);
}
