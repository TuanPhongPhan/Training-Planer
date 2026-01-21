"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const tabs = [
    { href: "/week", label: "Week", icon: "📅" },
    { href: "/templates", label: "Templates", icon: "🧩" },
    { href: "/log", label: "Log", icon: "✅" },
    { href: "/insights", label: "Insights", icon: "📈" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="h-dvh overflow-hidden bg-background text-foreground">
            {/* Main content: add bottom padding so it doesn’t go under the tab bar */}
            <main className="h-full overflow-hidden px-4 pt-3 pb-24">
                {children}
            </main>

            {/* Bottom Tab Bar */}
            <nav
                className="fixed inset-x-0 bottom-0 z-50 bg-background/90 backdrop-blur ring-1 ring-border"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
                    {tabs.map((t) => {
                        const active = pathname === t.href || pathname.startsWith(t.href + "/");
                        return (
                            <Link
                                key={t.href}
                                href={t.href}
                                className={[
                                    "flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-xs font-medium transition",
                                    active ? "text-primary bg-primary/10" : "text-muted-foreground",
                                ].join(" ")}
                            >
                                <span className="text-lg leading-none">{t.icon}</span>
                                <span className="leading-none">{t.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
