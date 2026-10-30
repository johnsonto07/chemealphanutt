export default function NotInvitedPage() {
  return (
    <div className="flex flex-col gap-4 pt-24 text-center">
      <h1 className="text-2xl font-bold">Not invited</h1>
      <p>This site is only for three people, and your account isn&apos;t one of them.</p>
      <form action="/auth/signout" method="post">
        <button className="underline">Sign in with a different account</button>
      </form>
    </div>
  );
}
