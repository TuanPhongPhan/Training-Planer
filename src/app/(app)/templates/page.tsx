"use client";

import {useEffect, useMemo, useState} from "react";
import { Template, listTemplates, createTemplate, deleteTemplate } from "@/lib/storage";
import {StatusDot} from "@/components/status-dot";
import {AppPageHeader} from "@/components/app-page-header";
import {NewTemplateButton} from "@/components/header-actions";
import {ensureSeeded} from "@/lib/lib";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateBlock, ErrorStateBlock, LoadingStateBlock } from "@/components/ui/state-block";

const TYPE_LABEL: Record<Template["type"], string> = {
    BADMINTON: "Badminton",
    GYM: "Gym",
    RECOVERY: "Recovery",
};

const TYPE_TINT: Record<Template["type"], string> = {
    BADMINTON: "bg-sky-100",
    GYM: "bg-emerald-100",
    RECOVERY: "bg-violet-100",
};

type TypeFilter = "ALL" | Template["type"];

export default function TemplatesPage() {
    const [hydrated, setHydrated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [filter, setFilter] = useState<TypeFilter>("ALL");

    // Modal (bottom sheet)
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<Omit<Template, "id">>({
        type: "BADMINTON",
        title: "",
        durationMin: 60,
        rpeDefault: 6,
        focusTags: [],
    });
    const [tagText, setTagText] = useState("");

    async function reloadTemplates() {
        setLoading(true);
        setLoadError(null);
        try {
            await ensureSeeded();
            const rows = await listTemplates();
            setTemplates(rows);
        } catch (error) {
            console.error(error);
            setLoadError("Could not load templates. Please try again.");
        } finally {
            setHydrated(true);
            setLoading(false);
        }
    }

    useEffect(() => {
        void reloadTemplates();
    }, []);

    const counts = useMemo(() => {
        const c = { ALL: templates.length, BADMINTON: 0, GYM: 0, RECOVERY: 0 };
        for (const t of templates) c[t.type] += 1;
        return c;
    }, [templates]);

    const visible = useMemo(() => {
        if (filter === "ALL") return templates;
        return templates.filter((t) => t.type === filter);
    }, [templates, filter]);

    const grouped = useMemo(() => {
        const g: Record<Template["type"], Template[]> = { BADMINTON: [], GYM: [], RECOVERY: [] };
        for (const t of visible) g[t.type].push(t);
        for (const k of Object.keys(g) as Template["type"][]) g[k].sort((a, b) => a.title.localeCompare(b.title));
        return g;
    }, [visible]);

    function openNew() {
        setDraft({ type: "BADMINTON", title: "", durationMin: 60, rpeDefault: 6, focusTags: [] });
        setTagText("");
        setIsOpen(true);
    }

    async function removeTemplate(id: string) {
        const prev = templates;
        setTemplates((p) => p.filter((t) => t.id !== id));
        try {
            await deleteTemplate(id);
        } catch (e) {
            setTemplates(prev);
            console.error(e);
        }
    }

    async function addTemplate() {
        const title = draft.title.trim();
        if (!title) return;

        const tags = normalizeTags(tagText.split(",").map((s) => s.trim()).filter(Boolean));

        // optimistic
        const optimistic: Template = { id: crypto.randomUUID(), ...draft, title, focusTags: tags };
        setTemplates((p) => [...p, optimistic]);
        setIsOpen(false);

        try {
            const created = await createTemplate({
                type: optimistic.type,
                title: optimistic.title,
                durationMin: optimistic.durationMin,
                rpeDefault: optimistic.rpeDefault,
                focusTags: optimistic.focusTags,
            });
            setTemplates((p) => p.map((t) => (t.id === optimistic.id ? created : t)));
        } catch (e) {
            setTemplates((p) => p.filter((t) => t.id !== optimistic.id));
            console.error(e);
        }
    }


    if (!hydrated) {
        return (
            <div className="relative h-dvh overflow-hidden px-4 pb-24 pt-4">
                <LoadingStateBlock label="Preparing templates..." />
            </div>
        );
    }

    return (
        <div className="relative h-dvh overflow-hidden px-4 pb-24">
            <div className="flex h-full flex-col">
                <div className="shrink-0 space-y-3 pt-2">
                    <AppPageHeader
                        title="Templates"
                        subtitle="Save reusable sessions for fast planning."
                        right={<NewTemplateButton data-testid="create-template" onClickAction={openNew} />}
                    />

                    <div className="rounded-3xl bg-background p-2 ring-1 ring-border shadow-sm">
                        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                            <FilterPill label="All" count={counts.ALL} active={filter === "ALL"} onClick={() => setFilter("ALL")} />
                            <FilterPill
                                label="Badminton"
                                count={counts.BADMINTON}
                                active={filter === "BADMINTON"}
                                onClick={() => setFilter("BADMINTON")}
                            />
                            <FilterPill label="Gym" count={counts.GYM} active={filter === "GYM"} onClick={() => setFilter("GYM")} />
                            <FilterPill
                                label="Recovery"
                                count={counts.RECOVERY}
                                active={filter === "RECOVERY"}
                                onClick={() => setFilter("RECOVERY")}
                            />
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pt-3">
                    {loading ? (
                        <LoadingStateBlock label="Loading templates..." />
                    ) : loadError ? (
                        <ErrorStateBlock title="Unable to load templates" subtitle={loadError} onRetry={() => void reloadTemplates()} />
                    ) : visible.length === 0 ? (
                        <EmptyStateBlock
                            title="No templates yet."
                            subtitle="Create one reusable session to speed up planning."
                            action={
                                <button
                                    type="button"
                                    onClick={openNew}
                                    className="rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                                >
                                    New template
                                </button>
                            }
                        />
                    ) : (
                        <div className="space-y-5">
                            {(["BADMINTON", "GYM", "RECOVERY"] as const).map((type) => {
                                const items = grouped[type];
                                if (items.length === 0) return null;
                                return (
                                    <section key={type} className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="text-xs font-semibold text-muted-foreground">{TYPE_LABEL[type]}</div>
                                            <div className="text-xs text-muted-foreground">{items.length}</div>
                                        </div>

                                        <div className="space-y-3">
                                            {items.map((t) => (
                                                <TemplateCard key={t.id} t={t} onDelete={() => removeTemplate(t.id)} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={isOpen}
                onClose={() => setIsOpen(false)}
                ariaLabelledBy="new-template-title"
                ariaDescribedBy="new-template-description"
                containerClassName="items-end sm:items-center sm:p-4"
                panelClassName={
                    "flex w-full flex-col bg-card ring-1 ring-border shadow-xl " +
                    "rounded-t-3xl sm:rounded-3xl sm:max-w-lg " +
                    "max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5.5rem)] " +
                    "sm:max-h-[calc(100dvh-2rem)] overflow-hidden " +
                    "pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
                }
            >
                        <div className="px-5 pt-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 id="new-template-title" className="text-lg font-semibold tracking-tight">New template</h2>
                                    <p id="new-template-description" className="text-sm text-muted-foreground">Type, duration, default RPE and tags.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-full bg-muted px-3 py-1 text-xs font-semibold ring-1 ring-border active:scale-[0.98]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4">
                            <div className="space-y-4">
                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Type</span>
                                    <select
                                        value={draft.type}
                                        onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as Template["type"] }))}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                    >
                                        <option value="BADMINTON">Badminton</option>
                                        <option value="GYM">Gym</option>
                                        <option value="RECOVERY">Recovery</option>
                                    </select>
                                </label>

                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Title</span>
                                    <input
                                        data-testid="template-name"
                                        value={draft.title}
                                        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                        placeholder="e.g., Net + Drops"
                                    />
                                </label>

                                <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
                                    <div className="text-xs font-semibold text-muted-foreground">Defaults</div>

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="grid gap-1">
                                            <span className="text-xs font-medium text-muted-foreground">Duration (min)</span>
                                            <input
                                                type="number"
                                                min={10}
                                                step={5}
                                                value={draft.durationMin}
                                                onChange={(e) => setDraft((d) => ({ ...d, durationMin: Number(e.target.value) }))}
                                                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                            />
                                        </label>

                                        <label className="grid gap-1">
                                            <span className="text-xs font-medium text-muted-foreground">Default RPE (1–10)</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={draft.rpeDefault}
                                                onChange={(e) => setDraft((d) => ({ ...d, rpeDefault: Number(e.target.value) }))}
                                                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Tags (comma separated)</span>
                                    <input
                                        value={tagText}
                                        onChange={(e) => setTagText(e.target.value)}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                        placeholder="footwork, defense"
                                    />
                                    <div className="text-xs text-muted-foreground">Optional. Helps search & grouping later.</div>
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-border bg-card/95 px-5 pt-3 backdrop-blur">
                            <div className="flex gap-2 pb-2">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 rounded-2xl bg-muted px-4 py-2 text-sm font-medium ring-1 ring-border active:scale-[0.98]"
                                >
                                    Cancel
                                </button>

                                <button
                                    data-testid="template-save"
                                    onClick={addTemplate}
                                    className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-[0.98]"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
            </Dialog>
        </div>
    );
}

function FilterPill({
                        label,
                        count,
                        active,
                        onClick,
                    }: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition border active:scale-[0.98]",
                active ? "bg-primary text-primary-foreground border-primary/20 shadow-sm" : "bg-card text-foreground border-border hover:bg-muted",
            ].join(" ")}
        >
            <span className="inline-flex items-center gap-2">
                {label}
                <span
                    className={[
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        active
                            ? "bg-primary-foreground/15 text-primary-foreground"
                            : "bg-muted text-muted-foreground border border-border",
                        ].join(" ")}
                >
                    {count}
                </span>
            </span>
        </button>
    );
}

function TemplateCard({ t, onDelete }: { t: Template; onDelete: () => void }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    return (
        <div
            data-testid="template-card"
            className="group relative w-full overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-sm"
        >
            {/* left tint */}
            <div className={["absolute inset-y-0 left-0 w-16", TYPE_TINT[t.type]].join(" ")} />

            {/* status dot */}
            <StatusDot type={t.type} className="absolute left-3 top-3" />

            <div className="relative flex gap-3 p-4 pl-20">
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/20">
                                    {TYPE_LABEL[t.type]}
                                </span>

                                {t.focusTags?.length ? (
                                    <span className="truncate rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                                        {t.focusTags.slice(0, 2).join(" • ")}
                                        {t.focusTags.length > 2 ? ` +${t.focusTags.length - 2}` : ""}
                                    </span>
                                ) : null}
                            </div>

                            {/* Match Week title size */}
                            <div className="mt-2 text-sm font-semibold leading-5 line-clamp-2">{t.title}</div>
                            <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {t.durationMin} min · RPE {t.rpeDefault}
                            </div>
                        </div>

                        {/* Actions (anchored) */}
                        <button
                            data-testid="template-menu-open"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((v) => !v);
                                setConfirmOpen(false);
                            }}
                            className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="More"
                        >
                            ⋯
                        </button>



                        {/* MENU POPOVER */}
                            {menuOpen ? (
                                <div
                                    className="absolute right-0 top-9 z-20 w-44 rounded-2xl bg-card p-1 ring-1 ring-border shadow-lg"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                >
                                    <button
                                        data-testid="template-delete-open"
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            setConfirmOpen(true);
                                        }}
                                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-500/10"
                                    >
                                        Delete…
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

            {/* CONFIRM OVERLAY */}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                ariaLabelledBy={`delete-template-title-${t.id}`}
                ariaDescribedBy={`delete-template-description-${t.id}`}
                containerClassName="items-end sm:items-center p-0 sm:p-4"
                panelClassName="w-full rounded-t-3xl bg-card p-5 ring-1 ring-border shadow-xl sm:max-w-sm sm:rounded-3xl"
            >
                <h2 id={`delete-template-title-${t.id}`} className="text-sm font-semibold">Delete template?</h2>
                <p id={`delete-template-description-${t.id}`} className="mt-1 text-sm text-muted-foreground">
                    This action can’t be undone.
                </p>

                <div className="mt-5 space-y-2">
                    <button
                        data-testid="template-delete-confirm"
                        onClick={onDelete}
                        className="w-full rounded-2xl bg-rose-600 px-4 py-3
                                text-sm font-semibold text-white
                                shadow-sm active:scale-[0.98]"
                    >
                        Delete
                    </button>

                    <button
                        data-testid="template-delete-cancel"
                        onClick={() => setConfirmOpen(false)}
                        className="w-full rounded-2xl bg-muted px-4 py-3
                                text-sm font-medium ring-1 ring-border
                                active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                </div>
            </Dialog>


            {/* click-away close for the menu */}
            {menuOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                />
            ) : null}
        </div>
    );
}

function normalizeTags(tags: string[]) {
    return Array.from(new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean)));
}
