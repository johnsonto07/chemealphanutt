import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // TODO(Johnson): check the allowlist.
  // At this point the user is signed in and data.user.email is their Google email.
  // 1. Query the "allowed_emails" table for a row whose email equals
  //    data.user.email lowercased. Use supabase.from(...).select(...).eq(...).maybeSingle().
  //    The RLS policy only lets a user see their own row, so you get the row or null.
  // 2. If there is no row, call supabase.auth.signOut() and redirect to `${origin}/not-invited`.
  // 3. Otherwise fall through to the redirect below.

  return NextResponse.redirect(`${origin}/`);
}
