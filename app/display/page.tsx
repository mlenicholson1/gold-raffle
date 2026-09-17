"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { ordinalWord } from "@/lib/ordinal";

type DisplayState = {
  mode: "idle" | "countdown" | "drawing" | "reveal" | "empty";
  slotLabel: string | null;
  drawLabel: string | null;
  ordinal: number | null;
  secondsRemaining: number | null;
  winner: { name: string | null; surname: string | null } | null;
  emptyReason: string | null;
};

const GOLD = "#a6822b";
const CONFETTI_COLORS = [GOLD, "#c9a13c", "#e8d18f", "#7c3aed", "#ffffff"];

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Runs continuously until the returned function is called - used so the
// celebration keeps going for as long as the winner is on screen, rather than
// stopping after a fixed few seconds.
function startFireworksLoop(): () => void {
  let stopped = false;
  let rafId = 0;

  (function frame() {
    if (stopped) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.6 },
      colors: CONFETTI_COLORS,
      startVelocity: 50,
      ticks: 220,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.6 },
      colors: CONFETTI_COLORS,
      startVelocity: 50,
      ticks: 220,
    });
    rafId = requestAnimationFrame(frame);
  })();

  const burstInterval = setInterval(() => {
    if (stopped) return;
    confetti({
      particleCount: 90,
      spread: 100,
      origin: { y: 0.4 },
      colors: CONFETTI_COLORS,
      startVelocity: 42,
      scalar: 1.05,
    });
  }, 2600);

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
    clearInterval(burstInterval);
  };
}

type Sparkle = { id: number; left: number; top: number; size: number; delay: number; duration: number };

