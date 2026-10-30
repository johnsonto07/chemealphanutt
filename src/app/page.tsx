import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getMySubmissions, getTodaySessions } from "@/lib/sessions";
import { formatTime } from "@/lib/time";

export default async function HomePage() {
  const { supabase, profile } = await requireMember();

  const sessions = await getTodaySessions(supabase);
  const mine = await getMySubmissions(supabase, profile.id, sessions.map((s) => s.id));

  function statusText(id: number, cancelled: boolean) {
    if (cancelled) return "Cancelled";
    const status = mine.get(id);
    if (status === "accepted") return "Submitted ✓";
    if (status === "rejected") return "Rejected";
    return "Not submitted";
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <p>Hi, {profile.display_name}</p>
        <form action="/auth/signout" method="post">
          <button className="text-sm underline">Sign out</button>
        </form>
      </header>

      <Link
        href="/submit"
        className="rounded-xl bg-blue-600 px-4 py-8 text-center text-2xl font-bold text-white"
      >
        Submit notes
      </Link>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Today&apos;s lectures</h2>
        {sessions.length === 0 ? (
          <p className="opacity-70">No lectures today.</p>
        ) : (
          <ul className="divide-y divide-neutral-500/30 rounded-lg border border-neutral-500/30">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className={s.cancelled ? "line-through opacity-50" : ""}>
                  <p className="font-medium">{s.course_code}</p>
                  <p className="text-sm opacity-70">
                    {formatTime(s.starts_at)}–{formatTime(s.ends_at)}
                  </p>
                </div>
                <span className="text-sm">{statusText(s.id, s.cancelled)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
