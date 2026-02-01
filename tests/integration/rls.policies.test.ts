import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const password = process.env.TEST_USER_PASSWORD!;

function mustEnv(name: string, value: string | undefined) {
    if (!value) throw new Error(`Missing env var: ${name}`);
}

function memoryStorage() {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
    };
}

type CreatedUser = { id: string; email: string };

describe("RLS policies (automated users)", () => {
    let admin: SupabaseClient;
    let userA: CreatedUser;
    let userB: CreatedUser;

    // Track rows we create so we can clean up deterministically
    const insertedPlannedIds: string[] = [];

    beforeAll(async () => {
        mustEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
        mustEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
        mustEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        mustEnv("TEST_USER_PASSWORD", process.env.TEST_USER_PASSWORD);

        admin = createClient(url, serviceKey);

        const runId = crypto.randomUUID().slice(0, 8);
        const emailA = `rls.a.${runId}@test.local`;
        const emailB = `rls.b.${runId}@test.local`;

        // Create users (confirmed email) so password login works immediately
        const aRes = await admin.auth.admin.createUser({
            email: emailA,
            password,
            email_confirm: true,
        });
        if (aRes.error) throw aRes.error;
        if (!aRes.data.user) throw new Error("Failed to create user A");

        const bRes = await admin.auth.admin.createUser({
            email: emailB,
            password,
            email_confirm: true,
        });
        if (bRes.error) throw bRes.error;
        if (!bRes.data.user) throw new Error("Failed to create user B");

        userA = { id: aRes.data.user.id, email: emailA };
        userB = { id: bRes.data.user.id, email: emailB };
    });

    afterAll(async () => {
        // 1) Cleanup rows we inserted (admin bypasses RLS)
        if (insertedPlannedIds.length > 0) {
            await admin.from("planned_sessions").delete().in("id", insertedPlannedIds);
        }

        // 2) Delete users (also removes any auth artifacts)
        if (userA?.id) await admin.auth.admin.deleteUser(userA.id);
        if (userB?.id) await admin.auth.admin.deleteUser(userB.id);
    });

    it("prevents user A from reading user B planned sessions", async () => {
        // Arrange: insert a planned session for user B (admin bypasses RLS)
        const plannedId = crypto.randomUUID();

        const weekStart = "2026-01-26"; // Monday

        const ins = await admin.from("planned_sessions").insert({
            id: plannedId,
            user_id: userB.id,
            week_start: weekStart,
            day_index: 0,                 // Monday
            type: "BADMINTON",
            title: "B private",
            start_time: "18:00",
            duration_min: 60,
            rpe_planned: 6,
            status: null,
        });

        expect(ins.error).toBeNull();
        insertedPlannedIds.push(plannedId);

        // Act: login as user A (real user session, anon key)
        const userAClient = createClient(url, anonKey, {
            auth: {
                persistSession: false,
                storage: memoryStorage(),
            },
        });

        const login = await userAClient.auth.signInWithPassword({
            email: userA.email,
            password,
        });
        expect(login.error).toBeNull();

        // Attempt to read user B’s rows directly
        const res = await userAClient
            .from("planned_sessions")
            .select("id,user_id,title")
            .eq("user_id", userB.id);

        // Assert: RLS should prevent returning rows (usually empty array, not an error)
        expect(res.error).toBeNull();
        expect(res.data ?? []).toHaveLength(0);
    });

    it("allows user B to read their own planned sessions", async () => {
        // Act: login as user B
        const userBClient = createClient(url, anonKey, {
            auth: {
                persistSession: false,
                storage: memoryStorage(),
            },
        });

        const login = await userBClient.auth.signInWithPassword({
            email: userB.email,
            password,
        });
        expect(login.error).toBeNull();

        const res = await userBClient.from("planned_sessions").select("id,title").eq("user_id", userB.id);

        // Assert: should see at least the row inserted in the previous test
        expect(res.error).toBeNull();
        expect((res.data ?? []).length).toBeGreaterThanOrEqual(1);
    });
});
