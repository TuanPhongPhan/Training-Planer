import { createClient } from "@supabase/supabase-js";

export default async function globalTeardown() {
    const url =
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const userId = process.env.E2E_USER_ID;

    if (!url || !serviceKey || !userId) {
        console.warn("global-teardown skipped: missing env vars", {
            hasUrl: !!url,
            hasServiceKey: !!serviceKey,
            hasUserId: !!userId,
        });
        return;
    }

    const admin = createClient(url, serviceKey);

    console.log("global-teardown: cleaning E2E data for user", userId);

    // --- DELETE ---
    await admin.from("completed_sessions").delete().eq("user_id", userId);
    await admin.from("planned_sessions").delete().eq("user_id", userId);
    await admin.from("templates").delete().eq("user_id", userId);

    // --- VERIFY ---
    const [completed, planned, templates] = await Promise.all([
        admin.from("completed_sessions").select("id").eq("user_id", userId),
        admin.from("planned_sessions").select("id").eq("user_id", userId),
        admin.from("templates").select("id").eq("user_id", userId),
    ]);

    const remaining = {
        completed_sessions: completed.data?.length ?? 0,
        planned_sessions: planned.data?.length ?? 0,
        templates: templates.data?.length ?? 0,
    };

    if (
        remaining.completed_sessions === 0 &&
        remaining.planned_sessions === 0 &&
        remaining.templates === 0
    ) {
        console.log("global-teardown complete: database cleaned successfully");
    } else {
        console.warn("global-teardown incomplete: remaining rows detected", remaining);
    }
}
