"use client";

import React from "react";

function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-3xl bg-card p-4 ring-1 ring-border shadow-sm">
            <div className="rounded-2xl bg-muted/45 p-4 ring-1 ring-border">{children}</div>
        </div>
    );
}

export function EmptyStateBlock({
    title,
    subtitle,
    action,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}) {
    return (
        <Wrapper>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            {action ? <div className="mt-3">{action}</div> : null}
        </Wrapper>
    );
}

export function ErrorStateBlock({
    title = "Something went wrong",
    subtitle,
    retryLabel = "Try again",
    onRetry,
}: {
    title?: string;
    subtitle?: string;
    retryLabel?: string;
    onRetry?: () => void;
}) {
    return (
        <Wrapper>
            <div role="alert" aria-live="assertive">
            <div className="text-sm font-semibold text-rose-700">{title}</div>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            {onRetry ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-xl bg-card px-3 py-1.5 text-sm font-medium ring-1 ring-border hover:bg-muted"
                >
                    {retryLabel}
                </button>
            ) : null}
            </div>
        </Wrapper>
    );
}

export function LoadingStateBlock({ label = "Loading..." }: { label?: string }) {
    return (
        <Wrapper>
            <div className="space-y-2" role="status" aria-live="polite">
                <div className="h-4 w-32 rounded bg-muted-foreground/20" />
                <div className="h-3 w-full rounded bg-muted-foreground/15" />
                <div className="h-3 w-2/3 rounded bg-muted-foreground/15" />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{label}</div>
        </Wrapper>
    );
}
