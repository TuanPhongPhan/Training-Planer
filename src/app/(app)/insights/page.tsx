"use client";

import {CompletedSession, computeLoad, SessionType} from "@/lib/types";
import {StatusDot} from "@/components/status-dot";
import React, { useState} from "react";
import {getCompletedSessions, listCompletedRange} from "@/lib/storage";
import {CollapsingScroll} from "@/components/collapsing-scroll";
import { EmptyStateBlock, ErrorStateBlock, LoadingStateBlock } from "@/components/ui/state-block";

type RangeKey = "7d" | "30d" | "custom";

const TYPE_LABEL: Record<SessionType, string> = {
    BADMINTON: "Badminton",
    GYM: "Workout",
    RECOVERY: "Recovery",
}

const TYPE_CHIP: Record<SessionType, string> = {
    BADMINTON: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
    GYM: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
    RECOVERY: "bg-violet-500/10 text-violet-700 ring-violet-500/20",
}

const TYPE_BAR: Record<SessionType, string> = {
    BADMINTON: "bg-sky-500/70",
    GYM: "bg-emerald-500/70",
    RECOVERY: "bg-violet-500/70",
};


const DOW_LABEL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

// Convert a Date to an ISO date string (YYYY-MM-DD)
function toISODate(date: Date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

// Monday = 0, Sunday = 6
function mondayIndex(date: Date) {
    const js = date.getDay(); // 0 (Sun) - 6 (Sat)
    return (js + 6) % 7; // 0 (Mon) - 6 (Sun)
}

function startOfWeekMonday(date: Date) {
    const idx = mondayIndex(date);
    return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -idx);
}

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

function formatHoursMinutes(totalMinutes: number) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h <= 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

function withinInclusive(dateISO: string, startISO: string, endISO: string) {
    // ISO YYYY-MM-DD compares lexicographically correctly
    return dateISO >= startISO && dateISO <= endISO;
}

function getRangeStartEnd(
    range: RangeKey,
    customStart?: string | null,
    customEnd?: string | null
) {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (range === "custom" && customStart && customEnd) {
        const start = new Date(customStart + "T00:00:00");
        const endDate = new Date(customEnd + "T00:00:00");

        const days =
            Math.round((endDate.getTime() - start.getTime()) / 86400000) + 1;

        return {
            startISO: toISODate(start),
            endISO: toISODate(endDate),
            days,
        };
    }

    const days = range === "7d" ? 7 : 30;
    const start = addDays(end, -days + 1);

    return {
        startISO: toISODate(start),
        endISO: toISODate(end),
        days,
    };
}


function mostCommonTitle(items: CompletedSession[]) {
    const map = new Map<string, number>();
    for (const s of items) map.set(s.title, (map.get(s.title) ?? 0) + 1);
    let best = { title: "-", n: 0 };
    for (const [title, n] of map.entries()) {
        if (n > best.n) {
            best = { title, n };
        }
    }
    return best.title;
}

function getLastNDaysRange(days: number) {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = addDays(end, -days + 1);
    return {
        startISO: toISODate(start),
        endISO: toISODate(end),
    };
}

function computeStreak(completed: CompletedSession[]) {
    if (completed.length === 0) return 0;

    const set = new Set<string>();
    for (const s of completed) set.add(s.dateISO);

    // streak ending today (if no session today, streak is 0)
    const todayISO = toISODate(new Date());
    if (!set.has(todayISO)) return 0;

    let streak = 0;
    let cursor = new Date();
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());

    while (true) {
        const iso = toISODate(cursor);
        if (!set.has(iso)) break;
        streak += 1;
        cursor = addDays(cursor, -1);
    }

    return streak;
}

function weekdayCountsLastNDays(completed: CompletedSession[], n: number) {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = addDays(end, -n + 1);
    const startISO = toISODate(start);
    const endISO = toISODate(end);

    const counts = Array(7).fill(0) as number[];
    for (const s of completed) {
        if (!withinInclusive(s.dateISO, startISO, endISO)) continue;
        const d = new Date(`${s.dateISO}T00:00:00`);
        const idx = mondayIndex(d);
        counts[idx] += 1;
    }
    return counts;
}

