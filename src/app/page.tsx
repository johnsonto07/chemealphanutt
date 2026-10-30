import { requireMember } from "@/lib/auth";

export default async function HomePage() {
  const { profile } = await requireMember();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <p>Hi, {profile.display_name}</p>
        <form action="/auth/signout" method="post">
          <button className="text-sm underline">Sign out</button>
        </form>
      </header>
      <p className="opacity-70">Submitting notes comes in milestone 3.</p>
    </div>
  );
}
