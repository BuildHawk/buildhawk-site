"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import GlassBackground from "../_components/GlassBackground";
import BrandButton from "@/components/brand/BrandButton";

type SignInState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

type RequestState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

type Tab = "signin" | "request";

export default function LoginForm({
  next,
  error,
  configured,
  invitationOnly = false,
}: {
  next?: string;
  error?: string;
  configured: boolean;
  invitationOnly?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(invitationOnly ? "request" : "signin");

  /* Sign-in state */
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInMode, setSignInMode] = useState<"password" | "magic">("password");
  const [signInState, setSignInState] = useState<SignInState>({ status: "idle" });

  /* Request-access state */
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqCompany, setReqCompany] = useState("");
  const [reqRole, setReqRole] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [reqState, setReqState] = useState<RequestState>({ status: "idle" });

  const submitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInState({ status: "submitting" });
    try {
      if (signInMode === "password") {
        const res = await fetch("/api/command-centre/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: signInEmail, password: signInPassword }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          window.location.href = next && next.startsWith("/") ? next : "/command-centre";
          return;
        }
        setSignInState({
          status: "error",
          message: data.error ?? `Request failed (${res.status})`,
        });
        return;
      }
      // Magic link fallback
      const res = await fetch("/api/command-centre/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, redirect: next }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSignInState({ status: "sent", email: signInEmail });
      } else {
        setSignInState({
          status: "error",
          message: data.error ?? `Request failed (${res.status})`,
        });
      }
    } catch (err) {
      setSignInState({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqState({ status: "submitting" });
    try {
      const res = await fetch("/api/command-centre/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reqName,
          email: reqEmail,
          company: reqCompany,
          role: reqRole || undefined,
          notes: reqNotes || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setReqState({ status: "sent", email: reqEmail });
      } else {
        setReqState({
          status: "error",
          message: data.error ?? `Request failed (${res.status})`,
        });
      }
    } catch (err) {
      setReqState({
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-10 text-slate-900">
      <GlassBackground tone="light" />
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-2.5 justify-center mb-8"
          aria-label="BuildHawk home"
        >
          <Image
            src="/brand/emblem-bh-dark.svg"
            alt="BuildHawk"
            width={42}
            height={32}
            priority
            className="block"
          />
          <div className="leading-tight">
            <div
              className="text-bh-black font-semibold uppercase"
              style={{ fontSize: 15, letterSpacing: "0.04em" }}
            >
              BUILDHAWK
            </div>
            <div
              className="text-bh-graphite mt-0.5 uppercase"
              style={{ fontSize: 10, letterSpacing: "0.16em" }}
            >
              Powered by Hawktress<sup style={{ fontSize: "0.7em", marginLeft: "0.1em" }}>™</sup>
            </div>
          </div>
        </Link>

        <div
          className="relative rounded-3xl border border-white/40 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)] overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)",
            backdropFilter: "blur(28px) saturate(140%)",
            WebkitBackdropFilter: "blur(28px) saturate(140%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
            }}
          />

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label="Sign in or request access"
            className="grid grid-cols-2 border-b border-slate-200/70 bg-slate-50/40"
          >
            <button
              role="tab"
              aria-selected={tab === "signin"}
              type="button"
              onClick={() => setTab("signin")}
              className={`py-3.5 text-[12px] font-bold tracking-[0.04em] uppercase transition ${
                tab === "signin"
                  ? "bg-white/80 text-bh-orange-700 border-b-2 border-bh-orange"
                  : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
              }`}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={tab === "request"}
              type="button"
              onClick={() => setTab("request")}
              className={`py-3.5 text-[12px] font-bold tracking-[0.04em] uppercase transition ${
                tab === "request"
                  ? "bg-white/80 text-bh-orange-700 border-b-2 border-bh-orange"
                  : "text-slate-500 hover:text-slate-700 border-b-2 border-transparent"
              }`}
            >
              Request access
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {invitationOnly && (
              <div className="mb-5 rounded-2xl border border-bh-orange-200/60 bg-bh-orange-50/70 backdrop-blur p-3 text-xs text-bh-orange-700">
                <strong className="block font-bold mb-0.5">By invitation only.</strong>
                BuildHawk works with a small number of builders at a time. Submit the form below and the team will reply within one business day.
              </div>
            )}
            {tab === "signin" ? (
              <SignInPanel
                email={signInEmail}
                setEmail={setSignInEmail}
                password={signInPassword}
                setPassword={setSignInPassword}
                mode={signInMode}
                setMode={(m) => {
                  setSignInMode(m);
                  setSignInState({ status: "idle" });
                }}
                state={signInState}
                setState={setSignInState}
                onSubmit={submitSignIn}
                error={error}
                configured={configured}
              />
            ) : (
              <RequestPanel
                name={reqName}
                setName={setReqName}
                email={reqEmail}
                setEmail={setReqEmail}
                company={reqCompany}
                setCompany={setReqCompany}
                role={reqRole}
                setRole={setReqRole}
                notes={reqNotes}
                setNotes={setReqNotes}
                state={reqState}
                setState={setReqState}
                onSubmit={submitRequest}
              />
            )}

            <div className="mt-6 pt-5 border-t border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
              {tab === "signin" ? (
                <>
                  New to BuildHawk?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("request")}
                    className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  >
                    Request access
                  </button>{" "}
                  to be set up on an engagement. By signing in you agree to our{" "}
                  <Link
                    href="/data-policy"
                    className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  >
                    data policy
                  </Link>
                  .
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
                  >
                    Sign in
                  </button>
                  . Access is by invitation only.
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-500">
          Powered by Hawktress™ · Magic-link auth via Resend
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Sign-in panel
 * ─────────────────────────────────────────────────────────────────── */

function SignInPanel({
  email,
  setEmail,
  password,
  setPassword,
  mode,
  setMode,
  state,
  setState,
  onSubmit,
  error,
  configured,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  mode: "password" | "magic";
  setMode: (m: "password" | "magic") => void;
  state: SignInState;
  setState: (s: SignInState) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  error?: string;
  configured: boolean;
}) {
  const intro =
    mode === "password"
      ? "Enter your email and password. Forgot it? Use the email-link option below."
      : "We send a one-time link to your email. No passwords. No two-factor codes.";
  return (
    <div role="tabpanel">
      <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
        Existing user
      </div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
        Sign in to your Cost Plan Console
      </h1>
      <p className="mt-2 text-sm text-slate-600">{intro}</p>

      {!configured && (
        <div className="mt-5 rounded-xl border border-bh-orange-200 bg-bh-orange-50 p-3 text-xs text-bh-orange-700">
          <strong className="block font-bold mb-0.5">Auth not configured.</strong>
          Set <code className="font-mono bg-white/70 px-1 rounded">BH_AUTH_SECRET</code>,{" "}
          <code className="font-mono bg-white/70 px-1 rounded">DATABASE_URL</code>,{" "}
          <code className="font-mono bg-white/70 px-1 rounded">BH_ENCRYPTION_KEY</code>{" "}
          and <code className="font-mono bg-white/70 px-1 rounded">RESEND_API_KEY</code> in
          Vercel env.
        </div>
      )}

      {error === "expired" && state.status === "idle" && (
        <div className="mt-5 rounded-xl border border-bh-danger-200 bg-bh-danger-50 p-3 text-xs text-bh-danger-500">
          That sign-in link has expired or is invalid. Request a new one.
        </div>
      )}

      {state.status === "sent" ? (
        <div className="mt-6 rounded-xl border border-bh-success-200 bg-bh-success-50 p-4">
          <div className="font-bold text-bh-success-500 text-sm">Check your inbox.</div>
          <p className="mt-1 text-sm text-slate-700">
            We sent a sign-in link to{" "}
            <strong className="font-semibold">{state.email}</strong>. The link expires in 30
            minutes.
          </p>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="mt-3 text-xs font-semibold text-bh-success-500 underline underline-offset-2"
          >
            Try a different email
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Email
            </span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcompany.com.au"
              autoComplete="email"
              className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm"
            />
          </label>
          {mode === "password" && (
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm"
              />
            </label>
          )}
          <BrandButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={state.status === "submitting"}
            trailingIcon={state.status !== "submitting"}
            disabled={state.status === "submitting"}
          >
            {state.status === "submitting"
              ? mode === "password"
                ? "Signing in…"
                : "Sending link…"
              : mode === "password"
                ? "Sign in"
                : "Send me a sign-in link"}
          </BrandButton>
          {state.status === "error" && (
            <div className="rounded-xl border border-bh-danger-200 bg-bh-danger-50 p-3 text-xs text-bh-danger-500">
              {state.message}
            </div>
          )}
          <div className="flex justify-center pt-1">
            {mode === "password" ? (
              <button
                type="button"
                onClick={() => setMode("magic")}
                className="text-[11px] font-semibold text-slate-600 hover:text-bh-orange-700 underline underline-offset-2"
              >
                Forgot password? Email me a one-time sign-in link instead
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("password")}
                className="text-[11px] font-semibold text-slate-600 hover:text-bh-orange-700 underline underline-offset-2"
              >
                Use email + password instead
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Request-access panel
 * ─────────────────────────────────────────────────────────────────── */

function RequestPanel({
  name,
  setName,
  email,
  setEmail,
  company,
  setCompany,
  role,
  setRole,
  notes,
  setNotes,
  state,
  setState,
  onSubmit,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  state: RequestState;
  setState: (s: RequestState) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}) {
  return (
    <div role="tabpanel">
      <div className="text-[11px] uppercase tracking-[0.18em] text-bh-orange-700 font-bold">
        New here
      </div>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
        Apply for an engagement
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Tell us a bit about your business. If we&apos;re a fit we&apos;ll set up your engagement, connect your PM tool, and walk you through the first cost plan. Reply within one business day.
      </p>

      {state.status === "sent" ? (
        <div className="mt-6 rounded-xl border border-bh-success-200 bg-bh-success-50 p-4">
          <div className="font-bold text-bh-success-500 text-sm">Application received.</div>
          <p className="mt-1 text-sm text-bh-success-500">
            Thanks. The BuildHawk team will reply to{" "}
            <strong className="font-semibold">{state.email}</strong> within one business day. If we&apos;re a fit we&apos;ll send a sign-in link.
          </p>
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="mt-3 text-xs font-semibold text-bh-success-500 underline underline-offset-2 hover:text-bh-success-500"
          >
            Submit another request
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Your name
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Director / owner"
              className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Work email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcompany.com.au"
              className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Company
            </span>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Homes by NH"
              className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Role <span className="font-normal opacity-60">(optional)</span>
            </span>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Director, Estimator, etc."
              className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Anything we should know <span className="font-normal opacity-60">(optional)</span>
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What PM tool do you use? How many estimates a year? Any pain points we can help with?"
              className="mt-1 w-full bg-white/70 backdrop-blur border border-white/60 rounded-xl text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-bh-orange focus:border-bh-orange placeholder:text-slate-400 shadow-sm resize-y"
            />
          </label>
          <BrandButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={state.status === "submitting"}
            trailingIcon={state.status !== "submitting"}
            disabled={state.status === "submitting"}
          >
            {state.status === "submitting" ? "Sending request…" : "Request access"}
          </BrandButton>
          {state.status === "error" && (
            <div className="rounded-xl border border-bh-danger-200 bg-bh-danger-50 p-3 text-xs text-bh-danger-500">
              {state.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
