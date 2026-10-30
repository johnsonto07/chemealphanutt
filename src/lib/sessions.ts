import type { SupabaseClient } from "@supabase/supabase-js";

export type TodaySession = {
  id: number;
  starts_at: string;
  ends_at: string;
  cancelled: boolean;
  course_code: string;
};

export async function getTodaySessions(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("sessions_today")
    .select("id, starts_at, ends_at, cancelled, course_code")
    .returns<TodaySession[]>();
  return data ?? [];
}

// Map of session_id -> submission status for this user.
export async function getMySubmissions(
  supabase: SupabaseClient,
  userId: string,
  sessionIds: number[],
) {
  if (sessionIds.length === 0) return new Map<number, string>();
  const { data } = await supabase
    .from("submissions")
    .select("session_id, status")
    .eq("user_id", userId)
    .in("session_id", sessionIds);
  return new Map((data ?? []).map((s) => [s.session_id as number, s.status as string]));
}
