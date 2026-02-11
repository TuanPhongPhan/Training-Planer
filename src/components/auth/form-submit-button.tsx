"use client";

import { useFormStatus } from "react-dom";
import React from "react";

export function FormSubmitButton({
    idleLabel,
    pendingLabel,
    className,
}: {
    idleLabel: string;
    pendingLabel: string;
    className: string;
}) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" disabled={pending} className={className}>
            <span className="inline-flex items-center justify-center gap-2">
                {pending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                ) : null}
                {pending ? pendingLabel : idleLabel}
            </span>
        </button>
    );
}
