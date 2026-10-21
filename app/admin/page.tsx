"use client";

import { useEffect, useState } from "react";
import { STATIONS, STATION_LABELS } from "@/lib/visitor";
import { getDrawSlot } from "@/lib/vegasFixSchedule";
import Logo from "@/components/Logo";

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

type TestEntry = {
  id: string;
  name: string;
  surname: string;
  email: string;
  personalCode: string;
  tokenCount: number;
};

type DrawHistoryEntry = {
  id: string;
  drawLabel: string;
  drawnAt: string;
  winner: { name: string; surname: string; email: string; personalCode: string };
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
  const [drawPool, setDrawPool] = useState<"cumulative" | "window">("cumulative");
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [lastDraw, setLastDraw] = useState<{ draw: Draw; winner: Winner } | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [loungeSeconds, setLoungeSeconds] = useState("300");
  const [loungeBusy, setLoungeBusy] = useState<"start" | "redraw" | "reset" | null>(null);
  const [loungeError, setLoungeError] = useState<string | null>(null);
  const [loungeMessage, setLoungeMessage] = useState<string | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoBusy, setLogoBusy] = useState<"upload" | "remove" | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoMessage, setLogoMessage] = useState<string | null>(null);
  const [logoPreviewKey, setLogoPreviewKey] = useState(0);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);

  const [clearConfirmText, setClearConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  const [testEntries, setTestEntries] = useState<TestEntry[] | null>(null);
  const [findingTestEntries, setFindingTestEntries] = useState(false);
  const [testEntriesError, setTestEntriesError] = useState<string | null>(null);
  const [deletingVisitorId, setDeletingVisitorId] = useState<string | null>(null);

  const [drawHistory, setDrawHistory] = useState<DrawHistoryEntry[] | null>(null);
  const [loadingDrawHistory, setLoadingDrawHistory] = useState(false);
  const [drawHistoryError, setDrawHistoryError] = useState<string | null>(null);

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
    if (activeSlot) setDrawLabel(`${activeSlot.label} Las Vegas Gold Call`);
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
        body: JSON.stringify({ password, drawLabel, slotKey: activeSlot.key, pool: drawPool }),
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

  async function startLoungeCountdown(durationSeconds: number, busyKind: "start" | "redraw") {
    if (!activeSlot || !slots) return;
    const ordinal = slots.findIndex((s) => s.key === activeSlot.key) + 1;
    setLoungeBusy(busyKind);
    setLoungeError(null);
    setLoungeMessage(null);
    try {
      const res = await fetch("/api/display/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          slotKey: activeSlot.key,
          slotLabel: activeSlot.label,
          drawLabel,
          durationSeconds,
          ordinal,
          pool: drawPool,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoungeError(data.error ?? "Something went wrong.");
        return;
      }
      setLoungeMessage(
        busyKind === "redraw"
          ? "Redraw sent - the lounge screen will reveal a new winner shortly."
          : "Countdown sent to the lounge screen."
      );
    } catch {
      setLoungeError("Something went wrong. Please try again.");
    } finally {
      setLoungeBusy(null);
    }
  }

  async function handleResetLoungeScreen() {
    setLoungeBusy("reset");
    setLoungeError(null);
    setLoungeMessage(null);
    try {
      const res = await fetch("/api/display/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoungeError(data.error ?? "Something went wrong.");
        return;
      }
      setLoungeMessage("Lounge screen reset to idle.");
    } catch {
      setLoungeError("Something went wrong. Please try again.");
    } finally {
      setLoungeBusy(null);
    }
  }

  async function handleUploadLogo() {
    if (!logoFile) return;
    if (
      hasCustomLogo &&
      !window.confirm("A custom logo is already set. Replace it with this new file?")
    ) {
      return;
    }
    setLogoBusy("upload");
    setLogoError(null);
    setLogoMessage(null);
    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("file", logoFile);
      const res = await fetch("/api/admin/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setLogoError(data.error ?? "Something went wrong.");
        return;
      }
      setLogoMessage("Logo updated - it'll appear on the lounge display right away.");
      setLogoFile(null);
      setLogoPreviewKey((k) => k + 1);
    } catch {
      setLogoError("Something went wrong. Please try again.");
    } finally {
      setLogoBusy(null);
    }
  }

  async function handleRemoveLogo() {
    if (!window.confirm("Remove the custom logo and revert to the default mark?")) {
      return;
    }
    setLogoBusy("remove");
    setLogoError(null);
    setLogoMessage(null);
    try {
      const res = await fetch("/api/admin/logo", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLogoError(data.error ?? "Something went wrong.");
        return;
      }
      setLogoMessage("Custom logo removed - back to the default mark.");
      setLogoPreviewKey((k) => k + 1);
    } catch {
      setLogoError("Something went wrong. Please try again.");
    } finally {
      setLogoBusy(null);
    }
  }

  async function handleClearAllUsers() {
    if (clearConfirmText !== "CLEAR") return;
    setClearing(true);
    setClearError(null);
    setClearMessage(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClearError(data.error ?? "Something went wrong.");
        return;
      }
      setClearMessage(
        `Cleared ${data.deleted.visitors} visitor(s), ${data.deleted.tokens} chip(s), and ${data.deleted.raffleDraws} raffle draw(s).`
      );
      setClearConfirmText("");
      setLastDraw(null);
      fetchStats(password);
    } catch {
      setClearError("Something went wrong. Please try again.");
    } finally {
      setClearing(false);
    }
  }

  async function handleFindTestEntries() {
    setFindingTestEntries(true);
    setTestEntriesError(null);
    try {
      const res = await fetch("/api/admin/find-test-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestEntriesError(data.error ?? "Something went wrong.");
        return;
      }
      setTestEntries(data.matches);
    } catch {
      setTestEntriesError("Something went wrong. Please try again.");
    } finally {
      setFindingTestEntries(false);
    }
  }

  async function handleDeleteVisitor(entry: TestEntry) {
    if (!window.confirm(`Delete ${entry.name} ${entry.surname} (${entry.email})? This cannot be undone.`)) {
      return;
    }
    setDeletingVisitorId(entry.id);
    setTestEntriesError(null);
    try {
      const res = await fetch("/api/admin/visitor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, visitorId: entry.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestEntriesError(data.error ?? "Something went wrong.");
        return;
      }
      setTestEntries((prev) => prev?.filter((e) => e.id !== entry.id) ?? null);
      fetchStats(password);
    } catch {
      setTestEntriesError("Something went wrong. Please try again.");
    } finally {
      setDeletingVisitorId(null);
    }
  }

  async function handleLoadDrawHistory() {
    setLoadingDrawHistory(true);
    setDrawHistoryError(null);
    try {
      const res = await fetch("/api/admin/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDrawHistoryError(data.error ?? "Something went wrong.");
        return;
      }
      setDrawHistory(data.draws);
    } catch {
      setDrawHistoryError("Something went wrong. Please try again.");
    } finally {
      setLoadingDrawHistory(false);
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
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-4">
        <p className="text-gray-500">Loading…</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-4">
        <div className="w-full max-w-sm rounded-3xl border border-[#3c1e4b]/15 bg-white p-8 shadow-[0_20px_60px_-15px_rgba(112,66,135,0.25)]">
          <Logo className="mx-auto mb-6 h-9" />
          <h1 className="text-xl font-bold text-gray-900">Staff Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Enter the shared staff password.</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#D8AB4C] focus:outline-none"
              placeholder="Password"
              autoFocus
            />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              type="submit"
              disabled={submittingLogin}
              className="w-full rounded-full bg-[#D8AB4C] py-3 font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(216,171,76,0.35)] transition hover:-translate-y-0.5 hover:bg-[#BE9643] hover:shadow-[0_6px_20px_rgba(216,171,76,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(216,171,76,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submittingLogin ? "Checking…" : "Enter"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Logo className="h-8" />
          <h1 className="text-2xl font-bold text-gray-900">Hold Gold - Staff Dashboard</h1>
        </div>

        {statsError && <p className="text-sm text-red-600">{statsError}</p>}

        {slots && slots.length === 0 && (
          <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 text-center shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
            <p className="text-gray-500">No visitors registered yet.</p>
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
                      ? "bg-[#D8AB4C] text-white"
                      : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>

            {activeSlot && (
              <>
                <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
                    Live counts - {activeSlot.label}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Only visitors whose first chip fell in this draw window are counted here.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-[#EADFC0] bg-[#FBF3E1] p-4 text-center">
                      <p className="text-3xl font-bold text-[#D8AB4C]">
                        {activeSlot.totalVisitors}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">Total registered</p>
                    </div>
                    <div className="rounded-xl border border-[#EADFC0] bg-[#FBF3E1] p-4 text-center">
                      <p className="text-3xl font-bold text-[#D8AB4C]">
                        {activeSlot.fullyCollected}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">All chips collected</p>
                    </div>
                    {STATIONS.map((station) => (
                      <div
                        key={station}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center"
                      >
                        <p className="text-3xl font-bold text-gray-900">
                          {activeSlot.perStation[station] ?? 0}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">{STATION_LABELS[station]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
                    Run raffle - {activeSlot.label}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Weighted by chips held (a visitor with more chips is proportionally more
                    likely to be drawn). Draws from whichever pool is selected below.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={drawLabel}
                      onChange={(e) => setDrawLabel(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#D8AB4C] focus:outline-none"
                      placeholder="Draw label"
                    />
                    <button
                      onClick={handleRunRaffle}
                      disabled={drawing}
                      className="whitespace-nowrap rounded-full bg-[#D8AB4C] px-6 py-2.5 font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(216,171,76,0.35)] transition hover:-translate-y-0.5 hover:bg-[#BE9643] hover:shadow-[0_6px_20px_rgba(216,171,76,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(216,171,76,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {drawing ? "Drawing…" : "Run Raffle"}
                    </button>
                  </div>
                  {drawError && <p className="mt-3 text-sm text-red-600">{drawError}</p>}
                  {lastDraw && (
                    <div className="mt-4 rounded-xl border border-[#EADFC0] bg-[#FBF3E1] p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {lastDraw.draw.drawLabel}
                      </p>
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {lastDraw.winner.name} {lastDraw.winner.surname}
                      </p>
                      <p className="text-sm text-gray-600">{lastDraw.winner.email}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {lastDraw.winner.tokenCount} chip{lastDraw.winner.tokenCount === 1 ? "" : "s"}{" "}
                        held
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
                    Lounge screen - {activeSlot.label}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Starts a countdown on the big screen in the lounge (
                    <a
                      href="/display"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#704287] underline hover:text-[#3c1e4b]"
                    >
                      open display
                    </a>
                    ). When it hits zero it draws and reveals the winner live, with fireworks.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="drawPool"
                        checked={drawPool === "cumulative"}
                        onChange={() => setDrawPool("cumulative")}
                        className="h-4 w-4 text-[#D8AB4C] focus:ring-[#D8AB4C]"
                      />
                      Everyone entered so far (carries forward from earlier draws)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="drawPool"
                        checked={drawPool === "window"}
                        onChange={() => setDrawPool("window")}
                        className="h-4 w-4 text-[#D8AB4C] focus:ring-[#D8AB4C]"
                      />
                      Only new entrants in this window
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      Countdown
                      <input
                        type="number"
                        min={10}
                        value={loungeSeconds}
                        onChange={(e) => setLoungeSeconds(e.target.value)}
                        className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-gray-900 focus:border-[#D8AB4C] focus:outline-none"
                      />
                      sec
                    </label>
                    <button
                      onClick={() =>
                        startLoungeCountdown(Math.max(10, Number(loungeSeconds) || 300), "start")
                      }
                      disabled={loungeBusy !== null}
                      className="whitespace-nowrap rounded-full bg-[#D8AB4C] px-6 py-2.5 font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(216,171,76,0.35)] transition hover:-translate-y-0.5 hover:bg-[#BE9643] disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {loungeBusy === "start" ? "Starting…" : "Start Countdown"}
                    </button>
                    <button
                      onClick={() => startLoungeCountdown(8, "redraw")}
                      disabled={loungeBusy !== null}
                      className="whitespace-nowrap rounded-full border border-[#D8AB4C]/50 px-6 py-2.5 font-bold tracking-wide text-[#D8AB4C] transition hover:bg-[#FBF3E1] disabled:opacity-60"
                    >
                      {loungeBusy === "redraw" ? "Redrawing…" : "Redraw"}
                    </button>
                    <button
                      onClick={handleResetLoungeScreen}
                      disabled={loungeBusy !== null}
                      className="whitespace-nowrap rounded-full border border-gray-300 px-6 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      {loungeBusy === "reset" ? "Resetting…" : "Reset Screen"}
                    </button>
                  </div>
                  {loungeError && <p className="mt-3 text-sm text-red-600">{loungeError}</p>}
                  {loungeMessage && <p className="mt-3 text-sm text-emerald-600">{loungeMessage}</p>}
                </div>
              </>
            )}
          </>
        )}

        <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
            Display logo
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Upload an image to replace the built-in logo mark on the lounge display screen
            (PNG, JPG, or SVG - under 2MB). Leave it as-is to keep the default.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <img
              key={logoPreviewKey}
              src={`/api/logo?v=${logoPreviewKey}`}
              alt="Current custom logo"
              className="h-16 max-w-[12rem] rounded-lg border border-gray-200 bg-gray-50 object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                setHasCustomLogo(false);
              }}
              onLoad={(e) => {
                e.currentTarget.style.display = "";
                setHasCustomLogo(true);
              }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-600"
            />
            <button
              onClick={handleUploadLogo}
              disabled={!logoFile || logoBusy !== null}
              className="whitespace-nowrap rounded-full bg-[#D8AB4C] px-6 py-2.5 font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(216,171,76,0.35)] transition hover:-translate-y-0.5 hover:bg-[#BE9643] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {logoBusy === "upload" ? "Uploading…" : "Upload Logo"}
            </button>
            <button
              onClick={handleRemoveLogo}
              disabled={logoBusy !== null}
              className="whitespace-nowrap rounded-full border border-gray-300 px-6 py-2.5 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
            >
              {logoBusy === "remove" ? "Removing…" : "Remove Custom Logo"}
            </button>
          </div>
          {logoError && <p className="mt-3 text-sm text-red-600">{logoError}</p>}
          {logoMessage && <p className="mt-3 text-sm text-emerald-600">{logoMessage}</p>}
        </div>

        <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
            Export data
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Download all visitor data as CSV (across every draw slot) for post-show contact and
            reconciliation.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="mt-4 rounded-full border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          {exportError && <p className="mt-3 text-sm text-red-600">{exportError}</p>}
        </div>

        <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
            Draw history
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Every raffle draw that's been run, most recent first - including redraws. If a
            window shows more than one entry clustered around the same time, the one with the
            latest timestamp is the one that actually played out live on screen; earlier
            entries in that cluster were superseded redraws.
          </p>
          <button
            onClick={handleLoadDrawHistory}
            disabled={loadingDrawHistory}
            className="mt-4 rounded-full border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingDrawHistory ? "Loading…" : "Load draw history"}
          </button>
          {drawHistoryError && <p className="mt-3 text-sm text-red-600">{drawHistoryError}</p>}
          {drawHistory && drawHistory.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">No draws have been run yet.</p>
          )}
          {drawHistory && drawHistory.length > 0 && (
            <ul className="mt-4 space-y-2">
              {drawHistory.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-[#EADFC0] bg-[#FBF3E1] px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {new Date(d.drawnAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    - {d.drawLabel}
                  </p>
                  <p className="mt-1 font-bold text-gray-900">
                    {d.winner.name} {d.winner.surname}
                  </p>
                  <p className="text-sm text-gray-600">
                    {d.winner.email} - code {d.winner.personalCode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[#3c1e4b]/15 bg-white p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#704287]">
            Remove test / staff entries
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Finds visitors whose name, surname, or email contains &ldquo;test&rdquo;,
            &ldquo;miranda&rdquo;, or &ldquo;finn&rdquo;, so you can delete them one at a time -
            they&rsquo;d otherwise still show up in counts and be eligible for the draw.
          </p>
          <button
            onClick={handleFindTestEntries}
            disabled={findingTestEntries}
            className="mt-4 rounded-full border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            {findingTestEntries ? "Searching…" : "Find entries"}
          </button>
          {testEntriesError && <p className="mt-3 text-sm text-red-600">{testEntriesError}</p>}
          {testEntries && testEntries.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">No matching entries found.</p>
          )}
          {testEntries && testEntries.length > 0 && (
            <ul className="mt-4 space-y-2">
              {testEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {entry.name} {entry.surname}
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.email} - code {entry.personalCode} - {entry.tokenCount} chip
                      {entry.tokenCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteVisitor(entry)}
                    disabled={deletingVisitorId !== null}
                    className="whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deletingVisitorId === entry.id ? "Deleting…" : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-[0_10px_40px_-10px_rgba(112,66,135,0.2)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Danger zone
          </h2>
          <p className="mt-2 text-sm text-red-700">
            Permanently deletes every registered visitor, their collected chips, and all past
            raffle draw/winner history. This cannot be undone - export the CSV above first if
            you need a record. Type <span className="font-mono font-bold">CLEAR</span> to enable
            the button.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={clearConfirmText}
              onChange={(e) => setClearConfirmText(e.target.value)}
              placeholder="Type CLEAR"
              className="w-40 rounded-lg border border-red-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none"
            />
            <button
              onClick={handleClearAllUsers}
              disabled={clearConfirmText !== "CLEAR" || clearing}
              className="whitespace-nowrap rounded-full bg-red-600 px-6 py-2.5 font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(220,38,38,0.35)] transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {clearing ? "Clearing…" : "Clear All Users"}
            </button>
          </div>
          {clearError && <p className="mt-3 text-sm text-red-700">{clearError}</p>}
          {clearMessage && <p className="mt-3 text-sm text-emerald-700">{clearMessage}</p>}
        </div>
      </div>
    </main>
  );
}
