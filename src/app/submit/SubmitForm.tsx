"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

const isPdf = (f: File) => f.type === "application/pdf";

export default function SubmitForm({
  userId,
  sessions,
}: {
  userId: string;
  sessions: { id: number; label: string }[];
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(sessions[0].id);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next = [...files, ...added];
    if (next.some(isPdf) && next.length > 1) {
      setError("Upload either photos or a single PDF, not both.");
      return;
    }
    if (next.some((f) => isPdf(f) && f.size > MAX_PDF_BYTES)) {
      setError("PDF is larger than 10 MB.");
      return;
    }
    setError(null);
    setFiles(next);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const paths: string[] = [];
    try {
      for (const [i, file] of files.entries()) {
        setStatus(`Uploading ${i + 1} of ${files.length}...`);
        const pdf = isPdf(file);
        const blob = pdf ? file : await compressImage(file);
        const path = `${userId}/${sessionId}/${crypto.randomUUID()}.${pdf ? "pdf" : "jpg"}`;
        const { error } = await supabase.storage
          .from("notes")
          .upload(path, blob, { contentType: pdf ? "application/pdf" : "image/jpeg" });
        if (error) throw new Error(error.message);
        paths.push(path);
      }

      setStatus("Checking...");
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, paths }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Submission failed");

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus(null);
      setBusy(false);
    }
  }

  const button = "block rounded-lg border border-neutral-500/50 px-4 py-3 text-center font-medium";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-70">Lecture</span>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(Number(e.target.value))}
          disabled={busy}
          className="rounded-lg border border-neutral-500/50 bg-transparent px-3 py-3"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={button}>
          Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={addFiles}
            disabled={busy}
            className="hidden"
          />
        </label>
        <label className={button}>
          Choose files
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={addFiles}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="truncate">{f.name}</span>
              <button
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                disabled={busy}
                className="ml-3 underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={submit}
        disabled={busy || files.length === 0}
        className="rounded-lg bg-blue-600 px-4 py-4 text-lg font-semibold text-white disabled:opacity-50"
      >
        {busy ? status : `Submit ${files.length || ""} ${files.length === 1 ? "file" : "files"}`}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
