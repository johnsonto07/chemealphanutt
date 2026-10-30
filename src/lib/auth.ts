import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
};

// Every member page calls this. A signed-in user without a profile row is not
// on the allowlist, so they get sent to /not-invited.
export async function requireMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, is_admin")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (!profile) redirect("/not-invited");

  return { supabase, user, profile };
}
