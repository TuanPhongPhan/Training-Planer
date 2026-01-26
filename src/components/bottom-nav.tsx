"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
    { href: "/week", label: "Week", icon: "📅" },
    { href: "/templates", label: "Templates", icon: "🧩" },
    { href: "/log", label: "Log", icon: "✅" },
    { href: "/insights", label: "Insights", icon: "📈" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-50 bg-background/90 backdrop-blur ring-1 ring-border"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
                {tabs.map((t) => {
                    const active = pathname.startsWith(t.href);

                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            className={[
                                "relative flex w-full flex-col items-center gap-0.5 py-2 text-xs transition",
                                active
                                    ? "rounded-2xl bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-primary",
                            ].join(" ")}
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span>{t.label}</span>
                        </Link>

                    );
                })}
            </div>
        </nav>
    );
}
