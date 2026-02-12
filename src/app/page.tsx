/**
 * Root entry route.
 * Redirects authenticated users to the weekly planner and guests to login.
 */
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/week");
  }

  redirect("/login");
}
