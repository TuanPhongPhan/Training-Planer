import {PlannedSession, computeLoad, CompletedSession} from "@/lib/types";
import { StatusDot } from "@/components/status-dot";

function typeMeta(type: PlannedSession["type"]) {
    if (type === "BADMINTON")
        return {
            label: "Badminton",
            chip: "bg-sky-500/10 text-sky-700 ring-sky-500/20",
            media: "from-sky-500/20 to-sky-500/5",
        };
    if (type === "GYM")
        return {
            label: "Workout",
            chip: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
            media: "from-emerald-500/20 to-emerald-500/5",
        };
    return {
        label: "Recovery",
        chip: "bg-violet-500/10 text-violet-700 ring-violet-500/20",
        media: "from-violet-500/20 to-violet-500/5",
    };
}

function loadLabel(load: number) {
    if (load >= 700) return "Hard";
    if (load >= 350) return "Medium";
    return "Easy";
}

function statusChip(status: PlannedSession["status"] | undefined) {
    const s = status ?? "PLANNED";
    if (s === "DONE")
        return {
            label: "Completed",
            cls: "bg-muted text-muted-foreground ring-border",
        };
    if (s === "SKIPPED")
        return {
            label: "Skipped",
            cls: "bg-rose-500/10 text-rose-700 ring-rose-500/20",
        };
    if (s === "PARTIAL")
        return {
            label: "Partial",
            cls: "bg-amber-500/10 text-amber-700 ring-amber-500/20",
        };
    return null;
}

function isCompletedSession(s: PlannedSession | CompletedSession): s is CompletedSession {
    return "dateISO" in s;
}

export function SessionBlock({
                                 session,
                                 onComplete,
                                 onDelete,
                                 mode = "week",
                                 onOpen,
                             }: {
    session: PlannedSession | CompletedSession;
    onComplete?: () => void;
    onDelete?: () => void;
    mode?: "week" | "log";
    onOpen?: () => void; // optional: click to open details in Log
}) {
    const completed = isCompletedSession(session);
    const isLog = mode === "log";

    const t = typeMeta(session.type);

    const done = completed ? true : (session.status ?? "PLANNED") === "DONE";

    const rpe = completed ? session.rpe : session.rpePlanned;

    const load = computeLoad(session.durationMin, rpe);
    const intensity = loadLabel(load);

    const sChip = !isLog
        ? null
        : completed
            ? { label: "Completed", cls: "bg-muted text-muted-foreground ring-border" }
            : statusChip(session.status);


    return (
        <div
            data-testid="planned-session"
            className={[
                "group relative w-full overflow-hidden rounded-2xl",
                "bg-card ring-1 ring-border shadow-sm",
                "transition hover:shadow-md",
                done ? "opacity-70" : "",
                onOpen ? "cursor-pointer" : "",
            ].join(" ")}
            onClick={onOpen}
            role={onOpen ? "button" : undefined}
            tabIndex={onOpen ? 0 : undefined}
        >
            <div className="flex min-h-19.5">
                {/* LEFT: media thumbnail */}
                <div className={["relative w-14 sm:w-18 shrink-0", "bg-linear-to-b", t.media].join(" ")}>
                    <StatusDot type={session.type} className="absolute left-3 top-3" />
                </div>

                {/* RIGHT: content */}
                <div className="flex min-w-0 flex-1 flex-col px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className={[
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1",
                                t.chip,
                            ].join(" ")}
                            >
                                {t.label}
                            </span>
                            {/* Week mode keeps your old Completed chip */}
                            {!isLog && done ? (
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                                    Completed
                                </span>
                            ) : null}

                            {/* Log mode: status chip based on session.status */}
                            {isLog && sChip ? (
                                <span
                                    className={[
                                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1",
                                        sChip.cls,
                                    ].join(" ")}
                                >
                                    {sChip.label}
                                </span>
                            ) : null}
                        </div>

                        {/* Hide menu in log to keep it read-only */}
                        {!isLog ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.();
                                }}
                                className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label="Delete"
                                title="Delete"
                            >
                                ⋯
                            </button>
                        ) : null}
                    </div>

                    <div className="mt-1 flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold leading-5">{session.title}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                {"startTime" in session ? (
                                    <>
                                        <span className="shrink-0">{session.startTime}</span>
                                        <span aria-hidden className="opacity-60">•</span>
                                    </>
                                ) : null}
                                <span className="shrink-0">{session.durationMin} min</span>
                                <span aria-hidden className="opacity-60">•</span>
                                <span className="shrink-0">RPE {rpe}</span>
                            </div>
                        </div>

                        <div className="shrink-0 text-right">
                            <div className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border">
                                Load {load}
                            </div>
                            <div className="mt-1 text-[10px] text-muted-foreground/90">{intensity}</div>
                        </div>
                    </div>

                    {/* ACTION AREA */}
                    <div className="mt-auto pt-2">
                        {/* Week page behavior unchanged */}
                        {!isLog ? (
                            !done ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onComplete?.();
                                    }}
                                    className={[
                                        "w-full rounded-xl px-3 py-1.5 text-xs font-medium",
                                        "bg-primary text-primary-foreground shadow-sm",
                                        "hover:opacity-95 active:opacity-90",
                                    ].join(" ")}
                                >
                                    Complete
                                </button>
                            ) : (
                                <div className="w-full rounded-xl bg-muted px-3 py-1.5 text-center text-xs text-muted-foreground ring-1 ring-border">
                                    ✓ Done
                                </div>
                            )
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
