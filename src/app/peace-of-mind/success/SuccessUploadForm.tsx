"use client";

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

const MAX_PER_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const ACCEPT_ATTR =
  ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const ALLOWED_EXT = new Set([
  "pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx",
]);

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

type Status = "idle" | "submitting" | "success" | "error";

export default function SuccessUploadForm({
  sessionId,
  prefilledName,
  prefilledQuoteCount,
}: {
  sessionId: string;
  prefilledName: string;
  prefilledQuoteCount: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError("");
      const next: File[] = [...files];
      for (const f of Array.from(incoming)) {
        if (!ALLOWED_EXT.has(extOf(f.name))) {
          setError(`"${f.name}" is not a supported file type.`);
          continue;
        }
        if (f.size > MAX_PER_FILE_BYTES) {
          setError(`"${f.name}" is over the 25 MB per-file limit.`);
          continue;
        }
        if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
        next.push(f);
      }
      const newTotal = next.reduce((s, f) => s + f.size, 0);
      if (newTotal > MAX_TOTAL_BYTES) {
        setError("Total upload is over the 100 MB limit. Remove a file and try again.");
        return;
      }
      setFiles(next);
    },
    [files],
  );

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (i: number) => {
    setFiles(files.filter((_, idx) => idx !== i));
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "submitting") return;
    setError("");

    if (files.length === 0) {
      setError("Attach at least one quote, plan or spec file.");
      return;
    }

    setStatus("submitting");
    try {
      const fd = new FormData();
      fd.set("session_id", sessionId); // verified server-side before processing
      fd.set("paid", "true");
      // Server pulls name/email/etc from the verified Stripe session metadata,
      // so we don't have to re-collect them. We pass the values it expects in
      // its current ParsedForm shape so we don't have to fork the route.
      fd.set("name", prefilledName);
      fd.set("quoteCount", prefilledQuoteCount);
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/peace-of-mind/start", { method: "POST", body: fd });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({ ok: false, error: "Unexpected server response." }));
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Upload failed. Please try again.");
        return;
      }
      setStatus("success");
    } catch (err) {
      console.error("[peace-of-mind/success] upload failed:", err);
      setStatus("error");
      setError("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-[10px] border border-bh-orange/40 bg-bh-cloud p-8 md:p-10">
        <span className="inline-block w-11 h-[3px] bg-bh-orange mb-5" />
        <h3 className="font-medium tracking-[-0.02em] text-[24px] md:text-[30px] leading-[1.1] text-bh-black">
          Quotes received.
        </h3>
        <p className="mt-4 text-[15px] md:text-[16px] leading-[1.55] text-bh-graphite max-w-xl">
          Your review is on the queue. We&rsquo;ll be in touch within one
          business day to confirm scope, and your detailed report will land in
          your inbox within 5 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-12 gap-4 md:gap-5">
      <div className="col-span-12">
        <p className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Quotes, plans and specifications <span className="text-bh-orange">*</span>
        </p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`flex flex-col items-center justify-center text-center cursor-pointer rounded-[10px] border-2 border-dashed px-6 py-10 transition-colors ${
            dragOver
              ? "border-bh-orange bg-bh-orange/5"
              : "border-bh-steel/60 bg-bh-cloud/40 hover:border-bh-orange hover:bg-bh-orange/5"
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="mb-3 text-bh-orange">
            <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[15px] text-bh-black">
            Drop your files here, or{" "}
            <span className="text-bh-orange underline underline-offset-2">browse</span>
          </p>
          <p className="mt-1 text-[12px] text-bh-graphite">
            PDF, JPG, PNG, DOC, DOCX, XLS, XLSX. Up to 25 MB per file, 100 MB total.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            name="files"
            multiple
            accept={ACCEPT_ATTR}
            onChange={handleFileInput}
            className="sr-only"
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-4 divide-y divide-bh-steel/40 border border-bh-steel/40 rounded-[8px] bg-bh-white">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 min-w-0 truncate text-[14px] text-bh-black">{f.name}</span>
                <span className="text-[12px] text-bh-graphite tabular-nums">{fmtBytes(f.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${f.name}`}
                  className="ml-2 inline-flex items-center justify-center w-7 h-7 rounded-full text-bh-graphite hover:text-bh-orange hover:bg-bh-orange/10"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <p className="mt-2 text-[12px] text-bh-graphite tabular-nums">
            {files.length} file{files.length === 1 ? "" : "s"}, {fmtBytes(totalBytes)} total
          </p>
        )}
      </div>

      {error && (
        <div className="col-span-12 rounded-[8px] border border-bh-orange/50 bg-bh-orange/5 px-4 py-3 text-[14px] text-bh-black">
          {error}
        </div>
      )}

      <div className="col-span-12">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] bg-bh-orange text-bh-paper text-[14px] font-medium tracking-[-0.005em] hover:bg-bh-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Uploading..." : "Send my quotes"}
        </button>
      </div>
    </form>
  );
}
