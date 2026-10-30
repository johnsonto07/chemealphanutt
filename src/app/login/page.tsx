"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-24 text-center">
      <h1 className="text-2xl font-bold">Lecture Attendance</h1>
      <button
        onClick={signIn}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Sign in with Google"}
      </button>
      <p className="text-sm opacity-70">Use your berkeley.edu account.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
