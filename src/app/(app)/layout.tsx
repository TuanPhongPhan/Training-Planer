/**
 * Authenticated application layout.
 * Enforces server-side session checks and renders shared app navigation.
 */
import { redirect } from "next/navigation";
import React from "react";
import {supabaseServer} from "@/lib/supabase/server";
import {BottomNav} from "@/components/bottom-nav";

export default async function AppLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const supabase = await supabaseServer();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Server-side protection (single source of truth)
    if (!user) {
        redirect("/login?next=/week");
    }

    return (
        <div className="h-dvh overflow-hidden bg-background text-foreground">
            <main className="h-full overflow-hidden px-4 pt-3 pb-24">
                {children}
            </main>

            <BottomNav />
        </div>
    );
}