function typeTotals(items: CompletedSession[]) {
    const totals: Record<SessionType, { count: number; minutes: number; load: number }> = {
        BADMINTON: {count: 0, minutes: 0, load: 0},
        GYM: {count: 0, minutes: 0, load: 0},
        RECOVERY: {count: 0, minutes: 0, load: 0},
    };

    for (const s of items) {
        totals[s.type].count += 1;
        totals[s.type].minutes += s.durationMin;
        totals[s.type].load += computeLoad(s.durationMin, s.rpe);
    }

    return totals;
}

function BarRow({
                    label,
                    value,
                    pct,
                    right,
                    barClassName,
                    barAriaLabel,
                }: {
    label: React.ReactNode;
    value: string;
    pct: number;
    right?: React.ReactNode;
    barClassName?: string;
    barAriaLabel?: string;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 truncate text-sm">{label}</div>
                <div className="shrink-0 text-xs text-muted-foreground">{value}</div>
            </div>

            <div className="h-2 w-full rounded-full bg-muted ring-1 ring-border overflow-hidden">
                <div
                    className={["h-full transition-all duration-300 ease-out", barClassName ?? "bg-foreground/70"].join(" ")}
                    style={{width: `${Math.round(clamp01(pct) * 100)}%`}}
                    role="img"
                    aria-label={barAriaLabel}
                />
            </div>

            {right ? <div className="text-[11px] text-muted-foreground">{right}</div> : null}
        </div>
    );
}


