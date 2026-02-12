"use client";

/**
 * Training log page.
 * Displays completed sessions with filter controls and grouped daily views.
 */
import * as React from "react";
import {LogDaySection} from "@/components/log/LogDaySection";
import {SessionBlock} from "@/components/session-block";
import {CompletedSession} from "@/lib/types";
import {getCompletedSessions, isNotAuthenticatedError} from "@/lib/storage";
import {useEffect, useMemo, useRef, useState} from "react";
import {CollapsingScroll} from "@/components/collapsing-scroll";
import { EmptyStateBlock, ErrorStateBlock, LoadingStateBlock } from "@/components/ui/state-block";
import { useRouter } from "next/navigation";

function useCompletedSessions(onAuthExpired: () => void): {
    sessions: CompletedSession[];
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
} {
    // Centralized loader for completed sessions with auth-expiration handling.
    const [sessions, setSessions] = useState<CompletedSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setSessions(await getCompletedSessions());
        } catch (loadError) {
            if (isNotAuthenticatedError(loadError)) {
                setError("Session expired. Please sign in again.");
                onAuthExpired();
                return;
            }
            console.error(loadError);
            setError("Could not load completed sessions.");
        } finally {
            setLoading(false);
        }
    }, [onAuthExpired]);

    React.useEffect(() => {
        void reload();
    }, [reload]);

    return { sessions, loading, error, reload };
}

export default function LogPage() {
    const router = useRouter();
    const handleAuthExpired = React.useCallback(() => {
        router.replace("/login?next=/log&session=expired");
    }, [router]);
    const { sessions, loading, error, reload } = useCompletedSessions(handleAuthExpired);

    type DateRange = "THIS_WEEK" | "LAST_7" | "THIS_MONTH" | "ALL_TIME";
    type TypeFilter = "ALL" | "BADMINTON" | "GYM" | "RECOVERY";
    type StatusFilter = "ALL" | "COMPLETED";

    const [openMenu, setOpenMenu] = useState<null | "date" | "type" | "status">(null);

    // applied filters (used for filtering)
    const [appliedDate, setAppliedDate] = useState<DateRange>("THIS_WEEK");
    const [appliedType, setAppliedType] = useState<TypeFilter>("ALL");
    const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("ALL");

    // draft filters (controlled by dropdowns)
    const [draftDate, setDraftDate] = useState<DateRange>("THIS_WEEK");
    const [draftType, setDraftType] = useState<TypeFilter>("ALL");
    const [draftStatus, setDraftStatus] = useState<StatusFilter>("ALL");


    const filtered = useMemo(() => {
        const now = new Date();

        const inRange = (iso: string) => {
            if (appliedDate === "ALL_TIME") return true;

            const d = new Date(iso + "T00:00:00");

            if (appliedDate === "LAST_7") {
                const from = new Date(now);
                from.setDate(now.getDate() - 6);
                from.setHours(0, 0, 0, 0);
                return d >= from;
            }

            if (appliedDate === "THIS_MONTH") {
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            }

            // THIS_WEEK (Mon..Sun)
            const day = now.getDay(); // 0 Sun .. 6 Sat
            const mondayOffset = (day + 6) % 7;
            const monday = new Date(now);
            monday.setDate(now.getDate() - mondayOffset);
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            return d >= monday && d <= sunday;
        };

        return sessions.filter((s) => {
            if (!inRange(s.dateISO)) return false;

            if (appliedType !== "ALL" && s.type !== appliedType) return false;

            // CompletedSession is always completed, so only filter out if user asked for a status that isn't completed.
            return !(appliedStatus !== "ALL" && appliedStatus !== "COMPLETED");

        });
    }, [sessions, appliedDate, appliedType, appliedStatus]);

    const grouped = groupByDay(filtered);

    return (
            <CollapsingScroll
                title="Log"
                subtitle="Review what you actually did across the week."
                meta={
                    <p className="text-xs text-muted-foreground sm:hidden">
                        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                    </p>
                }
            >

                {/* Filters */}
                {error ? (
                    <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-500/30" role="alert" aria-live="assertive">
                        {error}
                    </div>
                ) : null}
                <div className="rounded-2xl bg-card ring-1 ring-border px-3 py-2">
                    <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        <div className="mr-1 text-xs font-semibold text-muted-foreground">Filters</div>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                            <DropdownPill
                                label="Date"
                                value={dateLabel(draftDate)}
                                open={openMenu === "date"}
                                onOpen={() => setOpenMenu(openMenu === "date" ? null : "date")}
                                onClose={() => setOpenMenu(null)}
                                items={[
                                    {value: "THIS_WEEK", label: "This week"},
                                    {value: "LAST_7", label: "Last 7 days"},
                                    {value: "THIS_MONTH", label: "This month"},
                                    {value: "ALL_TIME", label: "All time"},
                                ]}
                                onSelect={(v) => setDraftDate(v as DateRange)}
                            />

                            <DropdownPill
                                label="Type"
                                value={typeLabel(draftType)}
                                open={openMenu === "type"}
                                onOpen={() => setOpenMenu(openMenu === "type" ? null : "type")}
                                onClose={() => setOpenMenu(null)}
                                items={[
                                    {value: "ALL", label: "All types"},
                                    {value: "BADMINTON", label: "Badminton"},
                                    {value: "GYM", label: "Gym"},
                                    {value: "RECOVERY", label: "Recovery"},
                                ]}
                                onSelect={(v) => setDraftType(v as TypeFilter)}
                            />

                            <div className="col-span-2 sm:col-span-1">
                                <DropdownPill
                                    label="Status"
                                    value={statusLabel(draftStatus)}
                                    open={openMenu === "status"}
                                    onOpen={() => setOpenMenu(openMenu === "status" ? null : "status")}
                                    onClose={() => setOpenMenu(null)}
                                    items={[
                                        {value: "ALL", label: "All statuses"},
                                        {value: "COMPLETED", label: "Completed"},
                                    ]}
                                    onSelect={(v) => setDraftStatus(v as StatusFilter)}
                                />
                            </div>
                        </div>

                        <div
                            className="ml-auto flex items-center gap-2 border-t border-border pt-2 sm:border-none sm:pt-0">
                        <span className="hidden sm:inline text-xs text-muted-foreground">
                            {filtered.length} items
                        </span>

                            <button
                                data-testid="filter-apply"
                                type="button"
                                onClick={() => {
                                    setAppliedDate(draftDate);
                                    setAppliedType(draftType);
                                    setAppliedStatus(draftStatus);
                                }}
                                disabled={
                                    draftDate === appliedDate &&
                                    draftType === appliedType &&
                                    draftStatus === appliedStatus
                                }
                                className={[
                                    "h-8 rounded-full px-4 text-xs font-semibold ring-1 transition-colors",
                                    draftDate === appliedDate &&
                                    draftType === appliedType &&
                                    draftStatus === appliedStatus
                                        ? "bg-muted text-muted-foreground ring-border cursor-not-allowed"
                                        : "bg-primary text-primary-foreground ring-primary/20 hover:opacity-95",
                                ].join(" ")}
                            >
                                Apply
                            </button>

                            <button
                                data-testid="filter-clear"
                                type="button"
                                onClick={() => {
                                    setDraftDate("THIS_WEEK");
                                    setDraftType("ALL");
                                    setDraftStatus("ALL");
                                    setAppliedDate("THIS_WEEK");
                                    setAppliedType("ALL");
                                    setAppliedStatus("ALL");
                                }}
                                className="h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>


                <div className="space-y-8">
                    {loading ? (
                        <LoadingStateBlock label="Loading completed sessions..." />
                    ) : error ? (
                        <ErrorStateBlock title="Unable to load log" subtitle={error} onRetryAction={() => void reload()} />
                    ) : grouped.length === 0 ? (
                        <EmptyStateBlock title="No completed sessions yet." subtitle="Complete a planned session to start building your log." />
                    ) : grouped.map((g) => (
                        <LogDaySection key={g.key} title={g.title} subtitle={g.subtitle}>
                            {g.items.map((s) => (
                                <SessionBlock
                                    key={s.id}
                                    session={s}
                                    mode="log"
                                />
                            ))}
                        </LogDaySection>
                    ))}
                </div>
            </CollapsingScroll>
    );
}

