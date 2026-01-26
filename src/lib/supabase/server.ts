import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Type-guard: in some contexts cookieStore is readonly (no .set)
function canSetCookies(
    store: Awaited<ReturnType<typeof cookies>>,
): store is Awaited<ReturnType<typeof cookies>> & { set: (...args: unknown[]) => unknown } {
    return typeof (store as { set?: unknown }).set === "function";
}

export async function supabaseServer(): Promise<SupabaseClient> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

    const cookieStore = await cookies();

    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet: CookieToSet[]) {
                try {
                    if (!canSetCookies(cookieStore)) return;
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                } catch {
                    // If called from a Server Component, setting cookies may fail.
                    // In Route Handlers (like /auth/callback) it works.
                }
            },
        },
    });
}
