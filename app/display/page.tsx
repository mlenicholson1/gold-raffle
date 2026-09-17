"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

type DisplayState = {
  mode: "idle" | "countdown" | "drawing" | "reveal" | "empty";
  slotLabel: string | null;
  drawLabel: string | null;
  secondsRemaining: number | null;
  winner: { name: string | null; surname: string | null } | null;
  emptyReason: string | null;
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fireWorks(durationMs: number) {
  const end = Date.now() + durationMs;
  const colors = ["#fbbf24", "#f59e0b", "#fde68a", "#ffffff"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.6 },
      colors,
      startVelocity: 55,
      ticks: 200,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.6 },
      colors,
      startVelocity: 55,
      ticks: 200,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({
    particleCount: 140,
    spread: 100,
    origin: { y: 0.4 },
    colors,
    startVelocity: 45,
    scalar: 1.1,
  });
}

export default function DisplayPage() {
  const [state, setState] = useState<DisplayState | null>(null);
  const prevMode = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/display/state", { cache: "no-store" });
        const data: DisplayState = await res.json();
        if (!cancelled) setState(data);
      } catch {
        // Keep showing the last known state; the next poll will retry.
      }
    }

    poll();
    const interval = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (state && state.mode === "reveal" && prevMode.current !== "reveal") {
      fireWorks(4000);
    }
    if (state) prevMode.current = state.mode;
  }, [state]);

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.12),transparent_60%)]" />

      {!state && <p className="text-2xl text-slate-500">Connecting…</p>}

      {state && state.mode === "idle" && (
        <div className="relative space-y-6">
          <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-amber-400">
            Hold Gold
          </p>
          <h1 className="text-6xl font-black text-slate-100 sm:text-7xl">
            The Vegas Gold Call
          </h1>
          <p className="text-2xl text-slate-400">Live draws happen right here at the booth.</p>
        </div>
      )}

      {state && state.mode === "countdown" && state.secondsRemaining !== null && (
        <div className="relative space-y-8">
          <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-amber-400">
            {state.slotLabel ?? "Vegas Gold Call"}
          </p>
          <p className="text-3xl text-slate-300">The draw happens in…</p>
          <p
            className="font-mono text-[13rem] font-black leading-none text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.5)] sm:text-[16rem]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatClock(state.secondsRemaining)}
          </p>
          <p className="text-xl text-slate-500">Make sure you've collected your chips!</p>
        </div>
      )}

      {state && state.mode === "drawing" && (
        <div className="relative space-y-6">
          <p className="animate-pulse text-5xl font-black text-amber-400 sm:text-7xl">
            Shuffling the chips…
          </p>
          <p className="text-2xl text-slate-400">Picking a winner now</p>
        </div>
      )}

      {state && state.mode === "reveal" && (
        <div className="relative space-y-6 animate-[popIn_0.6s_ease-out]">
          <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-amber-400">
            🎉 {state.drawLabel ?? "Winner"} 🎉
          </p>
          <h1 className="text-7xl font-black text-slate-100 drop-shadow-[0_0_50px_rgba(251,191,36,0.6)] sm:text-8xl">
            {state.winner?.name} {state.winner?.surname}
          </h1>
          <p className="text-2xl text-slate-400">Come on up to claim your gold!</p>
        </div>
      )}

      {state && state.mode === "empty" && (
        <div className="relative space-y-6">
          <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-amber-400">
            {state.slotLabel ?? "Vegas Gold Call"}
          </p>
          <h1 className="text-4xl font-bold text-slate-100 sm:text-5xl">
            {state.emptyReason ?? "No eligible entries yet."}
          </h1>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.6); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
