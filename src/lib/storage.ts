import type { CompletedSession, PlannedSession, SessionType, Settings } from "@/lib/types";
import { supabaseBrowser as createBrowserSupabaseClient } from "@/lib/supabase/client";

// -----------------------------
// Supabase helpers
// -----------------------------
function sb() {
    return createBrowserSupabaseClient();
}

export function isNotAuthenticatedError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return error.message === "NOT_AUTHENTICATED";
}

async function requireUserId(): Promise<string> {
    const supabase = sb();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        if ("code" in error && error.code === "refresh_token_not_found") {
            // Stale browser auth state (missing/rotated refresh token): treat as signed out.
            await supabase.auth.signOut();
            throw new Error("NOT_AUTHENTICATED");
        }
        throw error;
    }

    if (!user) throw new Error("NOT_AUTHENTICATED");

    return user.id;
}


// -----------------------------
// Templates
// -----------------------------
export type Template = {
    id: string;
    type: SessionType;
    title: string;
    durationMin: number;
    rpeDefault: number;
    focusTags: string[];
};

export async function listTemplates(): Promise<Template[]> {
    const supabase= sb();
    const userId = await requireUserId();

    const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        durationMin: r.duration_min,
        rpeDefault: r.rpe_default,
        focusTags: r.focus_tags ?? [],
    }));
}

export async function createTemplate(t: Omit<Template, "id">): Promise<Template> {
    const supabase = sb();
    const userId = await requireUserId();

    const { data, error } = await supabase
        .from("templates")
        .insert({
            user_id: userId,
            type: t.type,
            title: t.title,
            duration_min: t.durationMin,
            rpe_default: t.rpeDefault,
            focus_tags: t.focusTags ?? [],
        })
        .select("*")
        .single();

    if (error) throw error;

    return {
        id: data.id,
        type: data.type,
        title: data.title,
        durationMin: data.duration_min,
        rpeDefault: data.rpe_default,
        focusTags: data.focus_tags ?? [],
    };
}

export async function deleteTemplate(id: string) {
    const supabase = sb();
    const userId = await requireUserId();

    const { error } = await supabase.from("templates").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
}

// -----------------------------
// Week (planned sessions)
// -----------------------------
export async function listPlannedWeek(weekStartISO: string): Promise<PlannedSession[]> {
    const supabase = sb();
    const userId = await requireUserId();

    const { data, error } = await supabase
        .from("planned_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", weekStartISO)
        .order("day_index", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        dayIndex: row.day_index,
        startTime: row.start_time,
        durationMin: row.duration_min,
        rpePlanned: row.rpe_planned,
        status: row.status ?? undefined,
    }));
}

export async function upsertPlanned(weekStartISO: string, session: PlannedSession) {
    const supabase = sb();
    const userId = await requireUserId();

    const { error } = await supabase
        .from("planned_sessions")
        .upsert(
            {
                id: session.id,
                user_id: userId,
                week_start: weekStartISO,
                day_index: session.dayIndex,
                start_time: session.startTime,
                type: session.type,
                title: session.title,
                duration_min: session.durationMin,
                rpe_planned: session.rpePlanned,
                status: session.status ?? null,
            },
            { onConflict: "id" }
        );

    if (error) throw error;
}