// Ambient floating specks behind everything. Generated client-side only,
// after mount - Math.random() during the server render would mismatch the
// client's first render and trigger a hydration error.
function Sparkles() {
  const [dots, setDots] = useState<Sparkle[]>([]);

  useEffect(() => {
    setDots(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 1000) / 10,
        top: Math.round(Math.random() * 1000) / 10,
        size: 3 + Math.round(Math.random() * 3),
        delay: Math.round(Math.random() * 6000) / 1000,
        duration: 4 + Math.round(Math.random() * 3000) / 1000,
      }))
    );
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-[#a6822b]"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            opacity: 0,
            animation: `sparkle ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="30" height="30">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BenchmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="30" height="30">
      <rect x="4" y="15" width="16" height="4" rx="1" />
      <rect x="5.5" y="10" width="13" height="4" rx="1" />
      <rect x="7" y="5" width="10" height="4" rx="1" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="30" height="30">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FactColumn({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3 px-6 py-2 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#EADFC0] bg-[#FBF3E1] text-[#a6822b]">
        {icon}
      </div>
      <p className="text-lg font-bold uppercase tracking-wide text-gray-900">{title}</p>
      <p className="text-base text-gray-500">{description}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-4 text-xl font-semibold uppercase tracking-[0.3em] text-violet-600">
      <span className="h-px w-10 bg-violet-300" />
      {children}
      <span className="h-px w-10 bg-violet-300" />
    </p>
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
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-white/90 text-gray-700 backdrop-blur-sm"
      >
        <span className="text-5xl">⛶</span>
        <span className="text-2xl font-semibold">Tap to go fullscreen</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => (isFullscreen ? document.exitFullscreen() : enterFullscreen())}
      className="absolute bottom-4 right-4 z-20 rounded-full border border-gray-200 bg-white/60 px-3 py-2 text-sm text-gray-400 opacity-40 transition hover:opacity-100"
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

  // Keyed on the mode string (not the whole state object, which is a new
  // reference every poll) so the loop starts once on entering "reveal" and
  // only stops when leaving it or when this page is closed.
  useEffect(() => {
    if (state) prevMode.current = state.mode;
    if (state?.mode !== "reveal") return;
    return startFireworksLoop();
  }, [state?.mode]);

  const urgent = state?.mode === "countdown" && (state.secondsRemaining ?? 99) <= 10;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-8 text-center">
      <Sparkles />
      <FullscreenButton />

      {!state && <p className="relative text-2xl text-gray-400">Connecting…</p>}

      {state && state.mode === "idle" && (
        <div className="relative w-full max-w-5xl space-y-8">
          <SectionLabel>World Gold Council</SectionLabel>
          <h1 className="text-6xl font-black text-gray-900 sm:text-7xl">
            The Vegas <span className="text-[#a6822b]">Gold</span> Call
          </h1>
          <p className="text-2xl text-gray-500">A daily benchmark price for physical gold.</p>

          <div className="mx-auto flex flex-col divide-y divide-violet-100 rounded-[2.5rem] border border-violet-100 bg-white px-10 py-8 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)] sm:flex-row sm:divide-x sm:divide-y-0">
            <FactColumn
              icon={<ClockIcon />}
              title="Daily Call"
              description="Mon 3pm · Tue 10:30am & 3pm · Wed 10:30am"
            />
            <FactColumn
              icon={<BenchmarkIcon />}
              title="Global Benchmark"
              description="A trusted reference price for gold markets."
            />
            <FactColumn
              icon={<ShieldIcon />}
              title="Why It Matters"
              description="Store of value. Portfolio diversifier. Inflation hedge."
            />
          </div>

          <p className="text-lg text-gray-500">
            Collect chips at every station around the booth. Win a real 1oz gold coin at every
            draw.
          </p>
        </div>
      )}

      {state && state.mode === "countdown" && state.secondsRemaining !== null && (
        <div className="relative space-y-8">
          <SectionLabel>{state.slotLabel ?? "Vegas Gold Call"}</SectionLabel>
          <p className="text-3xl text-gray-600">The draw happens in…</p>
          <div className="relative mx-auto flex items-center justify-center rounded-[3rem] border border-violet-100 bg-white px-20 py-14 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)]">
            <div
              className={`absolute inset-6 rounded-[2.5rem] border-4 sm:inset-8 ${
                urgent
                  ? "border-red-400/60 animate-[ringPulse_0.6s_ease-in-out_infinite]"
                  : "border-[#EADFC0] animate-[ringPulse_2.4s_ease-in-out_infinite]"
              }`}
            />
            <p
              className={`relative font-mono text-[11rem] font-black leading-none sm:text-[13rem] ${
                urgent ? "text-red-500" : "text-[#a6822b]"
              }`}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatClock(state.secondsRemaining)}
            </p>
          </div>
          <p className="text-xl text-gray-500">Make sure you&rsquo;ve collected your chips!</p>
        </div>
      )}

      {state && state.mode === "drawing" && (
        <div className="relative space-y-8">
          <SectionLabel>{state.slotLabel ?? "Vegas Gold Call"}</SectionLabel>
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#EADFC0] border-t-[#a6822b] [animation:spin_1s_linear_infinite]" />
          <p className="bg-gradient-to-r from-[#a6822b] via-[#e8d18f] to-[#a6822b] bg-[length:200%_auto] bg-clip-text text-5xl font-black text-transparent [animation:shimmer_1.6s_linear_infinite] sm:text-7xl">
            Shuffling the chips…
          </p>
          <p className="text-2xl text-gray-500">Picking a winner now</p>
        </div>
      )}

      {state && state.mode === "reveal" && (
        <div className="relative max-w-5xl space-y-6 animate-[popIn_0.6s_ease-out]">
          <SectionLabel>{state.drawLabel ?? "Gold Call"}</SectionLabel>
          <p className="text-3xl text-gray-700 sm:text-4xl">
            The winner of our 1oz gold coin from our {ordinalWord(state.ordinal ?? 1)} Gold Call
            is…
          </p>
          <h1 className="bg-gradient-to-r from-[#8f6f22] via-[#a6822b] to-[#c9a13c] bg-[length:200%_auto] bg-clip-text text-7xl font-black text-transparent [animation:shimmer_2.5s_linear_infinite] sm:text-8xl">
            {state.winner?.name} {state.winner?.surname}
          </h1>
          <p className="text-2xl font-medium text-gray-700">
            Please come up to the front to collect your prize!
          </p>
        </div>
      )}

      {state && state.mode === "empty" && (
        <div className="relative space-y-6">
          <SectionLabel>{state.slotLabel ?? "Vegas Gold Call"}</SectionLabel>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
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
          50% { opacity: 0.7; transform: scale(1); }
        }
      `}</style>
    </main>
  );
}
