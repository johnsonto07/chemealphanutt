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

  const email = (data.user.email ?? "").toLowerCase();
  const { data: allowed } = await supabase
    .from("allowed_emails")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/not-invited`);
  }

  return NextResponse.redirect(`${origin}/`);
}
