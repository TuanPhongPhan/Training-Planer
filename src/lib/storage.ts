import {PlannedSession, CompletedSession, Settings} from "@/lib/types";

export type Template = {
    id: string;
    type: "BADMINTON" | "GYM" | "RECOVERY";
    title: string;
    durationMin: number;
    rpeDefault: number;
    focusTags: string[];
};

const KEY = "training_planner_v1";

type Store = {
    templates: Template[];
    planned: PlannedSession[];
    completed: CompletedSession[];
    settings?: Settings;
};

const DEFAULT_SETTINGS: Settings = {
    primaryType: "BADMINTON",
    defaultDuration: 60,
    defaultRpe: 7,
    weekStartsMonday: true,
    confirmDelete: true,
};

function safeParse(json: string | null): unknown {
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}


export function loadStore(): Store {
    if (typeof window === "undefined") return { templates: [], planned: [], completed: [] };

    const parsed = safeParse(localStorage.getItem(KEY));

    if (isRecord(parsed)) {
        const templates = Array.isArray(parsed.templates) ? (parsed.templates as Template[]) : [];
        const planned = Array.isArray(parsed.planned) ? (parsed.planned as PlannedSession[]) : [];
        const completed = Array.isArray(parsed.completed) ? (parsed.completed as CompletedSession[]) : [];
        const settings = isRecord(parsed.settings) ? (parsed.settings as Settings) : DEFAULT_SETTINGS;
        return { templates, planned, completed, settings };
    }

    // seed defaults (nice first-run experience)
    const seeded: Store = {
        templates: [
            { id: uid(), type: "BADMINTON", title: "Footwork + Defense", durationMin: 75, rpeDefault: 7, focusTags: ["footwork", "defense"] },
            { id: uid(), type: "BADMINTON", title: "Net + Drops", durationMin: 60, rpeDefault: 6, focusTags: ["net", "control"] },
            { id: uid(), type: "BADMINTON", title: "Matchplay", durationMin: 90, rpeDefault: 8, focusTags: ["matchplay", "tactics"] },
            { id: uid(), type: "GYM", title: "Upper Strength", durationMin: 60, rpeDefault: 7, focusTags: ["upper", "strength"] },
            { id: uid(), type: "GYM", title: "Lower Strength", durationMin: 60, rpeDefault: 7, focusTags: ["lower", "strength"] },
            { id: uid(), type: "RECOVERY", title: "Mobility + Stretch", durationMin: 20, rpeDefault: 2, focusTags: ["mobility"] },
            { id: uid(), type: "RECOVERY", title: "Easy cardio", durationMin: 30, rpeDefault: 3, focusTags: ["zone2"] },
        ],
        planned: [],
        completed: [],
    };
    saveStore(seeded);
    return seeded;
}

export function saveStore(store: Store) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(store));
}

export function uid() {
    return Math.random().toString(36).slice(2, 10);
}

export function getCompletedSessions(): CompletedSession[] {
    return loadStore().completed;
}

export function loadSettings(): Settings {
    const s = loadStore().settings ?? DEFAULT_SETTINGS;
    // merge to survive new fields later
    return { ...DEFAULT_SETTINGS, ...s };
}

export function saveSettings(next: Settings) {
    const store = loadStore();
    store.settings = next;
    saveStore(store);
}

export function resetAll() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY);
}

