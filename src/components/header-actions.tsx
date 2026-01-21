"use client";

export function NewTemplateButton({
                                      onClickAction,
                                  }: {
    onClickAction: () => void;
}) {
    return (
        <button
            onClick={onClickAction}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold
                 text-primary-foreground shadow-sm active:scale-95"
        >
            + New
        </button>
    );
}

export function AddSessionButton({
                                     onClickAction,
                                 }: {
    onClickAction: () => void;
}) {
    return (
        <button
            onClick={onClickAction}
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold
                 text-primary-foreground shadow-sm active:scale-95"
        >
            + Add
        </button>
    );
}
