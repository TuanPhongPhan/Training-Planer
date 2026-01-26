"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CompletedSession, PlannedSession, SessionType } from "@/lib/types";
import {
    listPlannedWeek,
    upsertPlanned,
    deletePlanned,
    insertCompleted,
    markPlannedDone,
    deleteCompletedByPlannedId, listTemplates, Template,
} from "@/lib/storage";
import { SessionBlock } from "@/components/session-block";
import { AddSessionButton } from "@/components/header-actions";
import { AppPageHeader } from "@/components/app-page-header";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function WeekPage() {
    const [sessions, setSessions] = useState<PlannedSession[]>([]);
    const [todayIndex, setTodayIndex] = useState(0);
    const [selectedDay, setSelectedDay] = useState(0);

    const weekStartISO = useMemo(() => {
        const d = new Date();
        const day = d.getDay() || 7; // 1..7 (Mon..Sun)
        d.setDate(d.getDate() - day + 1); // Monday
        return d.toISOString().slice(0, 10);
    }, []);

    // Add flow
    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState<{
        type: SessionType;
        title: string;
        dayIndex: number;
        startTime: string;
        durationMin: number;
        rpePlanned: number;
    }>({
        type: "BADMINTON",
        title: "Badminton Session",
        dayIndex: 0,
        startTime: "18:00",
        durationMin: 60,
        rpePlanned: 6,
    });

    // Complete flow (keeps your UI fields)
    const [completeOpen, setCompleteOpen] = useState(false);
    const [completeTarget, setCompleteTarget] = useState<PlannedSession | null>(null);
    const [completeDraft, setCompleteDraft] = useState<{
        dateISO: string;
        durationMin: number;
        rpe: number;
        notes: string;
    }>({
        dateISO: new Date().toISOString().slice(0, 10),
        durationMin: 60,
        rpe: 6,
        notes: "",
    });

    // Delete flow
    const [deleteTarget, setDeleteTarget] = useState<PlannedSession | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const sessionsByDay = useMemo(() => {
        const map = new Map<number, PlannedSession[]>();
        for (let i = 0; i < 7; i++) map.set(i, []);

        for (const s of sessions) {
            if (s.dayIndex < 0 || s.dayIndex > 6) continue;
            map.get(s.dayIndex)!.push(s);
        }

        for (const arr of map.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return map;
    }, [sessions]);

    const daySessions = sessionsByDay.get(selectedDay)!;

    React.useEffect(() => {
        // today + default selected day
        const d = new Date().getDay(); // 0=Sun
        const idx = d === 0 ? 6 : d - 1;
        setTodayIndex(idx);
        setSelectedDay(idx);
    }, []);

    useEffect(() => {
        listPlannedWeek(weekStartISO).then(setSessions).catch(console.error);
    }, [weekStartISO]);

    type ClickOrDay = number | React.MouseEvent<HTMLButtonElement>;

    function addMinutesHHMM(hhmm: string, minutes: number) {
        const [h, m] = hhmm.split(":").map(Number);
        const total = h * 60 + m + minutes;
        const hh = String(Math.floor((total % 1440) / 60)).padStart(2, "0");
        const mm = String(total % 60).padStart(2, "0");
        return `${hh}:${mm}`;
    }

    function nextFreeTime(daySessions: PlannedSession[], base = "18:00") {
        const used = new Set(daySessions.map((s) => s.startTime));
        let t = base;

        for (let i = 0; i < 24; i++) {
            if (!used.has(t)) return t;
            t = addMinutesHHMM(t, 60);
        }
        return base; // fallback
    }

    function openAdd(arg?: ClickOrDay) {
        const dayIndex = typeof arg === "number" ? arg : selectedDay;
        const daySessions = sessionsByDay.get(dayIndex) ?? [];
        const startTime = nextFreeTime(daySessions, "18:00");

        setDraft((d) => ({ ...d, dayIndex, startTime }));
        setIsOpen(true);
    }

    async function addSession() {
        if (!draft.title.trim()) return;

        const next: PlannedSession = {
            id: crypto.randomUUID(),
            type: draft.type,
            title: draft.title,
            dayIndex: draft.dayIndex,
            startTime: draft.startTime,
            durationMin: draft.durationMin,
            rpePlanned: draft.rpePlanned,
        };

        // optimistic add
        setSessions((prev) => [...prev, next]);

        try {
            await upsertPlanned(weekStartISO, next);
            // refresh for canonical ordering / DB truth
            setSessions(await listPlannedWeek(weekStartISO));
        } catch (e) {
            // rollback
            setSessions((prev) => prev.filter((x) => x.id !== next.id));
            console.error(e);
        }

        setIsOpen(false);
    }

    function openComplete(session: PlannedSession) {
        setCompleteTarget(session);
        setCompleteDraft({
            dateISO: new Date().toISOString().slice(0, 10),
            durationMin: session.durationMin,
            rpe: session.rpePlanned,
            notes: "",
        });
        setCompleteOpen(true);
    }

    async function submitComplete() {
        if (!completeTarget) return;

        const entry: CompletedSession = {
            id: crypto.randomUUID(),
            plannedSessionId: completeTarget.id,
            type: completeTarget.type,
            title: completeTarget.title,
            dateISO: completeDraft.dateISO,
            startTime: completeTarget.startTime,
            durationMin: completeDraft.durationMin,
            rpe: completeDraft.rpe,
            notes: completeDraft.notes.trim() ? completeDraft.notes.trim() : undefined,
        };

        // optimistic mark done
        setSessions((prev) => prev.map((s) => (s.id === completeTarget.id ? { ...s, status: "DONE" } : s)));

        try {
            await insertCompleted(entry);
            await markPlannedDone(weekStartISO, completeTarget);
            setSessions(await listPlannedWeek(weekStartISO));
        } catch (e) {
            // rollback (best effort)
            setSessions((prev) => prev.map((s) => (s.id === completeTarget.id ? { ...s, status: undefined } : s)));

            const msg =
                e && typeof e === "object" && "message" in e
                    ? String((e as { message?: unknown }).message)
                    : e instanceof Error
                        ? e.message
                        : typeof e === "string"
                            ? e
                            : JSON.stringify(e);

            console.error("submitComplete failed:", msg, e);
        }

        setCompleteOpen(false);
        setCompleteTarget(null);
    }

    function onTypeChange(type: SessionType) {
        const title = type === "BADMINTON" ? "Badminton Session" : type === "GYM" ? "Gym Workout" : "Recovery";
        setDraft((d) => ({ ...d, type, title }));
    }

    async function confirmDelete() {
        if (!deleteTarget) return;

        const target = deleteTarget;

        // optimistic remove
        setSessions((prev) => prev.filter((x) => x.id !== target.id));

        try {
            await deleteCompletedByPlannedId(target.id);
            await deletePlanned(weekStartISO, target);
            setSessions(await listPlannedWeek(weekStartISO));
        } catch (e) {
            // rollback by refetch
            setSessions(await listPlannedWeek(weekStartISO));
            console.error(e);
        }

        setDeleteConfirmOpen(false);
        setDeleteTarget(null);
    }

    const [templates, setTemplates] = useState<Template[]>([]);
    const [addMode, setAddMode] = useState<"template" | "custom">("custom");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    function applyTemplate(t: Template) {
        setDraft((d) => ({
            ...d,
            type: t.type,
            title: t.title,
            durationMin: t.durationMin,
            rpePlanned: t.rpeDefault,
        }));
    }

    useEffect(() => {
        listTemplates().then(setTemplates).catch(console.error);
    }, []);

    return (
        <div className="relative h-dvh overflow-hidden px-4 pb-24">
            <div className="flex h-full flex-col overflow-hidden">
                <AppPageHeader title="Week" subtitle="Plan your sessions for the week." right={<AddSessionButton onClickAction={openAdd} />} />

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
                    <style>{`div::-webkit-scrollbar{display:none}`}</style>

                    {DAYS.map((day, idx) => {
                        const active = idx === selectedDay;
                        const isToday = idx === todayIndex;

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(idx)}
                                className={[
                                    "h-10 w-18 shrink-0 rounded-full text-sm font-semibold border transition active:scale-[0.98]",
                                    active ? "bg-primary text-primary-foreground border-primary/20 shadow-sm" : "bg-card text-foreground border-border hover:bg-muted",
                                ].join(" ")}
                            >
                <span className="inline-flex w-full items-center justify-center gap-2">
                  {day}
                    {isToday ? <span className={["h-1.5 w-1.5 rounded-full", active ? "bg-primary-foreground/90" : "bg-primary"].join(" ")} /> : null}
                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pt-3 overscroll-contain">
                    {daySessions.length === 0 ? (
                        <div className="rounded-3xl bg-card p-4 border border-border">
                            <div className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground border border-border">
                                No sessions planned yet.
                                <div className="mt-1 font-medium text-foreground">Tap + Add to plan one.</div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {daySessions.map((s) => (
                                <SessionBlock
                                    key={s.id}
                                    session={s}
                                    onComplete={() => openComplete(s)}
                                    onDelete={() => {
                                        setDeleteTarget(s);
                                        setDeleteConfirmOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add session modal */}
            {isOpen ? (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-3 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && setIsOpen(false)}>
                    <div className="w-full max-w-lg rounded-3xl bg-card p-6 border border-border shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-lg font-semibold tracking-tight">Add session</div>
                                <div className="text-sm text-muted-foreground">Keep it simple: what, when, intensity.</div>
                            </div>

                            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold ring-1 ring-border active:scale-[0.98]">
                                Close
                            </button>
                        </div>

                        <div className="flex rounded-xl bg-muted p-1">
                            {(["template", "custom"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setAddMode(m)}
                                    className={[
                                        "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                                        addMode === m
                                            ? "bg-background shadow text-foreground"
                                            : "text-muted-foreground",
                                    ].join(" ")}
                                >
                                    {m === "template" ? "Template" : "Custom"}
                                </button>
                            ))}
                        </div>

                        {addMode === "template" && (
                            <select
                                value={selectedTemplateId ?? ""}
                                onChange={(e) => {
                                    const id = e.target.value;
                                    setSelectedTemplateId(id);
                                    const t = templates.find((x) => x.id === id);
                                    if (t) applyTemplate(t);
                                }}
                                className="mt-2 w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                            >
                                <option value="">— Select template —</option>
                                {templates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.title}
                                    </option>
                                ))}
                            </select>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="grid gap-1">
                                    <span className="mt-2 text-xs font-medium text-muted-foreground">Type</span>
                                    <select
                                        value={draft.type}
                                        onChange={(e) => onTypeChange(e.target.value as SessionType)}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                    >
                                        <option value="BADMINTON">Badminton</option>
                                        <option value="GYM">Gym</option>
                                        <option value="RECOVERY">Recovery</option>
                                    </select>
                                </label>

                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Title</span>
                                    <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background" />
                                </label>
                            </div>

                            <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
                                <div className="text-xs font-semibold text-muted-foreground">When</div>
                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-muted-foreground">Day</span>
                                        <select
                                            value={draft.dayIndex}
                                            onChange={(e) => setDraft((d) => ({ ...d, dayIndex: Number(e.target.value) }))}
                                            className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                        >
                                            {DAYS.map((d, idx) => (
                                                <option key={d} value={idx}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-muted-foreground">Start time</span>
                                        <input type="time" value={draft.startTime} onChange={(e) => setDraft((d) => ({ ...d, startTime: e.target.value }))} className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background" />
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
                                <div className="text-xs font-semibold text-muted-foreground">Intensity</div>
                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-muted-foreground">Duration (min)</span>
                                        <input type="number" min={5} step={5} value={draft.durationMin} onChange={(e) => setDraft((d) => ({ ...d, durationMin: Number(e.target.value) }))} className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background" />
                                    </label>

                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-muted-foreground">Planned RPE (1–10)</span>
                                        <input type="number" min={1} max={10} value={draft.rpePlanned} onChange={(e) => setDraft((d) => ({ ...d, rpePlanned: Number(e.target.value) }))} className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background" />
                                    </label>
                                </div>
                            </div>

                            <div className="mt-2 flex gap-2">
                                <button onClick={() => setIsOpen(false)} className="flex-1 rounded-2xl bg-muted px-4 py-2 text-sm font-medium ring-1 ring-border active:scale-[0.98]">
                                    Cancel
                                </button>

                                <button onClick={addSession} className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-[0.98]">
                                    Add session
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Complete modal (your full form stays) */}
            {completeOpen ? (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-3 sm:p-4"
                     onMouseDown={(e) => {
                         if (e.target === e.currentTarget) {
                             setCompleteOpen(false);
                             setCompleteTarget(null);
                         }
                     }}
                >
                    <div className="w-full max-w-130 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-card p-5 ring-1 ring-border shadow-xl">
                        <div className="mb-4">
                            <div className="text-lg font-semibold tracking-tight">Complete session</div>
                            <div className="text-sm text-muted-foreground">Log what you actually did.</div>
                        </div>

                        <div className="rounded-2xl bg-background p-3 border border-border">
                            <div className="text-sm font-semibold">{completeTarget?.title}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                                {completeTarget?.startTime} • planned {completeTarget?.durationMin} min • planned RPE {completeTarget?.rpePlanned}
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Date</span>
                                    <input
                                        type="date"
                                        value={completeDraft.dateISO}
                                        onChange={(e) => setCompleteDraft((d) => ({ ...d, dateISO: e.target.value }))}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </label>

                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Actual duration (min)</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        min={5}
                                        step={5}
                                        value={completeDraft.durationMin}
                                        onChange={(e) => setCompleteDraft((d) => ({ ...d, durationMin: Number(e.target.value) }))}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </label>
                            </div>

                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Actual RPE (1–10)</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={completeDraft.rpe}
                                    onChange={(e) => setCompleteDraft((d) => ({ ...d, rpe: Number(e.target.value) }))}
                                    className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </label>

                            <label className="grid gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Notes (optional)</span>
                                <textarea
                                    value={completeDraft.notes}
                                    onChange={(e) => setCompleteDraft((d) => ({ ...d, notes: e.target.value }))}
                                    className="w-full min-h-25 rounded-xl bg-muted/30 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    placeholder="Quick reflection (optional)…"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button onClick={() => {
                                setCompleteOpen(false);
                                setCompleteTarget(null);
                            }}
                                    className="flex-1 rounded-2xl bg-muted px-4 py-2 text-sm font-medium ring-1 ring-border active:scale-[0.98]">
                                Cancel
                            </button>

                            <button onClick={submitComplete} className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-[0.98]">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Delete confirmation modal */}
            {deleteConfirmOpen && deleteTarget ? (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && setDeleteConfirmOpen(false)}>
                    <div className="w-full rounded-t-3xl bg-card p-5 ring-1 ring-border shadow-xl sm:max-w-sm sm:rounded-3xl">
                        <div className="text-sm font-semibold">Delete session?</div>
                        <div className="mt-1 text-sm text-muted-foreground">This will also remove any completed logs for this session.</div>

                        <div className="mt-5 space-y-2">
                            <button onClick={confirmDelete} className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.98]">
                                Delete
                            </button>

                            <button onClick={() => {
                                setDeleteConfirmOpen(false);
                                setDeleteTarget(null);
                            }}
                                    className="w-full rounded-2xl bg-muted px-4 py-3 text-sm font-medium ring-1 ring-border active:scale-[0.98]">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
