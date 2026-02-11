import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function authProxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet: CookieToSet[]) {
                for (const { name, value } of cookiesToSet) {
                    request.cookies.set(name, value);
                }

                response = NextResponse.next({
                    request: {
                        headers: request.headers,
                    },
                });

                for (const { name, value, options } of cookiesToSet) {
                    response.cookies.set(name, value, options);
                }
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const loggedIn = Boolean(user);

    const PUBLIC = ["/", "/login", "/signup", "/password/forgot", "/password/reset", "/auth/callback"];

    if (loggedIn && ["/login", "/signup", "/password/forgot"].includes(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/week";
        return NextResponse.redirect(url);
    }

    if (PUBLIC.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
        return NextResponse.next();
    }

    if (!loggedIn) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    return response;
}
