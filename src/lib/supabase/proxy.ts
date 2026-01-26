import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function authProxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const loggedIn = request.cookies.getAll().some((c) =>
        /^sb-.*-auth-token$/.test(c.name)
    );

    const PUBLIC = ["/", "/login", "/signup", "/forgot-password", "/auth/callback"];

    if (loggedIn && ["/login", "/signup", "/forgot-password"].includes(pathname)) {
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

    return NextResponse.next();
}
