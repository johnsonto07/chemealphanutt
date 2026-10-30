import { requireMember } from "@/lib/auth";
import { formatTime } from "@/lib/time";

type TodaySession = {
  id: number;
  starts_at: string;
  ends_at: string;
  cancelled: boolean;
  course_code: string;
};

export default async function HomePage() {
  const { supabase, profile } = await requireMember();

  const { data: sessions } = await supabase
    .from("sessions_today")
    .select("id, starts_at, ends_at, cancelled, course_code")
    .returns<TodaySession[]>();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <p>Hi, {profile.display_name}</p>
        <form action="/auth/signout" method="post">
          <button className="text-sm underline">Sign out</button>
        </form>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Today&apos;s lectures</h2>
        {!sessions?.length ? (
          <p className="opacity-70">No lectures today.</p>
        ) : (
          <ul className="divide-y divide-neutral-500/30 rounded-lg border border-neutral-500/30">
            {sessions.map((s) => (
              <li key={s.id} className="flex justify-between px-4 py-3">
                <span className={s.cancelled ? "line-through opacity-50" : ""}>
                  {s.course_code}
                </span>
                <span className="opacity-70">
                  {s.cancelled
                    ? "Cancelled"
                    : `${formatTime(s.starts_at)}–${formatTime(s.ends_at)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
