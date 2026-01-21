"use client";

import React, { useMemo, useState } from "react";
import { loadSettings, saveSettings, resetAll } from "@/lib/storage";
import { SessionType } from "@/lib/types";
import { StatusDot } from "@/components/status-dot";
import {AppPageHeader} from "@/components/app-page-header";

export default function SettingsPage() {
    const initial = useMemo(() => loadSettings(), []);
    const [settings, setSettings] = useState(initial);
    const [confirmReset, setConfirmReset] = useState(false);

    function update<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
        const next = { ...settings, [key]: value };
        setSettings(next);
        saveSettings(next);
    }

    return (
        <div className="relative h-dvh space-y-4 px-4 pb-24">
            <AppPageHeader
                title="Settings"
                subtitle="Customize defaults and app behavior."
            />

            <Section title="Defaults">
                <Row label="Primary focus">
                    <div className="flex items-center gap-2">
                        <StatusDot type={settings.primaryType} />
                        <select
                            value={settings.primaryType}
                            onChange={(e) => update("primaryType", e.target.value as SessionType)}
                            className="h-9 rounded-xl bg-background px-3 text-sm ring-1 ring-border"
                        >
                            <option value="BADMINTON">Badminton</option>
                            <option value="GYM">Workout</option>
                            <option value="RECOVERY">Recovery</option>
                        </select>
                    </div>
                </Row>

                <Row label="Default duration (min)">
                    <input
                        type="number"
                        min={15}
                        step={5}
                        value={settings.defaultDuration}
                        onChange={(e) => update("defaultDuration", Number(e.target.value))}
                        className="h-9 w-15 rounded-xl bg-background px-3 text-right text-sm ring-1 ring-border"
                    />
                </Row>

                <Row label="Default RPE">
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={settings.defaultRpe}
                        onChange={(e) => update("defaultRpe", Number(e.target.value))}
                        className="h-9 w-20 rounded-xl bg-background px-3 text-right text-sm ring-1 ring-border"
                    />
                </Row>
            </Section>

            <Section title="Behavior">
                <ToggleRow
                    label="Week starts on Monday"
                    value={settings.weekStartsMonday}
                    onChange={(v) => update("weekStartsMonday", v)}
                />
                <ToggleRow
                    label="Confirm before delete"
                    value={settings.confirmDelete}
                    onChange={(v) => update("confirmDelete", v)}
                />
            </Section>

            <Section title="Data">
                {!confirmReset ? (
                    <button
                        onClick={() => setConfirmReset(true)}
                        className="w-full rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-500/20"
                    >
                        Reset all data
                    </button>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            This will permanently delete all sessions, templates, and settings.
                        </p>
                        <button
                            onClick={() => {
                                resetAll();
                                location.reload();
                            }}
                            className="w-full rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white"
                        >
                            Yes, delete everything
                        </button>
                        <button
                            onClick={() => setConfirmReset(false)}
                            className="w-full rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground ring-1 ring-border"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </Section>

            <Section title="About">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">App</span>
                    <span className="font-medium">Training Planner</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">0.1.0</span>
                </div>
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2 rounded-2xl bg-card p-3 ring-1 ring-border">
            <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{label}</span>
            {children}
        </div>
    );
}

function ToggleRow({
                       label,
                       value,
                       onChange,
                   }: {
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={[
                    "h-6 w-11 rounded-full transition",
                    value ? "bg-primary" : "bg-muted ring-1 ring-border",
                ].join(" ")}
                aria-label={label}
            >
        <span
            className={[
                "block h-5 w-5 translate-x-0.5 rounded-full bg-background transition",
                value ? "translate-x-5" : "",
            ].join(" ")}
        />
            </button>
        </div>
    );
}
