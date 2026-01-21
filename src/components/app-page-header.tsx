"use client";

import React from "react";

export function AppPageHeader({
                                  title,
                                  subtitle,
                                  right,
                              }: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
}) {
    return (
        <div
            className="bg-background/90 pt-1.5 pb-2 backdrop-blur"
            style={{ paddingTop: "max(env(safe-area-inset-top), 0.5rem)" }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    ) : null}
                </div>
                {right ? <div className="shrink-0">{right}</div> : null}
            </div>
        </div>
    );
}
