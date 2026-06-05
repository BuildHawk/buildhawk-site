"use client";

import { useEffect, useState } from "react";
import {
  CONNECTORS,
  connectorGroups,
  statusLabel,
  type Connector,
} from "@/lib/integrations/connectors";

type TenantSummary = {
  id: string;
  name: string;
  status: string;
};

type GhlSummary = {
  locationId: string;
  hasApiKey: boolean;
  projectDataFieldId: string | null;
};

export default function SettingsClient({
  tenant,
  membership,
  ghl,
}: {
  tenant: TenantSummary;
  membership: { role: string };
  ghl: GhlSummary | null;
}) {
  const isAdmin = membership.role === "owner" || membership.role === "admin";
  return (
    <div className="space-y-8">
      <Section title="Sign-in security">
        <PasswordPanel />
      </Section>

      <Section title="Integrations">
        <IntegrationsCatalog tenantId={tenant.id} ghl={ghl} isAdmin={isAdmin} />
      </Section>

      <Section title="Authorised users">
        <TeamPanel tenantId={tenant.id} isAdmin={isAdmin} />
      </Section>

      {isAdmin && (
        <Section title="Activity log">
          <AuditPanel />
        </Section>
      )}
    </div>
  );
}

function PasswordPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved" }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      setState({ kind: "error", msg: "Password must be at least 8 characters" });
      return;
    }
    if (next !== confirm) {
      setState({ kind: "error", msg: "New password and confirmation don't match" });
      return;
    }
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/command-centre/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current || undefined,
          newPassword: next,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setState({ kind: "saved" });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setState({ kind: "error", msg: data.error ?? `Request failed (${res.status})` });
      }
    } catch (e) {
      setState({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <p className="text-xs text-slate-600">
        Set or change the password used to sign in with email + password. If you&apos;ve never set one, leave the current-password field blank.
      </p>
      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          Current password <span className="font-normal opacity-60">(if you have one)</span>
        </span>
        <input
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
        />
      </label>
      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          New password
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
        />
      </label>
      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          Confirm new password
        </span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === "saving" || !next}
          className="h-10 px-4 inline-flex items-center gap-2 rounded-[8px] bg-bh-orange-500 text-bh-paper text-[13px] font-medium border border-bh-orange-500 hover:bg-bh-orange-700 hover:border-bh-orange-700 active:bg-bh-orange-900 disabled:bg-bh-orange-200 disabled:border-bh-orange-200 disabled:cursor-not-allowed transition-colors"
        >
          {state.kind === "saving" ? "Saving…" : "Save password"}
        </button>
        {state.kind === "saved" && (
          <span className="text-bh-success-500 text-xs font-semibold">
            Password saved · use it on the next sign-in
          </span>
        )}
        {state.kind === "error" && (
          <span className="text-bh-danger-500 text-xs">{state.msg}</span>
        )}
      </div>
    </form>
  );
}

