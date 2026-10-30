import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILES = 20;

// TODO(Johnson): return the SHA-256 hash of `bytes` as a 64-character hex string.
// Use Node's built-in crypto module: import { createHash } from "node:crypto"
// at the top of this file, then createHash("sha256"), .update(bytes), .digest("hex").
// The same bytes must always give the same string; that is what lets the
// database's unique constraint catch a reused photo.
function sha256Hex(bytes: Buffer): string {
  void bytes;
  throw new Error("sha256Hex is not written yet");
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Not signed in", 401);

  const body = await request.json().catch(() => null);
  const sessionId = Number(body?.sessionId);
  const paths: unknown = body?.paths;
  if (
    !Number.isInteger(sessionId) ||
    !Array.isArray(paths) ||
    paths.length === 0 ||
    paths.length > MAX_FILES ||
    !paths.every((p) => typeof p === "string" && p.startsWith(`${user.id}/`))
  ) {
    return fail("Invalid request");
  }
  const filePaths = paths as string[];
  if (filePaths.some((p) => p.endsWith(".pdf")) && filePaths.length > 1) {
    return fail("Upload either photos or a single PDF");
  }

  const admin = createAdminClient();
  const bucket = admin.storage.from("notes");

  const files: { path: string; sha256: string }[] = [];
  for (const path of filePaths) {
    const { data, error } = await bucket.download(path);
    if (error || !data) {
      await bucket.remove(filePaths);
      return fail("An uploaded file is missing. Try again.");
    }
    files.push({ path, sha256: sha256Hex(Buffer.from(await data.arrayBuffer())) });
  }

  const { error } = await admin.rpc("create_submission", {
    p_user_id: user.id,
    p_session_id: sessionId,
    p_files: files,
  });
  if (error) {
    await bucket.remove(filePaths);
    return fail(error.message);
  }

  return NextResponse.json({ ok: true });
}
