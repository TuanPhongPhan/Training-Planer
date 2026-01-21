"use client";

import React from "react";

export function CollapsingScroll({
                                     title,
                                     subtitle,
                                     right,
                                     meta,
                                     children,
                                 }: {
    title: string;
    subtitle?: string;
    meta?: React.ReactNode;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    const ref = React.useRef<HTMLDivElement | null>(null);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onScroll = () => setScrolled(el.scrollTop > 12);
        onScroll();

        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div
            ref={ref}
            className="h-full overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            {/* Sticky compact header */}
            <div className="sticky top-0 z-30 -mx-4 px-4">
                <div
                    className={[
                        "bg-background/80 backdrop-blur transition-all duration-200 ease-out overflow-hidden",
                        scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent",
                        // IMPORTANT: collapse height when not scrolled
                        scrolled ? "max-h-20 opacity-100" : "max-h-0 opacity-0",
                    ].join(" ")}
                    style={scrolled ? { paddingTop: "max(env(safe-area-inset-top), 0.75rem)" } : undefined}
                >
                    <div className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold tracking-tight">{title}</div>
                            {subtitle ? (
                                <div className="text-[11px] text-muted-foreground">{subtitle}</div>
                            ) : null}
                        </div>
                        {right ? <div className="shrink-0">{right}</div> : null}
                    </div>
                </div>
            </div>


            {/* Large header (scrolls away) */}
            <div className="px-4 pt-2 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                        {subtitle ? (
                            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                        ) : null}
                        {meta ? <div className="mt-2">{meta}</div> : null}
                    </div>
                    {right ? <div className="shrink-0">{right}</div> : null}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-24 space-y-6">
                {children}
            </div>
        </div>
    );
}
