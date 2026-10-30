import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getMySubmissions, getTodaySessions } from "@/lib/sessions";
import { formatTime } from "@/lib/time";
import SubmitForm from "./SubmitForm";

export default async function SubmitPage() {
  const { supabase, profile } = await requireMember();

  const now = Date.now();
  const sessions = await getTodaySessions(supabase);
  const mine = await getMySubmissions(supabase, profile.id, sessions.map((s) => s.id));

  // Lectures that have started, aren't cancelled, and that I haven't submitted
  // for yet. Most recent first, so the default is the current/latest lecture.
  const open = sessions
    .filter((s) => !s.cancelled && new Date(s.starts_at).getTime() <= now && !mine.has(s.id))
    .reverse()
    .map((s) => ({ id: s.id, label: `${s.course_code} · ${formatTime(s.starts_at)}` }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">Submit notes</h1>
      {open.length === 0 ? (
        <p className="opacity-70">
          Nothing to submit right now. You can submit once a lecture has started, until 11:59 pm
          that day.
        </p>
      ) : (
        <SubmitForm userId={profile.id} sessions={open} />
      )}
    </div>
  );
}
