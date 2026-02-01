"use client";
import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onClickAction: () => void;
};

export function NewTemplateButton({ onClickAction, ...props }: ButtonProps) {
    return (
        <button
            type="button"
            {...props}
            onClick={onClickAction}
            className={[
                "rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-95",
                props.className ?? "",
            ].join(" ")}
        >
            + New
        </button>
    );
}

export function AddSessionButton({ onClickAction, ...props }: ButtonProps) {
    return (
        <button
            type="button"
            {...props}
            onClick={onClickAction}
            className={[
                "rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-95",
                props.className ?? "",
            ].join(" ")}
        >
            + Add
        </button>
    );
}
