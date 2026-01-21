export type SessionType = "BADMINTON" | "GYM" | "RECOVERY";
export type PlannedStatus = "PLANNED" | "DONE" | "SKIPPED" | "PARTIAL";

export type PlannedSession = {
    id: string;
    type: SessionType;
    title: string;
    dayIndex: number; // 0 (Mon) to 6 (Sun)
    startTime: string; // "HH:MM" format
    durationMin: number;
    rpePlanned: number; // Rate of Perceived Exertion planned (1-10)
    status?: PlannedStatus;
};

export type CompletedSession = {
    id: string;
    plannedSessionId: string;
    type: SessionType;
    title: string;

    dateISO: string; // "YYYY-MM-DD" format
    startTime: string; // "HH:MM" format

    durationMin: number;
    rpe: number; // Rate of Perceived Exertion actual (1-10)
    notes?: string;
};

export type Settings = {
    primaryType: SessionType;     // default focus
    defaultDuration: number;      // minutes
    defaultRpe: number;           // 1-10
    weekStartsMonday: boolean;
    confirmDelete: boolean;
};


export function computeLoad(durationMin: number, rpe: number): number {
    return durationMin * rpe;
}