function groupByDay(items: CompletedSession[]) {
    const map = new Map<string, CompletedSession[]>();

    for (const it of items) {
        map.set(it.dateISO, [...(map.get(it.dateISO) ?? []), it]);
    }

    // newest day first
    const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));

    return keys.map((k) => {
        const d = new Date(k + "T00:00:00");

        return {
            key: k,
            title: humanDayLabel(d),
            subtitle: d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            }),
            items: map.get(k)!,
        };
    });
}

function humanDayLabel(d: Date) {
    const today = new Date();
    const t0 = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    ).getTime();

    const d0 = d.getTime();
    const diffDays = Math.round((t0 - d0) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";

    return d.toLocaleDateString(undefined, {weekday: "long"});
}

function DropdownPill({
                          label,
                          value,
                          open,
                          onOpen,
                          onClose,
                          items,
                          onSelect,
                      }: {
    label: string;
    value: string;
    open: boolean;
    onOpen: () => void;
    onClose: () => void;
    items: { value: string; label: string }[];
    onSelect: (value: string) => void;
}) {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            const el = ref.current;
            if (!el) return;
            if (e.target instanceof Node && !el.contains(e.target)) onClose();
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("mousedown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={onOpen}
                className={[
                    "h-8 rounded-full px-3 text-xs font-semibold ring-1 transition-colors",
                    open
                        ? "bg-primary text-primary-foreground ring-primary/20 shadow-sm"
                        : "bg-muted/40 text-foreground ring-border hover:bg-muted/60",
                ].join(" ")}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="text-muted-foreground">{label}:</span>{" "}
                <span className={open ? "" : "text-foreground"}>{value}</span>
                <span className="ml-2 opacity-70">▾</span>
            </button>

            {open ? (
                <div
                    role="menu"
                    className="absolute left-0 mt-2 w-56 overflow-hidden rounded-2xl bg-card ring-1 ring-border shadow-lg z-50"
                >
                    <div className="p-1">
                        {items.map((it) => (
                            <button
                                key={it.value}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    onSelect(it.value);
                                    onClose();
                                }}
                                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
                            >
                                {it.label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function dateLabel(v: "THIS_WEEK" | "LAST_7" | "THIS_MONTH" | "ALL_TIME") {
    if (v === "THIS_WEEK") return "This week";
    if (v === "LAST_7") return "Last 7 days";
    if (v === "THIS_MONTH") return "This month";
    return "All time";
}

function typeLabel(v: "ALL" | "BADMINTON" | "GYM" | "RECOVERY") {
    if (v === "ALL") return "All types";
    if (v === "BADMINTON") return "Badminton";
    if (v === "GYM") return "Gym";
    return "Recovery";
}

function statusLabel(v: "ALL" | "COMPLETED") {
    if (v === "ALL") return "All statuses";
    return "Completed";
}