export async function deletePlanned(_weekStartISO: string, session: PlannedSession) {
    const supabase = sb();
    const userId = await requireUserId();

    const { error } = await supabase
        .from("planned_sessions")
        .delete()
        .eq("id", session.id)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function markPlannedDone(_weekStartISO: string, session: PlannedSession) {
    const supabase = sb();
    const userId = await requireUserId();

    const { error } = await supabase
        .from("planned_sessions")
        .update({ status: "DONE" })
        .eq("id", session.id)
        .eq("user_id", userId);

    if (error) throw error;
}

// -----------------------------
// Completed sessions (log)
// -----------------------------
function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

// Monday week start (matches your PlannedSession dayIndex comment: 0=Mon...6=Sun)
function weekStartMondayISO(dateISO: string) {
    const d = new Date(dateISO + "T00:00:00");
    const jsDay = d.getDay(); // 0 Sun..6 Sat
    const mondayOffset = (jsDay + 6) % 7; // Mon =>0, Tue=>1, ... Sun=>6
    const monday = addDays(d, -mondayOffset);
    return toISODate(monday);
}

function dayIndexMon0(dateISO: string) {
    const d = new Date(dateISO + "T00:00:00");
    const jsDay = d.getDay(); // 0 Sun..6 Sat
    return (jsDay + 6) % 7;   // 0 Mon...6 Sun
}

export async function insertCompleted(entry: CompletedSession) {
    const supabase = sb();
    const userId = await requireUserId();

    const weekStart = weekStartMondayISO(entry.dateISO);
    const dayIndex = dayIndexMon0(entry.dateISO);

    const {error} = await supabase
        .from("completed_sessions")
        .upsert(
            {
                user_id: userId,
                planned_session_id: entry.plannedSessionId,

                // required by your schema
                week_start: weekStart,
                day_index: dayIndex,

                type: entry.type,
                title: entry.title,

                date_iso: entry.dateISO,
                start_time: entry.startTime,
                duration_min: entry.durationMin,
                rpe: entry.rpe,

                // optional columns
                payload: {notes: entry.notes ?? null},
            },
            { onConflict: "user_id,week_start,day_index,start_time" } // matches your unique constraint columns
        );

    if (error) throw error;
}


export async function deleteCompletedByPlannedId(plannedSessionId: string) {
    const supabase = sb();
    const userId = await requireUserId();

    const { error } = await supabase
        .from("completed_sessions")
        .delete()
        .eq("planned_session_id", plannedSessionId)
        .eq("user_id", userId);

    if (error) throw error;
}

export async function listCompletedRange(fromISO: string, toISO: string): Promise<CompletedSession[]> {
    const supabase = sb();
    const userId = await requireUserId();

    const { data, error } = await supabase
        .from("completed_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("date_iso", fromISO)
        .lte("date_iso", toISO)
        .order("date_iso", { ascending: false })
        .order("start_time", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r) => ({
        id: r.id,
        plannedSessionId: r.planned_session_id,
        type: r.type,
        title: r.title,
        dateISO: String(r.date_iso),
        startTime: r.start_time,
        durationMin: r.duration_min,
        rpe: r.rpe,
    }));
}

// Convenience: "all time"
export async function getCompletedSessions(): Promise<CompletedSession[]> {
    return listCompletedRange("0001-01-01", "9999-12-31");
}

// -----------------------------
// Settings
// -----------------------------
const DEFAULT_SETTINGS: Settings = {
    primaryType: "BADMINTON",
    defaultDuration: 60,
    defaultRpe: 6,
};

export async function loadSettings(): Promise<Settings> {
    const supabase = sb();
    const userId = await requireUserId();

    const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", userId)
        .maybeSingle();

    if (error || !data?.settings) return DEFAULT_SETTINGS;

    const raw = data.settings as Partial<Settings>;
    return {
        primaryType: raw.primaryType ?? DEFAULT_SETTINGS.primaryType,
        defaultDuration: raw.defaultDuration ?? DEFAULT_SETTINGS.defaultDuration,
        defaultRpe: raw.defaultRpe ?? DEFAULT_SETTINGS.defaultRpe,
    };
}

export async function saveSettings(next: Settings) {
    const supabase = sb();
    const userId = await requireUserId();

    const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        settings: next,
        updated_at: new Date().toISOString(),
    });

    if (error) throw error;
}

export async function resetAll() {
    const supabase = sb();
    const userId = await requireUserId();

    // order: completed -> planned -> templates -> settings
    await supabase.from("completed_sessions").delete().eq("user_id", userId);
    await supabase.from("planned_sessions").delete().eq("user_id", userId);
    await supabase.from("templates").delete().eq("user_id", userId);
    await supabase.from("user_settings").delete().eq("user_id", userId);
}
