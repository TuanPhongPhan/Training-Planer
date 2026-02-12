"use client";

import React from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getFocusable(container: HTMLElement | null): HTMLElement[] {
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
    );
}

export function Dialog({
    open,
    onCloseAction,
    children,
    containerClassName,
    panelClassName,
    closeOnBackdrop = true,
    ariaLabelledBy,
    ariaDescribedBy,
}: {
    open: boolean;
    onCloseAction: () => void;
    children: React.ReactNode;
    containerClassName?: string;
    panelClassName?: string;
    closeOnBackdrop?: boolean;
    ariaLabelledBy?: string;
    ariaDescribedBy?: string;
}) {
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
        if (!open) return;

        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const focusInitial = () => {
            const focusable = getFocusable(panelRef.current);
            if (focusable.length > 0) {
                focusable[0].focus();
            } else {
                panelRef.current?.focus();
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onCloseAction();
                return;
            }

            if (event.key !== "Tab") return;
            const focusable = getFocusable(panelRef.current);
            if (focusable.length === 0) {
                event.preventDefault();
                panelRef.current?.focus();
                return;
            }

            const current = document.activeElement as HTMLElement | null;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && current === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && current === last) {
                event.preventDefault();
                first.focus();
            }
        };

        const timer = window.setTimeout(focusInitial, 0);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            window.clearTimeout(timer);
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = originalOverflow;
            previouslyFocusedRef.current?.focus?.();
        };
    }, [open, onCloseAction]);

    if (!open) return null;

    return (
        <div
            className={[
                "fixed inset-0 z-50 bg-black/30",
                "flex items-center justify-center p-3 sm:p-4",
                containerClassName ?? "",
            ].join(" ")}
            onMouseDown={(e) => {
                if (!closeOnBackdrop) return;
                if (e.target === e.currentTarget) onCloseAction();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
                tabIndex={-1}
                className={panelClassName}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