function AuditPanel() {
  const [events, setEvents] = useState<
    Array<{
      id: string;
      action: string;
      target: string | null;
      actorEmail: string | null;
      metadata: Record<string, unknown> | null;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/command-centre/audit", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.ok) setEvents(data.events);
        else setError(data.error ?? `Request failed (${res.status})`);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }
  if (error) {
    return <div className="text-sm text-bh-danger-500">{error}</div>;
  }
  if (events.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        No activity yet. Saves, integration changes and member events will show here.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-200/70 text-sm">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{e.action}</div>
            <div className="text-[11px] text-slate-500 truncate">
              {e.actorEmail ?? "system"}
              {e.target ? ` · ${e.target}` : ""}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
            {new Date(e.createdAt).toLocaleString("en-AU", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white/65 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_10px_40px_-20px_rgba(15,23,42,0.18)] p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-3">
        {title}
      </div>
      {children}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Integrations catalog
 * ─────────────────────────────────────────────────────────────────── */

function IntegrationsCatalog({
  tenantId,
  ghl,
  isAdmin,
}: {
  tenantId: string;
  ghl: GhlSummary | null;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(ghl ? null : "ghl");
  return (
    <div>
      <p className="text-xs text-slate-600 mb-4">
        Hawktress connects to whatever PM, CRM or accounting tool you already run. Bring your own
        data in via the live connectors, or request the one you need.
      </p>

      {connectorGroups.map((group) => {
        const inGroup = CONNECTORS.filter((c) => c.group === group);
        if (inGroup.length === 0) return null;
        return (
          <div key={group} className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-2">
              {group}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {inGroup.map((c) => (
                <ConnectorCard
                  key={c.id}
                  connector={c}
                  isExpanded={expanded === c.id}
                  toggle={() => setExpanded(expanded === c.id ? null : c.id)}
                  isAdmin={isAdmin}
                  ghl={c.id === "ghl" ? ghl : null}
                  tenantId={tenantId}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  live: "bg-bh-success-50 text-bh-success-500 border-bh-success-200",
  beta: "bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200",
  planned: "bg-bh-warning-50 text-bh-warning-500 border-bh-warning-200",
  "on-request": "bg-bh-grey-50 text-bh-graphite border-bh-grey-200",
};

function ConnectorCard({
  connector,
  isExpanded,
  toggle,
  isAdmin,
  ghl,
  tenantId,
}: {
  connector: Connector;
  isExpanded: boolean;
  toggle: () => void;
  isAdmin: boolean;
  ghl: GhlSummary | null;
  tenantId: string;
}) {
  const liveConnected = connector.id === "ghl" && ghl?.hasApiKey;
  return (
    <div className="rounded-xl border border-white/60 bg-white/55 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-white/80 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{connector.name}</span>
            <span
              className={`text-[9px] uppercase tracking-wider font-bold rounded px-1.5 py-0.5 border ${
                STATUS_TONE[connector.status]
              }`}
            >
              {statusLabel[connector.status]}
            </span>
            {liveConnected && (
              <span className="text-[9px] uppercase tracking-wider font-bold rounded px-1.5 py-0.5 border bg-bh-orange-50 text-bh-orange-700 border-bh-orange-200">
                Connected
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">{connector.blurb}</div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-200/60 bg-slate-50/80 px-3.5 py-3 text-xs text-slate-600 space-y-2">
          <p>{connector.flow}</p>
          {connector.setupHint && (
            <p className="text-slate-500">
              <strong className="text-slate-700">Setup:</strong> {connector.setupHint}
            </p>
          )}
          {connector.id === "ghl" && (
            <GhlPanel ghl={ghl} isAdmin={isAdmin} tenantId={tenantId} />
          )}
          {connector.id !== "ghl" && (
            <RequestConnectorPanel connector={connector} isAdmin={isAdmin} />
          )}
        </div>
      )}
    </div>
  );
}

function GhlPanel({
  ghl,
  isAdmin,
  tenantId,
}: {
  ghl: GhlSummary | null;
  isAdmin: boolean;
  tenantId: string;
}) {
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState(ghl?.locationId ?? "");
  const [projectDataFieldId, setProjectDataFieldId] = useState(ghl?.projectDataFieldId ?? "");
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved" }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/command-centre/integrations/ghl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          locationId,
          projectDataFieldId: projectDataFieldId || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({ kind: "saved" });
        setApiKey("");
      } else {
        setState({ kind: "error", msg: data.error ?? "Save failed" });
      }
    } catch (e) {
      setState({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
      {!isAdmin && (
        <div className="sm:col-span-2 rounded-lg bg-bh-warning-50 border border-bh-warning-200 text-bh-warning-500 text-xs p-2">
          You need an owner or admin role to change integrations.
        </div>
      )}
      <label className="sm:col-span-2 block">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Private Integration Token
        </span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={ghl?.hasApiKey ? "•••••• (saved — leave blank to keep)" : "pit-…"}
          disabled={!isAdmin}
          className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Location ID
        </span>
        <input
          type="text"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          placeholder="faIZiavkSvyDcMVx7Dmf"
          disabled={!isAdmin}
          className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          Project-data custom field ID <span className="font-normal opacity-60">(optional)</span>
        </span>
        <input
          type="text"
          value={projectDataFieldId}
          onChange={(e) => setProjectDataFieldId(e.target.value)}
          disabled={!isAdmin}
          className="mt-1 w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
        />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!isAdmin || state.kind === "saving" || (!apiKey && !ghl)}
          className="h-9 px-3 inline-flex items-center rounded-md bg-bh-ink text-white text-xs font-semibold disabled:opacity-60"
        >
          {state.kind === "saving" ? "Saving…" : "Save GHL connection"}
        </button>
        {state.kind === "saved" && (
          <span className="text-bh-success-500 text-xs font-semibold">Saved · encrypted</span>
        )}
        {state.kind === "error" && (
          <span className="text-bh-danger-500 text-xs">{state.msg}</span>
        )}
      </div>
      <input type="hidden" value={tenantId} readOnly />
    </form>
  );
}

function RequestConnectorPanel({
  connector,
  isAdmin,
}: {
  connector: Connector;
  isAdmin: boolean;
}) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "requesting" }
    | { kind: "requested" }
    | { kind: "error"; msg: string }
  >({ kind: "idle" });
  const [note, setNote] = useState("");

  const request = async () => {
    setState({ kind: "requesting" });
    try {
      const res = await fetch("/api/command-centre/integrations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: connector.id, note }),
      });
      const data = await res.json();
      if (data.ok) setState({ kind: "requested" });
      else setState({ kind: "error", msg: data.error ?? "Request failed" });
    } catch (e) {
      setState({ kind: "error", msg: e instanceof Error ? e.message : String(e) });
    }
  };

  if (state.kind === "requested") {
    return (
      <div className="rounded-lg bg-bh-success-50 border border-bh-success-200 text-bh-success-500 text-xs p-2.5">
        Request received. We'll be in touch to scope the {connector.name} connector.
      </div>
    );
  }
  return (
    <div className="space-y-2 pt-1">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Tell us how you use ${connector.name} (account size, must-have data, anything specific). Optional.`}
        rows={2}
        className="w-full bg-white border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bh-orange"
      />
      <button
        onClick={request}
        disabled={!isAdmin || state.kind === "requesting"}
        className="h-8 px-3 inline-flex items-center rounded-md bg-bh-ink text-white text-xs font-semibold disabled:opacity-60"
      >
        {state.kind === "requesting" ? "Sending…" : `Request ${connector.name}`}
      </button>
      {state.kind === "error" && (
        <span className="text-bh-danger-500 text-xs ml-2">{state.msg}</span>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Team panel
 * ─────────────────────────────────────────────────────────────────── */

type Member = { id: string; email: string; name: string | null; role: string; isInvite?: boolean };

function TeamPanel({ tenantId, isAdmin }: { tenantId: string; isAdmin: boolean }) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("director");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!members && !loading) {
    setLoading(true);
    fetch("/api/command-centre/members", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .finally(() => setLoading(false));
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/command-centre/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg(`Invite sent to ${inviteEmail}`);
        setInviteEmail("");
        const r2 = await fetch("/api/command-centre/members", { cache: "no-store" });
        setMembers((await r2.json()).members ?? []);
      } else {
        setMsg(data.error ?? "Invite failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {isAdmin && (
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@yourcompany.com.au"
            className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-bh-orange"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="h-9 px-2 text-sm border border-slate-200 rounded-md"
          >
            <option value="director">Director</option>
            <option value="admin">Admin</option>
            <option value="estimator">Estimator</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="h-9 px-3 inline-flex items-center rounded-md bg-bh-ink text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Sending…" : "Add authorised user"}
          </button>
        </form>
      )}
      {msg && <div className="mb-3 text-xs text-bh-success-500 font-semibold">{msg}</div>}
      <div className="border-t border-slate-200 divide-y divide-slate-200">
        {(members ?? []).map((m) => (
          <div key={m.id} className="py-2 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-semibold">{m.name ?? m.email}</div>
              <div className="text-[11px] text-slate-500">
                {m.email} {m.isInvite ? "· pending invite" : ""}
              </div>
            </div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
              {m.role}
            </div>
          </div>
        ))}
        {!members && <div className="py-3 text-xs text-slate-500">Loading…</div>}
        {members && members.length === 0 && (
          <div className="py-3 text-xs text-slate-500">No members yet.</div>
        )}
      </div>
      <input type="hidden" value={tenantId} readOnly />
    </div>
  );
}
