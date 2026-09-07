"use client";

import { useEffect, useState } from "react";
import { STATIONS, STATION_LABELS } from "@/lib/visitor";
import { getDrawSlot } from "@/lib/vegasFixSchedule";

const SESSION_KEY = "holdgold_admin_password";

type SlotStats = {
  key: string;
  label: string;
  date: string;
  totalVisitors: number;
  perStation: Record<string, number>;
  fullyCollected: number;
};

type Winner = {
  id: string;
  name: string;
  surname: string;
  email: string;
  tokenCount: number;
};

type Draw = {
  id: string;
  drawLabel: string;
  drawnAt: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submittingLogin, setSubmittingLogin] = useState(false);

  const [slots, setSlots] = useState<SlotStats[] | null>(null);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [drawLabel, setDrawLabel] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [lastDraw, setLastDraw] = useState<{ draw: Draw; winner: Winner } | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function fetchStats(pw: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatsError(data.error ?? "Something went wrong.");
        return false;
      }
      const nextSlots: SlotStats[] = data.slots;
      setSlots(nextSlots);
      setStatsError(null);

      setActiveSlotKey((prevKey) => {
        if (prevKey && nextSlots.some((s) => s.key === prevKey)) return prevKey;
        const currentKey = getDrawSlot(new Date()).key;
        const currentMatch = nextSlots.find((s) => s.key === currentKey);
        return currentMatch?.key ?? nextSlots[nextSlots.length - 1]?.key ?? null;
      });

      return true;
    } catch {
      setStatsError("Something went wrong. Please try again.");
      return false;
    }
  }

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      setChecking(false);
      return;
    }
    fetchStats(stored).then((ok) => {
      if (ok) {
        setPassword(stored);
        setAuthed(true);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
      setChecking(false);
    });
  }, []);

  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      fetchStats(password);
    }, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const activeSlot = slots?.find((s) => s.key === activeSlotKey) ?? null;

  useEffect(() => {
    if (activeSlot) setDrawLabel(`${activeSlot.label} Vegas Gold Call`);
  }, [activeSlot?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingLogin(true);
    setLoginError(null);
    const ok = await fetchStats(password);
    if (ok) {
      window.sessionStorage.setItem(SESSION_KEY, password);
      setAuthed(true);
    } else {
      setLoginError("Incorrect password.");
    }
    setSubmittingLogin(false);
  }

  async function handleRunRaffle() {
    if (!activeSlot) return;
    setDrawing(true);
    setDrawError(null);
    try {
      const res = await fetch("/api/admin/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, drawLabel, slotKey: activeSlot.key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDrawError(data.error ?? "Something went wrong.");
        return;
      }
      setLastDraw(data);
    } catch {
      setDrawError("Something went wrong. Please try again.");
    } finally {
      setDrawing(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/admin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setExportError(data?.error ?? "Something went wrong.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hold-gold-visitors-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Something went wrong. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <p className="text-slate-400">Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-md">
          <h1 className="text-xl font-bold text-slate-100">Staff Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Enter the shared staff password.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
              placeholder="Password"
              autoFocus
            />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button
              type="submit"
              disabled={submittingLogin}
              className="w-full rounded-full bg-amber-400 py-3 font-bold tracking-wide text-slate-900 shadow-[0_4px_14px_rgba(251,191,36,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(251,191,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submittingLogin ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-slate-100">Hold Gold - Staff Dashboard</h1>

        {statsError && <p className="text-sm text-red-400">{statsError}</p>}

        {slots && slots.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-md">
            <p className="text-slate-400">No visitors registered yet.</p>
          </div>
        )}

        {slots && slots.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.key}
                  onClick={() => setActiveSlotKey(slot.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    slot.key === activeSlotKey
                      ? "bg-amber-400 text-slate-900"
                      : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {activeSlot && (
              <>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-md">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Live counts - {activeSlot.label}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Only visitors whose first chip fell in this draw window are counted here.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-400">
                        {activeSlot.totalVisitors}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Total registered</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-400">
                        {activeSlot.fullyCollected}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">All tokens collected</p>
                    </div>
                    {STATIONS.map((station) => (
                      <div
                        key={station}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center"
                      >
                        <p className="text-3xl font-bold text-slate-100">
                          {activeSlot.perStation[station] ?? 0}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{STATION_LABELS[station]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-md">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Run raffle - {activeSlot.label}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Draws only from visitors in this slot, weighted by tokens held (a visitor
                    with more tokens is proportionally more likely to be drawn).
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={drawLabel}
                      onChange={(e) => setDrawLabel(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
                      placeholder="Draw label"
                    />
                    <button
                      onClick={handleRunRaffle}
                      disabled={drawing}
                      className="whitespace-nowrap rounded-full bg-amber-400 px-6 py-2.5 font-bold tracking-wide text-slate-900 shadow-[0_4px_14px_rgba(251,191,36,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(251,191,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {drawing ? "Drawing…" : "Run Raffle"}
                    </button>
                  </div>
                  {drawError && <p className="mt-3 text-sm text-red-400">{drawError}</p>}
                  {lastDraw && (
                    <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {lastDraw.draw.drawLabel}
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-100">
                        {lastDraw.winner.name} {lastDraw.winner.surname}
                      </p>
                      <p className="text-sm text-slate-300">{lastDraw.winner.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {lastDraw.winner.tokenCount} token{lastDraw.winner.tokenCount === 1 ? "" : "s"}{" "}
                        held
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-md">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Export data
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Download all visitor data as CSV (across every draw slot) for post-show contact and
            reconciliation.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 rounded-full border border-slate-700 px-6 py-2.5 font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          {exportError && <p className="mt-3 text-sm text-red-400">{exportError}</p>}
        </div>
      </div>
    </main>
  );
}
