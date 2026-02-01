"use client";

import {SessionType, Settings} from "@/lib/types";
import { StatusDot } from "@/components/status-dot";
import {AppPageHeader} from "@/components/app-page-header";
import React, { useEffect, useState } from "react";
import { loadSettings, saveSettings, resetAll } from "@/lib/storage";
import {signOut} from "@/app/actions/auth/sign-out";

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);

    const [newPassword, setNewPassword] = useState("");
    const [pwStatus, setPwStatus] = useState<null | { type: "ok" | "err"; msg: string }>(null);
    const [pwLoading, setPwLoading] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    useEffect(() => {
        loadSettings().then(setSettings).catch(console.error);
    }, []);

    if (!settings) return <div className="relative h-dvh space-y-4 px-4 pb-24" />;

    async function update<K extends keyof Settings>(key: K, value: Settings[K]) {
        if (!settings) return;

        const next: Settings = { ...settings, [key]: value };
        setSettings(next);
        await saveSettings(next);
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
                        className="h-9 w-15 rounded-xl bg-background px-3 text-right text-sm ring-1 ring-border"
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
                            onClick={async () => {
                                await resetAll();
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

            <Section title="Security">
                {!showChangePassword ? (
                    <button
                        onClick={() => setShowChangePassword(true)}
                        className="w-full rounded-xl border px-3 py-2 text-sm font-medium"
                    >
                        Change password
                    </button>
                ) : (
                    <>
                        {pwStatus && (
                            <div
                                className={[
                                    "rounded-xl border px-3 py-2 text-sm",
                                    pwStatus.type === "ok"
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                        : "border-rose-500/30 bg-rose-500/10 text-rose-700",
                                ].join(" ")}
                            >
                                {pwStatus.msg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={6}
                                className="h-9 w-full rounded-xl bg-background px-3 text-sm ring-1 ring-border"
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                            />

                            <button
                                disabled={pwLoading || newPassword.length < 6}
                                onClick={async () => {
                                    setPwLoading(true);
                                    setPwStatus(null);
                                    try {
                                        const res = await fetch("/api/auth/change-password", {
                                            method: "POST",
                                            headers: { "content-type": "application/json" },
                                            body: JSON.stringify({ password: newPassword }),
                                        });
                                        const data = (await res.json()) as { ok: boolean; message?: string };

                                        if (!res.ok || !data.ok) {
                                            setPwStatus({
                                                type: "err",
                                                msg: data.message ?? "Failed to update password.",
                                            });
                                        } else {
                                            setPwStatus({ type: "ok", msg: "Password updated successfully." });
                                            setNewPassword("");
                                            setShowChangePassword(false);
                                        }
                                    } catch {
                                        setPwStatus({ type: "err", msg: "Network error. Please try again." });
                                    } finally {
                                        setPwLoading(false);
                                    }
                                }}
                                className={[
                                    "w-full rounded-xl px-3 py-2 text-sm font-medium ring-1",
                                    pwLoading || newPassword.length < 6
                                        ? "bg-muted text-muted-foreground ring-border"
                                        : "bg-primary text-primary-foreground shadow-sm hover:opacity-95 active:opacity-90",
                                ].join(" ")}
                            >
                                {pwLoading ? "Updating..." : "Update password"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setPwStatus(null);
                                    setNewPassword("");
                                }}
                                className="w-full rounded-xl border px-3 py-2 text-sm"
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            You may need to log in again on other devices after changing your password.
                        </p>
                    </>
                )}
            </Section>

            <Section title="Sign Out">
                <form action={signOut}>
                    <button
                        type="submit"
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium text-destructive"
                    >
                        Sign out
                    </button>
                </form>
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
