"use client";

import React, {useEffect, useMemo, useState} from "react";
import {CompletedSession, PlannedSession, SessionType} from "@/lib/types";
import {loadStore, saveStore, Template, uid} from "@/lib/storage";
import {SessionBlock} from "@/components/session-block";
import {AddSessionButton} from "@/components/header-actions";
import {AppPageHeader} from "@/components/app-page-header";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function WeekPage() {
    const [sessions, setSessions] = useState<PlannedSession[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [completed, setCompleted] = useState<CompletedSession[]>([]);

    const [todayIndex, setTodayIndex] = useState(0);
    const [selectedDay, setSelectedDay] = useState(0);
    const [hydrated, setHydrated] = useState(false);

    // Add flow
    const [isOpen, setIsOpen] = useState(false);
    const [addStep, setAddStep] = useState<"form" | "template">("form");
    const [templateSearch, setTemplateSearch] = useState("");

    const [draft, setDraft] = useState<{
        templateId: string | "custom";
        type: SessionType;
        title: string;
        dayIndex: number;
        startTime: string;
        durationMin: number;
        rpePlanned: number;
    }>({
        templateId: "custom",
        type: "BADMINTON",
        title: "Badminton Session",
        dayIndex: 0,
        startTime: "18:00",
        durationMin: 60,
        rpePlanned: 6,
    });

    // Complete flow
    const [completeOpen, setCompleteOpen] = useState(false);
    const [completeTarget, setCompleteTarget] = useState<PlannedSession | null>(null);
    const [completeDraft, setCompleteDraft] = useState<{
        dateISO: string;
        durationMin: number;
        rpe: number;
        notes: string;
    }>({
        dateISO: new Date().toISOString().substring(0, 10),
        durationMin: 60,
        rpe: 6,
        notes: "",
    });

    // Delete flow
    const [deleteTarget, setDeleteTarget] = useState<PlannedSession | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const templateLabel = useMemo(() => {
        if (draft.templateId === "custom") return "Custom…";
        const t = templates.find((x) => x.id === draft.templateId);
        return t ? t.title : "Custom…";
    }, [draft.templateId, templates]);

    const filteredTemplates = useMemo(() => {
        const q = templateSearch.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter((t) => t.title.toLowerCase().includes(q));
    }, [templateSearch, templates]);

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

    type ClickOrDay = number | React.MouseEvent<HTMLButtonElement>;

    function openAdd(arg?: ClickOrDay) {
        const dayIndex = typeof arg === "number" ? arg : selectedDay;

        setDraft((d) => ({ ...d, dayIndex }));
        setTemplates(loadStore().templates);
        setTemplateSearch("");
        setAddStep("form");
        setIsOpen(true);
    }

    function addSession() {
        if (!draft.title.trim()) return;

        const next: PlannedSession = {
            id: uid(),
            type: draft.type,
            title: draft.title,
            dayIndex: draft.dayIndex,
            startTime: draft.startTime,
            durationMin: draft.durationMin,
            rpePlanned: draft.rpePlanned,
        };

        setSessions((prev) => [...prev, next]);

        setIsOpen(false);
        setAddStep("form");
        setTemplateSearch("");
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

    function submitComplete() {
        if (!completeTarget) return;

        const entry: CompletedSession = {
            id: uid(),
            plannedSessionId: completeTarget.id,
            type: completeTarget.type,
            title: completeTarget.title,
            dateISO: completeDraft.dateISO,
            startTime: completeTarget.startTime,
            durationMin: completeDraft.durationMin,
            rpe: completeDraft.rpe,
            notes: completeDraft.notes.trim() ? completeDraft.notes.trim() : undefined,
        };

        setCompleted((prev) => [...prev, entry]);
        setSessions((prev) =>
            prev.map((s) =>
                s.id === completeTarget.id ? {...s, status: "DONE"} : s
            )
        );

        setCompleteOpen(false);
        setCompleteTarget(null);
    }


    function onTypeChange(type: SessionType) {
        const title = type === "BADMINTON" ? "Badminton Session" : type === "GYM" ? "Gym Workout" : "Recovery";
        setDraft((d) => ({...d, templateId: "custom", type, title}));
    }

    function applyTemplate(t: Template) {
        setDraft((d) => ({
            ...d,
            templateId: t.id,
            type: t.type,
            title: t.title,
            durationMin: t.durationMin,
            rpePlanned: t.rpeDefault,
        }));
    }

    // Persist store on changes
    useEffect(() => {
        if (!hydrated) return;
        const store = loadStore();

        const safePlanned = sessions.filter((s) => Number.isFinite(s.dayIndex) && s.dayIndex >= 0 && s.dayIndex <= 6);

        saveStore({ ...store, planned: safePlanned, completed });
    }, [sessions, completed, hydrated]);


    // Live template updates (e.g. other tab)
    useEffect(() => {
        const onStorage = () => setTemplates(loadStore().templates);
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Hydration
    useEffect(() => {
        const store = loadStore();
        const safePlanned = (store.planned ?? []).filter(
            (s) => s.dayIndex >= 0 && s.dayIndex <= 6
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessions(safePlanned);
        setTemplates(store.templates);
        setCompleted(store.completed);

        const d = new Date().getDay(); // 0=Sun
        const idx = d === 0 ? 6 : d - 1;
        setTodayIndex(idx);
        setSelectedDay(idx);

        setHydrated(true);
    }, []);

    if (!hydrated) {
        return (
            <div className="relative h-dvh overflow-hidden px-4 pb-24"/>
        );
    }
    return (
        <div className="relative h-dvh overflow-hidden px-4 pb-24">
            <div className="flex h-full flex-col overflow-hidden">
                {/* TOP */}
                <AppPageHeader
                    title="Week"
                    subtitle="Plan your sessions for the week."
                    right={<AddSessionButton onClickAction={openAdd} />}
                />

                {/* Day selector + summary */}
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
                                    active
                                        ? "bg-primary text-primary-foreground border-primary/20 shadow-sm"
                                        : "bg-card text-foreground border-border hover:bg-muted",
                                ].join(" ")}
                            >
                                    <span className="inline-flex w-full items-center justify-center gap-2">
                                        {day}
                                        {isToday ? (
                                            <span
                                                className={["h-1.5 w-1.5 rounded-full", active ? "bg-primary-foreground/90" : "bg-primary"].join(" ")}/>
                                        ) : null}
                                    </span>
                            </button>
                        );
                    })}
                </div>

                {/* CONTENT (scrolls) */}
                <div className="min-h-0 flex-1 overflow-y-auto pt-3 overscroll-contain">
                    {daySessions.length === 0 ? (
                        <div className="rounded-3xl bg-card p-4 border border-border">
                            <div
                                className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground border border-border">
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
                <div
                    className="fixed inset-0 z-50 grid place-items-center bg-black/20 p-3 sm:p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                            setAddStep("form");
                            setTemplateSearch("");
                        }
                    }}
                    onTouchStart={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                            setAddStep("form");
                            setTemplateSearch("");
                        }
                    }}
                >
                    <div
                        className="w-full max-w-lg rounded-3xl bg-card p-6 border border-border shadow-xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
                        {/* HEADER */}
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {addStep === "template" ? (
                                        <button
                                            type="button"
                                            onClick={() => setAddStep("form")}
                                            className="rounded-full bg-muted px-3 py-1 text-xs font-semibold ring-1 ring-border active:scale-[0.98]"
                                        >
                                            ← Back
                                        </button>
                                    ) : null}

                                    <div
                                        className="text-lg font-semibold tracking-tight">{addStep === "template" ? "Choose template" : "Add session"}</div>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {addStep === "template" ? "Pick a preset or go custom." : "Keep it simple: what, when, intensity."}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setAddStep("form");
                                    setTemplateSearch("");
                                }}
                                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold ring-1 ring-border active:scale-[0.98]"
                            >
                                Close
                            </button>
                        </div>

                        {/* TEMPLATE PICKER */}
                        {addStep === "template" ? (
                            <div className="space-y-3">
                                <input
                                    value={templateSearch}
                                    onChange={(e) => setTemplateSearch(e.target.value)}
                                    placeholder="Search templates…"
                                    className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft((d) => ({...d, templateId: "custom"}));
                                        onTypeChange(draft.type);
                                        setAddStep("form");
                                    }}
                                    className="w-full rounded-2xl bg-primary/5 px-4 py-3 text-left ring-1 ring-primary/20 active:scale-[0.99]"
                                >
                                    <div className="text-sm font-semibold">Custom…</div>
                                    <div className="text-xs text-muted-foreground">Create a session from scratch</div>
                                </button>

                                {(["BADMINTON", "GYM", "RECOVERY"] as const).map((group) => {
                                    const label = group === "BADMINTON" ? "Badminton" : group === "GYM" ? "Gym" : "Recovery";
                                    const items = filteredTemplates.filter((t) => t.type === group);
                                    if (items.length === 0) return null;

                                    return (
                                        <div key={group} className="pt-2">
                                            <div
                                                className="px-1 pb-2 text-xs font-semibold text-muted-foreground">{label}</div>

                                            <div className="space-y-2">
                                                {items.map((t) => {
                                                    const selected = draft.templateId === t.id;

                                                    return (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => {
                                                                applyTemplate(t);
                                                                setDraft((d) => ({...d, templateId: t.id}));
                                                                setAddStep("form");
                                                            }}
                                                            className={[
                                                                "w-full rounded-2xl px-4 py-3 text-left ring-1 transition active:scale-[0.99]",
                                                                selected ? "bg-primary/10 ring-primary/30" : "bg-background ring-border hover:bg-muted/40",
                                                            ].join(" ")}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div
                                                                        className="truncate text-sm font-semibold">{t.title}</div>
                                                                    <div
                                                                        className="mt-0.5 text-xs text-muted-foreground">
                                                                        {t.durationMin} min • RPE {t.rpeDefault}
                                                                    </div>
                                                                </div>

                                                                {selected ? (
                                                                    <span
                                                                        className="mt-0.5 shrink-0 rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground">
                                                                        Selected
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {templateSearch.trim() && filteredTemplates.length === 0 ? (
                                    <div className="pt-2 text-sm text-muted-foreground">No templates found.</div>
                                ) : null}
                            </div>
                        ) : (
                            /* FORM */
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-muted-foreground">From template</span>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTemplateSearch("");
                                                setAddStep("template");
                                            }}
                                            className="w-full rounded-xl bg-muted/40 px-3 py-2 text-left text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="truncate">{templateLabel}</span>
                                                <span className="text-muted-foreground">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                                         aria-hidden="true">
                                                        <path
                                                            d="M7 10l5 5 5-5"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </span>
                                            </div>
                                        </button>
                                    </label>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="grid gap-1">
                                            <span className="text-xs font-medium text-muted-foreground">Type</span>
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
                                            <input
                                                value={draft.title}
                                                onChange={(e) => setDraft((d) => ({...d, title: e.target.value}))}
                                                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
                                    <div className="text-xs font-semibold text-muted-foreground">When</div>

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="grid gap-1">
                                            <span className="text-xs font-medium text-muted-foreground">Day</span>
                                            <select
                                                value={draft.dayIndex}
                                                onChange={(e) => setDraft((d) => ({
                                                    ...d,
                                                    dayIndex: Number(e.target.value)
                                                }))}
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
                                            <span
                                                className="text-xs font-medium text-muted-foreground">Start time</span>
                                            <input
                                                type="time"
                                                value={draft.startTime}
                                                onChange={(e) => setDraft((d) => ({...d, startTime: e.target.value}))}
                                                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-background p-4 ring-1 ring-border">
                                    <div className="text-xs font-semibold text-muted-foreground">Intensity</div>

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <label className="grid gap-1">
                                        <span
                                            className="text-xs font-medium text-muted-foreground">Duration (min)</span>
                                            <input
                                                type="number"
                                                min={5}
                                                step={5}
                                                value={draft.durationMin}
                                                onChange={(e) => setDraft((d) => ({
                                                    ...d,
                                                    durationMin: Number(e.target.value)
                                                }))}
                                                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                            />
                                        </label>

                                        <label className="grid gap-1">
                                        <span
                                            className="text-xs font-medium text-muted-foreground">Planned RPE (1–10)</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={draft.rpePlanned}
                                                onChange={(e) => setDraft((d) => ({
                                                    ...d,
                                                    rpePlanned: Number(e.target.value)
                                                }))}
                                                className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-2 flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            setAddStep("form");
                                            setTemplateSearch("");
                                        }}
                                        className="flex-1 rounded-2xl bg-muted px-4 py-2 text-sm font-medium ring-1 ring-border active:scale-[0.98]"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={addSession}
                                        className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-[0.98]"
                                    >
                                        Add session
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null
            }

            {/* Complete modal */}
            {
                completeOpen ? (
                    <div
                        className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-3 sm:p-4"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                setCompleteOpen(false);
                                setCompleteTarget(null);
                            }
                        }}
                        onTouchStart={(e) => {
                            if (e.target === e.currentTarget) {
                                setCompleteOpen(false);
                                setCompleteTarget(null);
                            }
                        }}
                    >
                        <div
                            className="w-full max-w-130 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-card p-5 ring-1 ring-border shadow-xl">
                            <div className="mb-4">
                                <div className="text-lg font-semibold tracking-tight">Complete session</div>
                                <div className="text-sm text-muted-foreground">Log what you actually did.</div>
                            </div>

                            <div className="rounded-2xl bg-background p-3 border border-border">
                                <div className="text-sm font-semibold">{completeTarget?.title}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">
                                    {completeTarget?.startTime} • planned {completeTarget?.durationMin} min • planned
                                    RPE{" "}
                                    {completeTarget?.rpePlanned}
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="grid gap-1">
                                        <span className="text-xs font-medium text-muted-foreground">Date</span>
                                        <input
                                            type="date"
                                            value={completeDraft.dateISO}
                                            onChange={(e) => setCompleteDraft((d) => ({...d, dateISO: e.target.value}))}
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
                                            onChange={(e) => setCompleteDraft((d) => ({
                                                ...d,
                                                durationMin: Number(e.target.value)
                                            }))}
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
                                        onChange={(e) => setCompleteDraft((d) => ({...d, rpe: Number(e.target.value)}))}
                                        className="w-full rounded-xl bg-muted/40 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </label>

                                <label className="grid gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Notes (optional)</span>
                                    <textarea
                                        value={completeDraft.notes}
                                        onChange={(e) => setCompleteDraft((d) => ({...d, notes: e.target.value}))}
                                        className="w-full min-h-25 rounded-xl bg-muted/30 px-3 py-2 text-sm ring-1 ring-border focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        placeholder="Quick reflection (optional)…"
                                    />
                                </label>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button
                                    onClick={() => {
                                        setCompleteOpen(false);
                                        setCompleteTarget(null);
                                    }}
                                    className="flex-1 rounded-2xl bg-muted px-4 py-2 text-sm font-medium ring-1 ring-border active:scale-[0.98]"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={submitComplete}
                                    className="flex-1 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm active:scale-[0.98]"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null
            }

            {/* Delete confirmation modal */}
            {deleteConfirmOpen && deleteTarget ? (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setDeleteConfirmOpen(false);
                    }}
                    onTouchStart={(e) => {
                        if (e.target === e.currentTarget) setDeleteConfirmOpen(false);
                    }}
                >
                    <div
                        className="w-full rounded-t-3xl bg-card p-5 ring-1 ring-border shadow-xl
                        sm:max-w-sm sm:rounded-3xl"
                    >
                        <div className="text-sm font-semibold">Delete session?</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                            This will also remove any completed logs for this session.
                        </div>

                        <div className="mt-5 space-y-2">
                            <button
                                onClick={() => {
                                    setSessions((prev) => prev.filter((x) => x.id !== deleteTarget.id));
                                    setCompleted((prev) =>
                                        prev.filter((c) => c.plannedSessionId !== deleteTarget.id)
                                    );
                                    setDeleteConfirmOpen(false);
                                    setDeleteTarget(null);
                                }}
                                className="w-full rounded-2xl bg-rose-600 px-4 py-3
                                text-sm font-semibold text-white
                                shadow-sm active:scale-[0.98]"
                            >
                                Delete
                            </button>

                            <button
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setDeleteTarget(null);
                                }}
                                className="w-full rounded-2xl bg-muted px-4 py-3
                                text-sm font-medium ring-1 ring-border
                                active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );


}
