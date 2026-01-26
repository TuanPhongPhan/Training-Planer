import { supabaseBrowser } from "@/lib/supabase/client";

export async function ensureSeeded() {
    const supabase = supabaseBrowser();

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;

    const userId = userRes.user?.id;
    if (!userId) return; // not signed in yet

    // check templates for THIS user only
    const { count, error } = await supabase
        .from("templates")
        .select("*", { head: true, count: "exact" })
        .eq("user_id", userId);

    if (error) throw error;
    if ((count ?? 0) > 0) return;

    const rows = [
        { type: "BADMINTON", title: "Footwork + Defense", duration_min: 75, rpe_default: 7, focus_tags: ["footwork", "defense"] },
        { type: "BADMINTON", title: "Net + Drops", duration_min: 60, rpe_default: 6, focus_tags: ["net", "control"] },
        { type: "BADMINTON", title: "Matchplay", duration_min: 90, rpe_default: 8, focus_tags: ["matchplay", "tactics"] },
        { type: "GYM", title: "Upper Strength", duration_min: 60, rpe_default: 7, focus_tags: ["upper", "strength"] },
        { type: "GYM", title: "Lower Strength", duration_min: 60, rpe_default: 7, focus_tags: ["lower", "strength"] },
        { type: "RECOVERY", title: "Mobility + Stretch", duration_min: 20, rpe_default: 2, focus_tags: ["mobility"] },
        { type: "RECOVERY", title: "Easy cardio", duration_min: 30, rpe_default: 3, focus_tags: ["zone2"] },
    ].map((r) => ({ ...r, user_id: userId }));

    const { error: insErr } = await supabase.from("templates").insert(rows);
    if (insErr) throw insErr;
}
