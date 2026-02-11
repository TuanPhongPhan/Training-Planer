"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const tabs = [
    { href: "/week", label: "Week", icon: WeekIcon },
    { href: "/templates", label: "Templates", icon: TemplatesIcon },
    { href: "/log", label: "Log", icon: LogIcon },
    { href: "/insights", label: "Insights", icon: InsightsIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 bg-background/90 backdrop-blur ring-1 ring-border"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
                {tabs.map((t) => {
                    const active = pathname.startsWith(t.href);
                    const Icon = t.icon;

                    return (
                        <Link
                            key={t.href}
                            href={t.href}
                            aria-current={active ? "page" : undefined}
                            className={[
                                "relative flex w-full flex-col items-center gap-1 py-2 text-xs transition",
                                active
                                    ? "rounded-2xl bg-primary/12 text-primary font-semibold ring-1 ring-primary/20"
                                    : "text-muted-foreground hover:text-foreground",
                            ].join(" ")}
                        >
                            <Icon active={active} />
                            <span>{t.label}</span>
                        </Link>

                    );
                })}
            </div>
        </nav>
    );
}

function WeekIcon({ active }: { active: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={["h-5 w-5", active ? "opacity-100" : "opacity-80"].join(" ")} fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function TemplatesIcon({ active }: { active: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={["h-5 w-5", active ? "opacity-100" : "opacity-80"].join(" ")} fill="none" aria-hidden="true">
            <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" stroke="currentColor" strokeWidth="1.6" />
        </svg>
    );
}

function LogIcon({ active }: { active: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={["h-5 w-5", active ? "opacity-100" : "opacity-80"].join(" ")} fill="none" aria-hidden="true">
            <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 12l2.4 2.4L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function InsightsIcon({ active }: { active: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={["h-5 w-5", active ? "opacity-100" : "opacity-80"].join(" ")} fill="none" aria-hidden="true">
            <path d="M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M6 15l3-3 3 2 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SettingsIcon({ active }: { active: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={["h-5 w-5", active ? "opacity-100" : "opacity-80"].join(" ")} fill="none" aria-hidden="true">
            <path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.2 1.2 0 0 1 0 1.7l-1.1 1.1a1.2 1.2 0 0 1-1.7 0l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.2 1.2 0 0 1-1.2 1.2h-1.6A1.2 1.2 0 0 1 11 20v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.2 1.2 0 0 1-1.7 0L6.4 18a1.2 1.2 0 0 1 0-1.7l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H5.6A1.2 1.2 0 0 1 4.4 13v-2A1.2 1.2 0 0 1 5.6 9.8h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.2 1.2 0 0 1 0-1.7l1.1-1.1a1.2 1.2 0 0 1 1.7 0l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4A1.2 1.2 0 0 1 12.2 2.8h1.6A1.2 1.2 0 0 1 15 4v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a1.2 1.2 0 0 1 1.7 0l1.1 1.1a1.2 1.2 0 0 1 0 1.7l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2A1.2 1.2 0 0 1 21.6 11v2a1.2 1.2 0 0 1-1.2 1.2h-.2a1 1 0 0 0-.8.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