function StatCard({
                      label,
                      value,
                      sub,
                  }: {
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
            {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
        </div>
    );
}

function Section({
                     title,
                     right,
                     children,
                 }: {
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
                <h2 className="text-sm font-semibold">{title}</h2>
                {right ? <div className="shrink-0">{right}</div> : null}
            </div>
            {children}
        </section>
    );
}

function Segmented({
                       value,
                       onChange,
                   }: {
    value: RangeKey;
    onChange: (v: RangeKey) => void;
}) {
    const base =
        "inline-flex items-center gap-1 rounded-full bg-muted p-1 ring-1 ring-border";
    const btn =
        "rounded-full px-3 py-1.5 text-xs font-medium transition";
    const active = "bg-card text-foreground shadow-sm ring-1 ring-border";
    const inactive = "text-muted-foreground hover:text-foreground";

    return (
        <div className={base} role="tablist" aria-label="Range">
            <button
                type="button"
                onClick={() => onChange("7d")}
                className={[btn, value === "7d" ? active : inactive].join(" ")}
                role="tab"
                aria-selected={value === "7d"}
            >
                7d
            </button>
            <button
                type="button"
                onClick={() => onChange("30d")}
                className={[btn, value === "30d" ? active : inactive].join(" ")}
                role="tab"
                aria-selected={value === "30d"}
            >
                30d
            </button>
            <button
                type="button"
                onClick={() => onChange("custom")}
                className={[btn, value === "custom" ? active : inactive].join(" ")}
            >
                Custom
            </button>
        </div>
    );
}

function WeeklyConsistency({completed}: { completed: CompletedSession[] }) {
    const now = new Date();
    const weekStart = startOfWeekMonday(now);
    const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
    const dayISO = days.map(toISODate);

    const byDate = new Map<string, CompletedSession[]>();
    for (const iso of dayISO) byDate.set(iso, []);
    for (const s of completed) {
        if (byDate.has(s.dateISO)) byDate.get(s.dateISO)!.push(s);
    }

    return (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((d, idx) => {
                    const iso = dayISO[idx];
                    const items = (byDate.get(iso) ?? [])
                        .slice()
                        .sort((a, b) => a.startTime.localeCompare(b.startTime));
                    const isToday = iso === toISODate(new Date());

                    // dots (mobile: 2, sm+: 3)
                    const maxDotsMobile = 2;
                    const maxDotsSm = 3;

                    const visibleMobile = items.slice(0, maxDotsMobile);
                    const extraMobile = Math.max(0, items.length - visibleMobile.length);

                    const visibleSm = items.slice(0, maxDotsSm);
                    const extraSm = Math.max(0, items.length - visibleSm.length);

                    return (
                        <div
                            key={iso}
                            className={[
                                "rounded-xl ring-1",
                                // tighter on mobile, roomier on larger screens
                                "px-1.5 py-2 sm:px-2 sm:py-2.5",
                                // subtle today highlight
                                isToday ? "bg-muted ring-border" : "bg-transparent ring-transparent",
                            ].join(" ")}
                        >
                            {/* label */}
                            <div className="flex flex-col items-center leading-none">
                                <div className="text-[10px] sm:text-[11px] font-medium text-foreground/80">
                                    {DOW_LABEL[idx]}
                                </div>
                                <div className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground">
                                    {d.getDate()}
                                </div>
                            </div>

                            {/* dots */}
                            <div className="mt-2 flex items-center justify-center gap-1">
                                {/* Mobile (<sm) */}
                                <div className="flex items-center justify-center gap-1 sm:hidden">
                                    {visibleMobile.length === 0 ? (
                                        <span className="h-2.5 w-2.5 rounded-full bg-muted ring-1 ring-border"/>
                                    ) : (
                                        visibleMobile.map((s) => <StatusDot key={s.id} type={s.type} size="sm"/>)
                                    )}

                                    {extraMobile > 0 ? (
                                        <span className="ml-0.5 text-[10px] text-muted-foreground">+{extraMobile}</span>
                                    ) : null}
                                </div>

                                {/* SM+ (>=sm) */}
                                <div className="hidden sm:flex items-center justify-center gap-1">
                                    {visibleSm.length === 0 ? (
                                        <span className="h-2 w-2 rounded-full bg-muted ring-1 ring-border"/>
                                    ) : (
                                        visibleSm.map((s) => <StatusDot key={s.id} type={s.type} size="sm"/>)
                                    )}

                                    {extraSm > 0 ? (
                                        <span className="ml-0.5 text-[10px] text-muted-foreground">+{extraSm}</span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function EmptyState() {
    return (
        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-6">
            <div className="text-sm font-semibold">No completed sessions yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
                Complete a session in your Week plan to unlock Insights.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 ring-1 ring-border">
          <StatusDot type="BADMINTON" size="sm"/> Badminton
        </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 ring-1 ring-border">
          <StatusDot type="GYM" size="sm"/> Workout
        </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 ring-1 ring-border">
          <StatusDot type="RECOVERY" size="sm"/> Recovery
        </span>
            </div>
        </div>
    );
}

export default function InsightsPage() {
    const [range, setRange] = useState<RangeKey>("7d");
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd, setCustomEnd] = useState<string>("");
    const [reloadNonce, setReloadNonce] = useState(0);

    const [{ startISO, endISO, days }, setRangeInfo] = useState(() =>
        getRangeStartEnd("7d", "", "")
    );

    const [rangeCompleted, setRangeCompleted] = useState<CompletedSession[]>([]);
    const [allCompleted, setAllCompleted] = useState<CompletedSession[]>([]);
    const [last30Completed, setLast30Completed] = useState<CompletedSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const customMissing = range === "custom" && (!customStart || !customEnd);
    const customInvalid = range === "custom" && !!customStart && !!customEnd && customStart > customEnd;
    const customBlocked = customMissing || customInvalid;

    React.useEffect(() => {
        const info = getRangeStartEnd(range, customStart, customEnd);
        setRangeInfo(info);

        if (customMissing) {
            setLoading(false);
            setLoadError(null);
            setRangeCompleted([]);
            return;
        }

        if (customInvalid) {
            setLoading(false);
            setLoadError("Custom range is invalid: start date must be on or before end date.");
            setRangeCompleted([]);
            return;
        }

        setLoading(true);
        setLoadError(null);
        const last30 = getLastNDaysRange(30);

        Promise.all([
            listCompletedRange(info.startISO, info.endISO),
            listCompletedRange(last30.startISO, last30.endISO),
            getCompletedSessions(),
        ])
            .then(([inRange, last30Range, allTime]) => {
                setRangeCompleted(inRange);
                setLast30Completed(last30Range);
                setAllCompleted(allTime);
            })
            .catch((error) => {
                console.error(error);
                setLoadError("Could not load insights for this range.");
            })
            .finally(() => setLoading(false));
    }, [range, customStart, customEnd, customMissing, customInvalid, reloadNonce]);

    const rangeItems = React.useMemo(() => {
        return rangeCompleted
            .slice()
            .sort((a, b) => {
                const d = a.dateISO.localeCompare(b.dateISO);
                if (d !== 0) return d;
                return a.startTime.localeCompare(b.startTime);
            });
    }, [rangeCompleted]);

    const totals = React.useMemo(() => typeTotals(rangeItems), [rangeItems]);

    const totalSessions = rangeItems.length;
    const totalMinutes = rangeItems.reduce((acc, s) => acc + s.durationMin, 0);
    const totalLoad = rangeItems.reduce((acc, s) => acc + computeLoad(s.durationMin, s.rpe), 0);

    const commonTitle = React.useMemo(() => mostCommonTitle(rangeItems), [rangeItems]);
    const streak = React.useMemo(() => computeStreak(allCompleted), [allCompleted]);

    const weekdayCounts30 = React.useMemo(() => weekdayCountsLastNDays(last30Completed, 30), [last30Completed]);
    const bestDayIdx = React.useMemo(() => {
        let best = 0;
        for (let i = 1; i < 7; i++) if (weekdayCounts30[i] > weekdayCounts30[best]) best = i;
        return best;
    }, [weekdayCounts30]);

    const bestType = React.useMemo(() => {
        const entries = (Object.keys(totals) as SessionType[]).map((t) => [t, totals[t].count] as const);
        entries.sort((a, b) => b[1] - a[1]);
        return entries[0]?.[0] ?? "BADMINTON";
    }, [totals]);

    const plannedHint = React.useMemo(() => {
        // Friendly guidance text based on balance
        const b = totals.BADMINTON.count;
        const g = totals.GYM.count;
        const r = totals.RECOVERY.count;

        if (totalSessions === 0) return "Log a completed session to see patterns.";
        if (r === 0 && totalSessions >= 5) return "You’ve trained a lot—consider adding 1 recovery session.";
        if (b > 0 && g === 0 && totalSessions >= 3) return "Nice badminton focus—adding a gym day could boost stability/power.";
        if (g > 0 && b === 0 && totalSessions >= 3) return "Good gym consistency—try adding a badminton session for skill work.";
        return "Keep it steady—small consistency beats big spikes.";
    }, [totals, totalSessions]);

    const maxCount = Math.max(
        totals.BADMINTON.count,
        totals.GYM.count,
        totals.RECOVERY.count,
        1
    );

    if (loading) {
        return (
            <CollapsingScroll title="Insights" subtitle="Patterns from your completed training.">
                <LoadingStateBlock label="Loading insights..." />
            </CollapsingScroll>
        );
    }

    return (
        <CollapsingScroll
            title="Insights"
            subtitle="Patterns from your completed training."
            right={<Segmented value={range} onChange={setRange}/>}
            meta={
                <div className="text-xs text-muted-foreground">
                    Range: <span className="font-medium">{startISO}</span> →{" "}
                    <span className="font-medium">{endISO}</span>
                </div>
            }
        >
            {range === "custom" && (
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={customStart ?? ""}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="rounded-lg bg-card ring-1 ring-border px-2 py-1"
                        />
                        <span className="text-muted-foreground">→</span>
                        <input
                            type="date"
                            value={customEnd ?? ""}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="rounded-lg bg-card ring-1 ring-border px-2 py-1"
                        />
                    </div>
                    {customMissing ? (
                        <p className="text-muted-foreground">Select both start and end dates to load custom insights.</p>
                    ) : null}
                    {customInvalid ? (
                        <p className="text-rose-700">Start date must be on or before end date.</p>
                    ) : null}
                </div>
            )}

            {customBlocked ? (
                <EmptyStateBlock
                    title="Custom range pending"
                    subtitle="Choose a valid start and end date to calculate metrics."
                />
            ) : loadError ? (
                <ErrorStateBlock
                    title="Unable to load insights"
                    subtitle={loadError}
                    onRetry={() => setReloadNonce((n) => n + 1)}
                />
            ) : rangeCompleted.length === 0 ? (
                <EmptyState/>
            ) : (
                <>
                    {/* Overview */}
                    <Section title="Overview">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <StatCard
                                label={`Sessions (${range})`}
                                value={totalSessions}
                                sub={totalSessions === 0 ? "No activity in range" : `${Math.round(totalSessions / days * 10) / 10}/day`}
                            />
                            <StatCard
                                label="Total time"
                                value={formatHoursMinutes(totalMinutes)}
                                sub={totalMinutes === 0 ? "—" : `${Math.round(totalMinutes / Math.max(totalSessions, 1))}m avg`}
                            />
                            <StatCard
                                label="Training load"
                                value={totalLoad}
                                sub={totalLoad === 0 ? "—" : `~${Math.round(totalLoad / Math.max(totalSessions, 1))} avg`}
                            />
                            <StatCard
                                label="Streak"
                                value={`${streak}d`}
                                sub={streak === 0 ? "No session today" : "Ending today"}
                            />
                        </div>

                        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Most common:</span>{" "}
                                    <span className="font-semibold">{commonTitle}</span>
                                </div>

                                <span
                                    className={["inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1", TYPE_CHIP[bestType]].join(" ")}>
                                    {TYPE_LABEL[bestType]} focus
                                </span>
                            </div>
                            <div className="mt-2 text-[11px] text-muted-foreground">{plannedHint}</div>
                        </div>
                    </Section>

                    {/* Weekly consistency */}
                    <Section title="This week consistency">
                        <WeeklyConsistency completed={allCompleted}/>
                    </Section>

                    {/* Distribution */}
                    <Section title="Distribution by type"
                             right={<div className="text-xs text-muted-foreground">{range}</div>}>
                        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-4 space-y-4">
                            {(Object.keys(totals) as SessionType[]).map((t) => {
                                const count = totals[t].count;
                                const minutes = totals[t].minutes;
                                const pct = count / maxCount;

                                return (
                                    <BarRow
                                        key={t}
                                        label={
                                            <span className="inline-flex items-center gap-2">
                                                <StatusDot type={t} size="sm"/>
                                                <span className="font-medium">{TYPE_LABEL[t]}</span>
                                                <span
                                                    className={["ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1", TYPE_CHIP[t]].join(" ")}>
                                                    {count}x
                                                </span>
                                            </span>
                                        }
                                        barClassName={TYPE_BAR[t]}
                                        value={formatHoursMinutes(minutes)}
                                        pct={pct}
                                        barAriaLabel={`${TYPE_LABEL[t]}: ${count} sessions, ${minutes} minutes total.`}
                                        right={count === 0 ? "No sessions in range." : `${Math.round(minutes / Math.max(count, 1))}m avg · ${totals[t].load} load`}
                                    />
                                );
                            })}
                        </div>
                    </Section>

                    {/* Patterns */}
                    <Section title="Patterns (last 30 days)">
                        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-4 space-y-3">
                            <div className="text-sm">
                                You tend to train most on{" "}
                                <span className="font-semibold">{DOW_LABEL[bestDayIdx]}</span>.
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {weekdayCounts30.map((n, idx) => {
                                    const pct = clamp01(n / Math.max(...weekdayCounts30, 1));
                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="text-[10px] text-muted-foreground">{DOW_LABEL[idx]}</div>
                                            <div
                                                className="h-16 rounded-xl bg-muted ring-1 ring-border overflow-hidden flex items-end">
                                                <div
                                                    className="w-full bg-foreground/70"
                                                    style={{height: `${Math.round(pct * 100)}%`}}
                                                    role="img"
                                                    aria-label={`${DOW_LABEL[idx]} has ${n} sessions in the last 30 days.`}
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">{n}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-[11px] text-muted-foreground">
                                Tip: if you want faster progress, keep one “anchor day” stable
                                (e.g. {DOW_LABEL[bestDayIdx]})
                                and build the rest around it.
                            </div>
                        </div>
                    </Section>

                    {/* Recent log */}
                    <Section title="Recent completed sessions"
                             right={<div className="text-xs text-muted-foreground">Newest first</div>}>
                        <div className="rounded-2xl bg-card ring-1 ring-border shadow-sm p-2">
                            {rangeItems
                                .slice()
                                .sort((a, b) => {
                                    const d = b.dateISO.localeCompare(a.dateISO);
                                    if (d !== 0) return d;
                                    return b.startTime.localeCompare(a.startTime);
                                })
                                .slice(0, 8)
                                .map((s) => {
                                    const load = computeLoad(s.durationMin, s.rpe);
                                    return (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-muted"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <StatusDot type={s.type} size="sm"/>
                                                    <div className="truncate text-sm font-medium">{s.title}</div>
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-muted-foreground">
                                                    {s.dateISO} · {s.startTime} · {s.durationMin}m · RPE {s.rpe}
                                                </div>
                                            </div>

                                            <div className="shrink-0 text-right">
                                                <div
                                                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                                                    Load {load}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                            {rangeItems.length === 0 ? (
                                <div className="p-4 text-sm text-muted-foreground">No completed sessions in this
                                    range.</div>
                            ) : null}
                        </div>
                    </Section>
                </>
            )}
        </CollapsingScroll>
    );
}
