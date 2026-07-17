"use client";

import { upload } from "@vercel/blob/client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Status = "idle" | "submitting" | "success" | "error";

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

const projectTypes = [
  "New residential build",
  "Knockdown rebuild",
  "Extension / renovation",
  "Multi-residential / townhouses",
  "Owner-builder",
  "Other",
] as const;

const stages = [
  "Pre-tender / planning",
  "Active tender",
  "Mid-build",
  "Pre-construction handover",
  "Just exploring",
] as const;

const valueRanges = [
  "Under $500k",
  "$500k – $1M",
  "$1M – $3M",
  "$3M – $10M",
  "$10M+",
  "Prefer not to say",
] as const;

export default function IntakeForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  const isAustralianPhone = (phone: string) => {
    const cleaned = phone.replace(/\s+/g, "");
  
    return (
      /^(\+61|0)[2378]\d{8}$/.test(cleaned) || // landline
      /^(\+61|0)4\d{8}$/.test(cleaned)         // mobile
    );
  };

  const addFiles = (incoming: FileList | File[]) => {
    setErrorMsg("");
  
    const next = [...files];
  
    for (const file of Array.from(incoming)) {
      const ext = extOf(file.name);
  
      if (!ALLOWED_EXT.has(ext)) {
        setErrorMsg(
          `"${file.name}" is not a supported file type.`,
        );
        continue;
      }
  
      if (file.size > MAX_PER_FILE_BYTES) {
        setErrorMsg(
          `"${file.name}" exceeds the 25 MB limit.`,
        );
        continue;
      }
  
      if (
        next.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size,
        )
      ) {
        continue;
      }
  
      next.push(file);
    }
  
    const size = next.reduce((sum, f) => sum + f.size, 0);
  
    if (size > MAX_TOTAL_BYTES) {
      setErrorMsg(
        "Total upload exceeds 100 MB.",
      );
      return;
    }
  
    setFiles(next);
  };
  
  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };
  
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    setDragOver(false);
  
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
  
    const form = e.currentTarget;
    const data = new FormData(form);
  
    const payload = {
      audience: data.get("audience"),
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      company: data.get("company"),
      role: data.get("role"),
      projectType: data.get("projectType"),
      stage: data.get("stage"),
      valueRange: data.get("valueRange"),
      message: data.get("message"),
    };
  
    const phone = String(payload.phone || "").trim();
    if (phone && !isAustralianPhone(phone)) {
      setPhoneError("Please enter a valid Australian phone number.");
      setStatus("idle");
      return;
    }
  
    setPhoneError("");
  
    try {
      const documents: {
        name: string;
        url: string;
        size: number;
      }[] = [];
  
      for (const file of files) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
        });
  
        documents.push({
          name: file.name,
          url: blob.url,
          size: file.size,
        });
      }
  
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
          documents,
        }),
      });
  
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Submission failed (${res.status})`);
      }
  
      setStatus("success");
      form.reset();
      setFiles([]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  return (
    <section
      id="intake"
      className="relative bg-bh-white py-16 md:py-36 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1480px] px-6 md:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="col-span-12 md:col-span-3">
            <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite">
              Intake
            </p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[36px] md:text-[56px] lg:text-[72px] text-bh-black">
              Start your brief.
              <br />
              <span className="text-bh-graphite">
                We reply within one business day.
              </span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 md:gap-10">
          {/* Side context */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="relative aspect-[4/5] mb-6 overflow-hidden bg-bh-cloud hidden md:block">
              <Image
                src="/images/site-aerial.webp"
                alt="Construction crew on a slab review"
                fill
                sizes="(min-width: 768px) 28vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="space-y-5 text-[14px] tracking-[-0.005em] text-bh-graphite">
              <p>
                Tell us about the project. We come back with a scope, a fixed
                fee and a timeline. No proposal theatre.
              </p>
              <div className="pt-5 border-t border-bh-steel/60">
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite mb-2">
                  Direct line
                </p>
                <a
                  href="tel:+61433366607"
                  className="block text-bh-black hover:text-bh-orange transition-colors text-[16px]"
                >
                  +61 433 366 607
                </a>
                <a
                  href="mailto:info@buildhawk.com.au"
                  className="block text-bh-black hover:text-bh-orange transition-colors text-[16px] mt-1"
                >
                  info@buildhawk.com.au
                </a>
              </div>
              <div className="pt-5 border-t border-bh-steel/60">
                <p className="text-[11px] tracking-[0.2em] uppercase text-bh-graphite mb-2">
                  Office
                </p>
                <p className="text-bh-black text-[16px]">
                  Geelong, VIC · Australia
                </p>
              </div>
            </div>
          </aside>

          {/* Form */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            {status === "success" ? (
              <SuccessState onReset={() => setStatus("idle")} />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-bh-steel/60 border border-bh-steel/60"
                noValidate
              >
                <AudienceSelector />
                <Field
                  name="name"
                  label="Your name"
                  required
                  autoComplete="name"
                />
                <Field
                  name="email"
                  type="email"
                  label="Email"
                  required
                  autoComplete="email"
                />
                <div>
                  <Field
                    name="phone"
                    type="tel"
                    label="Phone"
                    autoComplete="tel"
                  />
                
                  {phoneError && (
                    <p className="px-6 pb-4 text-sm text-red-600">
                      {phoneError}
                    </p>
                  )}
                </div>
                <Field
                  name="company"
                  label="Company"
                  autoComplete="organization"
                />
                <Field
                  name="role"
                  label="Your role"
                  placeholder="e.g. Builder, Developer, Owner"
                  className="sm:col-span-2"
                />

                <Select
                  name="projectType"
                  label="Project type"
                  options={projectTypes as unknown as string[]}
                  required
                />
                <Select
                  name="stage"
                  label="Project stage"
                  options={stages as unknown as string[]}
                  required
                />
                <Select
                  name="valueRange"
                  label="Estimated project value"
                  options={valueRanges as unknown as string[]}
                  className="sm:col-span-2"
                />

                <Textarea
                  name="message"
                  label="Project notes"
                  placeholder="Site address, current docs, what you need from us"
                  className="sm:col-span-2"
                />

                <div className="sm:col-span-2 bg-bh-white p-5 md:p-6">
                  <label className={labelClasses()}>
                    Project Documents
                  </label>
                
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-3 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition ${
                      dragOver
                        ? "border-bh-orange bg-bh-orange/5"
                        : "border-bh-steel/60 hover:border-bh-orange"
                    }`}
                  >
                    <p className="text-[15px]">
                      Click to upload or drag and drop
                    </p>
                
                    <p className="mt-2 text-[12px] text-bh-graphite">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG
                      <br />
                      Maximum 25 MB per file, 100 MB total.
                    </p>
                
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ACCEPT_ATTR}
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </div>
                
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded border border-bh-steel/60 px-3 py-2"
                        >
                          <span className="truncate text-sm">
                            {file.name}
                          </span>
                
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                
                      <p className="text-xs text-bh-graphite">
                        {files.length} file(s) • {fmtBytes(totalBytes)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 bg-bh-white p-6 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-[12px] text-bh-graphite tracking-[-0.005em] max-w-md">
                    By submitting you agree we can contact you about your
                    project. We never share or sell details.
                  </p>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="group inline-flex items-center justify-between gap-4 rounded-[8px] pl-6 pr-2 h-12 text-[14px] tracking-[-0.005em] bg-bh-orange text-bh-paper hover:bg-bh-orange-700 active:bg-bh-orange-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="font-medium">
                      {status === "submitting" ? "Sending..." : "Send Brief"}
                    </span>
                    <span className="inline-flex items-center justify-center rounded-full w-9 h-9 bg-bh-paper/20 group-hover:bg-bh-paper/30 transition-colors">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="stroke-bh-paper"
                        aria-hidden
                      >
                        <path
                          d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>

                {status === "error" && (
                  <div className="sm:col-span-2 bg-bh-white border-t-2 border-red-500 p-5 text-[14px] text-red-700">
                    {errorMsg}. You can also{" "}
                    <a
                      href="mailto:info@buildhawk.com.au?subject=Project%20brief"
                      className="underline"
                    >
                      email us directly
                    </a>
                    .
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function fieldShellClasses(extra = "") {
  return `bg-bh-white p-5 md:p-6 flex flex-col gap-2 ${extra}`;
}

const audienceOptions = [
  { id: "builder", label: "Builder", note: "Estimating · CA · margin tracking" },
  { id: "trade", label: "Trade", note: "Category benchmarks AU + NZ" },
  { id: "supplier", label: "Supplier", note: "Platform listing + recommendations" },
  { id: "other", label: "General", note: "Consulting or another enquiry" },
  { id: "homeowner", label: "Homeowner", note: "Project support or builder matching" },
  { id: "owner-builder", label: "Owner Builder", note: "Owner-builder project support" },
] as const;

function AudienceSelector() {
  const [selected, setSelected] = useState<string>("builder");
  return (
    <div className="bg-bh-white p-5 md:p-6 sm:col-span-2">
      <p className="text-[11px] tracking-[0.18em] uppercase text-bh-graphite mb-3">
        I am a <span className="text-bh-orange">*</span>
      </p>
      <input type="hidden" name="audience" value={selected} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {audienceOptions.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              className={`text-left p-3.5 rounded-[6px] border transition-colors ${
                active
                  ? "border-bh-orange bg-bh-orange-50"
                  : "border-bh-steel/60 hover:border-bh-graphite bg-bh-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full border ${
                    active
                      ? "border-bh-orange bg-bh-orange"
                      : "border-bh-steel"
                  }`}
                >
                  {active && (
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-[14px] font-medium tracking-[-0.005em] ${
                    active ? "text-bh-black" : "text-bh-black"
                  }`}
                >
                  {o.label}
                </span>
              </span>
              <span className="block mt-1 ml-6 text-[12px] text-bh-graphite leading-[1.35]">
                {o.note}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function labelClasses() {
  return "text-[11px] tracking-[0.18em] uppercase text-bh-graphite";
}

function inputClasses() {
  return "w-full bg-transparent border-0 border-b border-bh-steel/60 focus:border-bh-orange focus:ring-0 outline-none py-2 text-[16px] text-bh-black placeholder:text-bh-steel tracking-[-0.005em]";
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  autoComplete,
  className = "",
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={fieldShellClasses(className)}>
      <label htmlFor={name} className={labelClasses()}>
        {label}
        {required && <span className="text-bh-orange ml-1">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={
          type === "tel"
            ? "+61 433 366 607"
            : placeholder
        }
        autoComplete={autoComplete}
        inputMode={type === "tel" ? "tel" : undefined}
        className={inputClasses()}
      />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  required,
  className = "",
}: {
  name: string;
  label: string;
  options: string[];
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className={fieldShellClasses(className)}>
      <label className={labelClasses()}>
        {label}
        {required && <span className="text-bh-orange ml-1">*</span>}
      </label>
      <input type="hidden" name={name} value={selected} required={required} />
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between border-b border-bh-steel/60 py-2 text-[16px] tracking-[-0.005em] text-left focus:outline-none focus:border-bh-orange transition-colors"
        >
          <span className={selected ? "text-bh-black" : "text-bh-steel"}>
            {selected || "Select…"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className={`flex-none transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M3 5l4 4 4-4"
              stroke="#6e7180"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-bh-ink border border-bh-steel/30 shadow-lg overflow-hidden">
            {options.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => { setSelected(o); setOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[15px] tracking-[-0.005em] hover:bg-bh-orange hover:text-white transition-colors ${
                    selected === o ? "bg-bh-orange/20 text-bh-orange font-medium" : "text-bh-paper"
                  }`}
                >
                  {o}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Textarea({
  name,
  label,
  placeholder,
  className = "",
}: {
  name: string;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={fieldShellClasses(className)}>
      <label htmlFor={name} className={labelClasses()}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={5}
        placeholder={placeholder}
        className="w-full bg-transparent border-0 border-b border-bh-steel/60 focus:border-bh-orange focus:ring-0 outline-none py-2 text-[16px] text-bh-black placeholder:text-bh-steel tracking-[-0.005em] resize-y"
      />
    </div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="border border-bh-orange/40 bg-bh-orange-50 p-8 md:p-12 flex flex-col items-start gap-5">
      <div className="inline-flex w-12 h-12 rounded-full bg-bh-orange/15 items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="#de5123"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <h3 className="text-[28px] md:text-[36px] font-medium tracking-[-0.02em] leading-[1.1] text-bh-black">
          Brief received.
        </h3>
        <p className="mt-3 text-bh-graphite text-[17px] leading-[1.5] max-w-xl">
          We will reply within one business day from{" "}
          <span className="text-bh-black">info@buildhawk.com.au</span>. If your
          project is urgent, call{" "}
          <a
            href="tel:+61433366607"
            className="text-bh-orange hover:underline"
          >
            +61 433 366 607
          </a>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="text-[13px] tracking-[-0.005em] text-bh-graphite hover:text-bh-black underline underline-offset-4"
      >
        Submit another brief
      </button>
    </div>
  );
}
