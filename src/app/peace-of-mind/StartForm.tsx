"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

const MAX_PER_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB
const ACCEPT_ATTR =
  ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const ALLOWED_EXT = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
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

type Status = "idle" | "submitting" | "redirecting" | "success" | "error";

export default function StartForm({
  paymentStatus,
}: {
  paymentStatus?: "paid" | "cancelled";
}) {
  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const addressId = useId();
  const buildersId = useId();
  const notesId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [quoteCount, setQuoteCount] = useState<"1" | "2" | "3">("1");
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError("");
      const next: File[] = [...files];
      for (const f of Array.from(incoming)) {
        const ext = extOf(f.name);
        if (!ALLOWED_EXT.has(ext)) {
          setError(
            `"${f.name}" is not a supported file type. PDF, JPG, PNG, DOC, DOCX, XLS or XLSX only.`,
          );
          continue;
        }
        if (f.size > MAX_PER_FILE_BYTES) {
          setError(`"${f.name}" is over the 25 MB per-file limit.`);
          continue;
        }
        // Skip exact duplicates (same name + size)
        if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
        next.push(f);
      }
      const newTotal = next.reduce((sum, f) => sum + f.size, 0);
      if (newTotal > MAX_TOTAL_BYTES) {
        setError("Total upload is over the 100 MB limit. Remove a file and try again.");
        return;
      }
      setFiles(next);
    },
    [files],
  );

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      addFiles(e.target.files);
      // reset so the same file can be re-picked after removal
      e.target.value = "";
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
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
      const formEl = e.currentTarget;
      const fd = new FormData(formEl);
      // FormData picks up the native <input type=file>, but we've been managing
      // state in React. Replace what the native input had with our curated list.
      fd.delete("files");
      for (const f of files) fd.append("files", f);

      const res = await fetch("/api/peace-of-mind/start", {
        method: "POST",
        body: fd,
      });
      const data: { ok?: boolean; error?: string; submissionId?: string } = await res
        .json()
        .catch(() => ({ ok: false, error: "Unexpected response from the server." }));
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      // Lead + documents are captured. Move to online payment.
      const email = String(fd.get("email") || "").trim();
      const name = String(fd.get("name") || "").trim();
      try {
        const pay = await fetch("/api/peace-of-mind/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, ref: data.submissionId }),
        });
        if (pay.ok) {
          const payData: { ok?: boolean; url?: string } = await pay
            .json()
            .catch(() => ({}));
          if (payData.ok && payData.url) {
            setStatus("redirecting");
            window.location.href = payData.url;
            return;
          }
        }
        // 503 (Stripe not switched on yet) or any hiccup: the request is safely
        // captured, so fall back to manual payment follow-up.
      } catch (payErr) {
        console.warn("[peace-of-mind] checkout unavailable, manual follow-up:", payErr);
      }
      setStatus("success");
    } catch (err) {
      console.error("[peace-of-mind] submit failed:", err);
      setStatus("error");
      setError("Network error. Please try again or email info@buildhawk.com.au.");
    }
  };

  // Returning from Stripe Checkout.
  if (paymentStatus === "paid") {
    return (
      <div className="rounded-[10px] border border-bh-orange/40 bg-bh-cloud p-8 md:p-10">
        <span className="inline-block w-11 h-[3px] bg-bh-orange mb-5" />
        <h3 className="font-medium tracking-[-0.02em] text-[24px] md:text-[30px] leading-[1.1] text-bh-black">
          Payment received. You&rsquo;re all set.
        </h3>
        <p className="mt-4 max-w-xl text-[15px] md:text-[16px] leading-[1.55] text-bh-graphite">
          Your $499 + GST payment is confirmed and your quotes are with our
          team. We&rsquo;ll have your review back within 5 business days. Any
          questions, email{" "}
          <a href="mailto:info@buildhawk.com.au" className="text-bh-orange underline">
            info@buildhawk.com.au
          </a>
          .
        </p>
      </div>
    );
  }

  if (paymentStatus === "cancelled") {
    return (
      <div className="rounded-[10px] border border-bh-steel/60 bg-bh-cloud p-8 md:p-10">
        <span className="inline-block w-11 h-[3px] bg-bh-orange mb-5" />
        <h3 className="font-medium tracking-[-0.02em] text-[24px] md:text-[30px] leading-[1.1] text-bh-black">
          Payment wasn&rsquo;t completed.
        </h3>
        <p className="mt-4 max-w-xl text-[15px] md:text-[16px] leading-[1.55] text-bh-graphite">
          No charge was made. Your details and documents are already with us, so
          there&rsquo;s nothing to resend. We&rsquo;ll email you a secure payment
          link to finish, or you can reach us at{" "}
          <a href="mailto:info@buildhawk.com.au" className="text-bh-orange underline">
            info@buildhawk.com.au
          </a>
          .
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-[10px] border border-bh-orange/40 bg-bh-cloud p-8 md:p-10">
        <span className="inline-block w-11 h-[3px] bg-bh-orange mb-5" />
        <h3 className="font-medium tracking-[-0.02em] text-[24px] md:text-[30px] leading-[1.1] text-bh-black">
          Got it. Your quotes are with us.
        </h3>
        <p className="mt-4 max-w-xl text-[15px] md:text-[16px] leading-[1.55] text-bh-graphite">
          We&rsquo;ll be in touch within one business day to confirm the
          details, arrange payment, and get started on your review. If you
          don&rsquo;t hear from us, check your spam folder or email{" "}
          <a
            href="mailto:info@buildhawk.com.au"
            className="text-bh-orange underline"
          >
            info@buildhawk.com.au
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-12 gap-4 md:gap-5">
      {/* Name */}
      <div className="col-span-12 md:col-span-6">
        <label htmlFor={nameId} className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Your name <span className="text-bh-orange">*</span>
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full h-12 px-4 rounded-[8px] border border-bh-steel/60 bg-bh-white text-[15px] text-bh-black placeholder:text-bh-graphite/60 focus:outline-none focus:border-bh-orange focus:ring-1 focus:ring-bh-orange"
          placeholder="Alex Homeowner"
        />
      </div>

      {/* Email */}
      <div className="col-span-12 md:col-span-6">
        <label htmlFor={emailId} className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Email <span className="text-bh-orange">*</span>
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full h-12 px-4 rounded-[8px] border border-bh-steel/60 bg-bh-white text-[15px] text-bh-black placeholder:text-bh-graphite/60 focus:outline-none focus:border-bh-orange focus:ring-1 focus:ring-bh-orange"
          placeholder="alex@example.com"
        />
      </div>

      {/* Phone */}
      <div className="col-span-12 md:col-span-6">
        <label htmlFor={phoneId} className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Phone <span className="text-bh-orange">*</span>
        </label>
        <input
          id={phoneId}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          className="w-full h-12 px-4 rounded-[8px] border border-bh-steel/60 bg-bh-white text-[15px] text-bh-black placeholder:text-bh-graphite/60 focus:outline-none focus:border-bh-orange focus:ring-1 focus:ring-bh-orange"
          placeholder="04XX XXX XXX"
        />
      </div>

      {/* Address */}
      <div className="col-span-12 md:col-span-6">
        <label htmlFor={addressId} className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Project address or suburb <span className="text-bh-orange">*</span>
        </label>
        <input
          id={addressId}
          name="address"
          type="text"
          required
          autoComplete="street-address"
          className="w-full h-12 px-4 rounded-[8px] border border-bh-steel/60 bg-bh-white text-[15px] text-bh-black placeholder:text-bh-graphite/60 focus:outline-none focus:border-bh-orange focus:ring-1 focus:ring-bh-orange"
          placeholder="Geelong VIC 3220"
        />
      </div>

      {/* Quote count */}
      <fieldset className="col-span-12">
        <legend className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          How many quotes are we reviewing? <span className="text-bh-orange">*</span>
        </legend>
        <div className="flex gap-2 flex-wrap">
          {(["1", "2", "3"] as const).map((n) => {
            const checked = quoteCount === n;
            return (
              <label
                key={n}
                className={`inline-flex items-center justify-center min-w-[80px] h-12 px-5 rounded-[8px] border text-[14px] cursor-pointer transition-colors ${
                  checked
                    ? "bg-bh-ink text-bh-paper border-bh-ink"
                    : "bg-bh-white text-bh-black border-bh-steel/60 hover:border-bh-orange"
                }`}
              >
                <input
                  type="radio"
                  name="quoteCount"
                  value={n}
                  checked={checked}
                  onChange={() => setQuoteCount(n)}
                  className="sr-only"
                />
                {n} {n === "1" ? "quote" : "quotes"}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Builders (optional) */}
      <div className="col-span-12">
        <label htmlFor={buildersId} className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Builder names <span className="text-bh-graphite/60 normal-case tracking-normal text-[12px]">(optional)</span>
        </label>
        <input
          id={buildersId}
          name="builders"
          type="text"
          className="w-full h-12 px-4 rounded-[8px] border border-bh-steel/60 bg-bh-white text-[15px] text-bh-black placeholder:text-bh-graphite/60 focus:outline-none focus:border-bh-orange focus:ring-1 focus:ring-bh-orange"
          placeholder="e.g. Smith Bros, Ace Constructions"
        />
      </div>

      {/* Notes (optional) */}
      <div className="col-span-12">
        <label htmlFor={notesId} className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Notes or specific concerns <span className="text-bh-graphite/60 normal-case tracking-normal text-[12px]">(optional)</span>
        </label>
        <textarea
          id={notesId}
          name="notes"
          rows={4}
          className="w-full px-4 py-3 rounded-[8px] border border-bh-steel/60 bg-bh-white text-[15px] text-bh-black placeholder:text-bh-graphite/60 focus:outline-none focus:border-bh-orange focus:ring-1 focus:ring-bh-orange resize-y"
          placeholder="Anything we should focus on? E.g. site cost concerns, PC sum allowances, a particular builder you're leaning toward."
        />
      </div>

      {/* File upload */}
      <div className="col-span-12">
        <p className="block text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-2">
          Quotes, plans and specifications <span className="text-bh-orange">*</span>
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
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
            <path
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex-1 min-w-0 truncate text-[14px] text-bh-black">
                  {f.name}
                </span>
                <span className="text-[12px] text-bh-graphite tabular-nums">
                  {fmtBytes(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label={`Remove ${f.name}`}
                  className="ml-2 inline-flex items-center justify-center w-7 h-7 rounded-full text-bh-graphite hover:text-bh-orange hover:bg-bh-orange/10"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M3 3l8 8M11 3l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
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

      {/* Error */}
      {error && (
        <div className="col-span-12 rounded-[8px] border border-bh-orange/50 bg-bh-orange/5 px-4 py-3 text-[14px] text-bh-black">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="col-span-12 flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
        <button
          type="submit"
          disabled={status === "submitting" || status === "redirecting"}
          className="inline-flex items-center justify-center h-12 px-6 rounded-[8px] bg-bh-orange text-bh-paper text-[14px] font-medium tracking-[-0.005em] hover:bg-bh-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "submitting"
            ? "Sending..."
            : status === "redirecting"
              ? "Taking you to payment..."
              : "Send for review"}
        </button>
        <p className="text-[12px] text-bh-graphite">
          One flat fee of $499 + GST, paid securely by card. Up to 3 quotes.
        </p>
      </div>
    </form>
  );
}
