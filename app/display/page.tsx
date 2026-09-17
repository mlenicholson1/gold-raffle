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

type Sparkle = { id: number; left: number; top: number; size: number; delay: number; duration: number };

// Fixed ambient sparkles behind everything. Generated client-side only, after
// mount - Math.random() during the server render would mismatch the client's
// first render and trigger a hydration error.
function Sparkles() {
  const [dots, setDots] = useState<Sparkle[]>([]);

  useEffect(() => {
    setDots(
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 1000) / 10,
        top: Math.round(Math.random() * 1000) / 10,
        size: 2 + Math.round(Math.random() * 3),
        delay: Math.round(Math.random() * 6000) / 1000,
        duration: 3 + Math.round(Math.random() * 3000) / 1000,
      }))
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-amber-300"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            opacity: 0,
            animation: `sparkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
            boxShadow: "0 0 8px 2px rgba(251,191,36,0.6)",
          }}
        />
      ))}
    </div>
  );
}

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore - some browsers/kiosk setups block this; the corner button stays available.
    } finally {
      setShowPrompt(false);
    }
  }

  if (showPrompt && !isFullscreen) {
    return (
      <button
        onClick={enterFullscreen}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/90 text-slate-200 backdrop-blur-sm"
      >
        <span className="text-5xl">⛶</span>
        <span className="text-2xl font-semibold">Tap to go fullscreen</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => (isFullscreen ? document.exitFullscreen() : enterFullscreen())}
      className="absolute bottom-4 right-4 z-20 rounded-full border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-sm text-slate-500 opacity-30 transition hover:opacity-100"
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      ⛶
    </button>
  );
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

  const urgent = state?.mode === "countdown" && (state.secondsRemaining ?? 99) <= 10;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.14),transparent_60%)]" />
      <Sparkles />
      <FullscreenButton />

      {!state && <p className="relative text-2xl text-slate-500">Connecting…</p>}

      {state && state.mode === "idle" && (
        <div className="relative space-y-6">
          <p className="animate-[floaty_5s_ease-in-out_infinite] text-6xl">🪙</p>
          <p className="text-2xl font-semibold uppercase tracking-[0.3em] text-amber-400">
            Hold Gold
          </p>
          <h1 className="text-6xl font-black text-slate-100 drop-shadow-[0_0_35px_rgba(251,191,36,0.35)] sm:text-7xl">
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
          <div className="relative mx-auto flex items-center justify-center">
            <div
              className={`absolute h-[22rem] w-[22rem] rounded-full border-4 sm:h-[26rem] sm:w-[26rem] ${
                urgent
                  ? "border-red-500/40 animate-[ringPulse_0.6s_ease-in-out_infinite]"
                  : "border-amber-400/30 animate-[ringPulse_2.4s_ease-in-out_infinite]"
              }`}
            />
            <p
              className={`font-mono text-[13rem] font-black leading-none drop-shadow-[0_0_40px_rgba(251,191,36,0.5)] sm:text-[16rem] ${
                urgent ? "text-red-400" : "text-amber-400"
              }`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatClock(state.secondsRemaining)}
            </p>
          </div>
          <p className="text-xl text-slate-500">Make sure you've collected your chips!</p>
        </div>
      )}

      {state && state.mode === "drawing" && (
        <div className="relative space-y-6">
          <p className="animate-[spin_1.2s_linear_infinite] text-7xl">🪙</p>
          <p className="bg-gradient-to-r from-amber-200 via-amber-500 to-amber-200 bg-[length:200%_auto] bg-clip-text text-5xl font-black text-transparent [animation:shimmer_1.6s_linear_infinite] sm:text-7xl">
            Shuffling the chips…
          </p>
          <p className="text-2xl text-slate-400">Picking a winner now</p>
        </div>
      )}

      {state && state.mode === "reveal" && (
        <div className="relative space-y-6 animate-[popIn_0.6s_ease-out]">
          <p className="text-3xl uppercase tracking-[0.3em] text-amber-400">
            🎉 {state.drawLabel ?? "Winner"} 🎉
          </p>
          <h1 className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-[length:200%_auto] bg-clip-text text-7xl font-black text-transparent drop-shadow-[0_0_60px_rgba(251,191,36,0.6)] [animation:shimmer_2.5s_linear_infinite] sm:text-8xl">
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
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}
