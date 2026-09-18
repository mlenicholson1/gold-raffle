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

// Sourced from the WGC/BCG "Digital Gold" white paper - kept to public, final
// figures only (no internal roadmap, projections, or named individuals).
const GOLD_FACTS: { before: string; highlight: string; after: string }[] = [
  {
    before: "Almost all the gold ever mined - around ",
    highlight: "220,000 tonnes",
    after: " - is still in circulation today",
  },
  {
    before: "The world's above-ground gold stock is worth more than ",
    highlight: "$30 trillion",
    after: "",
  },
  {
    before: "Gold ETFs took in ",
    highlight: "$89 billion",
    after: " in 2025, pushing holdings to 4,025 tonnes",
  },
  {
    before: "The tokenized gold market passed ",
    highlight: "$4 billion",
    after: " in 2025",
  },
  {
    before: "DeFi protocols now hold more than ",
    highlight: "$125 billion",
    after: " in value",
  },
  {
    before: "",
    highlight: "85%",
    after: " of central banks cite gold's crisis performance as a reason to hold it",
  },
  {
    before: "",
    highlight: "30%",
    after: " of Gen Z start investing as young adults - versus just 6% of Baby Boomers",
  },
  {
    before: "Gold trading in the Loco London market topped ",
    highlight: "$160 billion",
    after: " a day in 2025",
  },
  {
    before: "Gold opened at 98 shillings 8 pence an ounce at that ",
    highlight: "first Fixing",
    after: "",
  },
  {
    before: "Just ",
    highlight: "four bullion brokers",
    after: " set that first gold price - the basic structure lasted over a century",
  },
];

function GoldFactsTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % GOLD_FACTS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const fact = GOLD_FACTS[index];

  return (
    <div className="w-full">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#704287]">
        Did you know?
      </p>
      <div className="mt-1 flex min-h-[4rem] w-full items-center justify-center">
        <p
          key={index}
          className="text-2xl text-gray-900 [animation:factFade_0.6s_ease-out]"
        >
          {fact.before}
          <span className="font-bold text-[#a6822b]">{fact.highlight}</span>
          {fact.after}
        </p>
      </div>
    </div>
  );
}

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

type NetworkPoint = { x: number; y: number; vx: number; vy: number; color: string };

// An animated constellation of drifting, linking nodes - reads as "digital
// gold network" rather than static decoration. Canvas-based and client-only,
// since it needs real pixel dimensions and Math.random() (server rendering
// this would mismatch the client's first paint and trigger a hydration error).
function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const LINK_DISTANCE = 190;
    const colors = ["#a6822b", "#c9a13c", "#7c3aed"];
    const points: NetworkPoint[] = Array.from({ length: 46 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }
    window.addEventListener("resize", resize);

    let rafId = 0;
    function frame() {
      ctx!.clearRect(0, 0, width, height);

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i];
          const b = points[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            ctx!.strokeStyle = `rgba(124, 58, 237, ${0.22 * (1 - dist / LINK_DISTANCE)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const p of points) {
        ctx!.globalAlpha = 0.75;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }

      rafId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />;
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[1.3rem] w-[1.3rem]">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BenchmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[1.3rem] w-[1.3rem]">
      <rect x="4" y="15" width="16" height="4" rx="1" />
      <rect x="5.5" y="10" width="13" height="4" rx="1" />
      <rect x="7" y="5" width="10" height="4" rx="1" />
    </svg>
  );
}

function ScrollIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[1.3rem] w-[1.3rem]">
      <path d="M6 4h9l3 3v13H6z" strokeLinejoin="round" />
      <path d="M15 4v3h3" strokeLinejoin="round" />
      <path d="M9 11h6M9 15h6" strokeLinecap="round" />
    </svg>
  );
}

function FactColumn({
  icon,
  title,
  description,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  note?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 px-4 py-1 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#EADFC0] bg-[#FBF3E1] text-[#a6822b]">
        {icon}
      </div>
      <p className="text-base font-bold uppercase tracking-wide text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
      {note && <p className="text-xs text-gray-400">{note}</p>}
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

function WGCLogo() {
  return (
    <div
      className="absolute left-6 top-6 z-20 flex items-center gap-3 text-[#d8ab4c]"
      style={{ fontFamily: "var(--font-noto-sans)" }}
    >
      <svg viewBox="0 0 48 48" className="h-[2.625rem] w-[2.625rem]" fill="none">
        <circle cx="24" cy="24" r="21.5" stroke="currentColor" strokeWidth="2.6" />
        <circle cx="24" cy="24" r="14.5" stroke="currentColor" strokeWidth="2.6" />
        <circle cx="24" cy="24" r="7.5" stroke="currentColor" strokeWidth="2.6" />
      </svg>
      <p className="text-left text-sm font-semibold uppercase leading-tight tracking-normal">
        World
        <br />
        Gold
        <br />
        Council
      </p>
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
      className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.35)] transition hover:text-[#a6822b]"
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      <span className="text-lg">⛶</span>
      {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
    </button>
  );
}

export default function DisplayPage() {
  const [state, setState] = useState<DisplayState | null>(null);
  const prevMode = useRef<string | null>(null);

  // Scales every rem-based size on this page (text, spacing, icons) via the
  // root font size, rather than a CSS transform - which would just overflow
  // visually instead of reflowing the layout. The winner reveal gets an
  // extra boost (roughly 2x normal) for a bigger celebratory moment.
  useEffect(() => {
    document.documentElement.style.fontSize = state?.mode === "reveal" ? "200%" : "150%";
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [state?.mode]);

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-8 pt-28 text-center">
      <NetworkBackground />
      <WGCLogo />
      <FullscreenButton />

      {!state && <p className="relative text-2xl text-gray-400">Connecting…</p>}

      {state && state.mode === "idle" && (
        <div className="relative w-full max-w-5xl space-y-6">
          <h1 className="text-6xl font-black text-gray-900 sm:text-7xl">
            The Vegas <span className="text-[#a6822b]">Gold</span> Call
          </h1>
          <p className="text-2xl text-gray-500">Inspired by the LBMA Gold Price Auction</p>

          <div className="mx-auto rounded-[1.75rem] border border-violet-100 bg-white px-7 py-4 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)]">
            <p className="pb-3 text-base font-normal text-gray-900">
              The daily benchmark price-setting mechanism for physical gold
            </p>
            <div className="flex flex-col divide-y divide-violet-100 sm:flex-row sm:divide-x sm:divide-y-0">
              <FactColumn
                icon={<ClockIcon />}
                title="Daily Call"
                description="Twice a day, 10:30am and 3:00pm London time"
              />
              <FactColumn
                icon={<BenchmarkIcon />}
                title="Global Benchmark"
                description="A trusted reference price for gold markets"
              />
              <FactColumn
                icon={<ScrollIcon />}
                title="Since 1919"
                description="London's first Gold Fixing took place on 12 September 1919"
              />
            </div>
          </div>

          <GoldFactsTicker />

          <div className="mx-auto flex max-w-2xl items-center gap-6 rounded-3xl border border-violet-100 bg-white px-8 py-5 text-left shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qr-vegasfix.png"
              alt="QR code to collect your Vegas Gold Call chip"
              className="h-[8.4rem] w-[8.4rem] flex-none rounded-lg border border-gray-200"
            />
            <div>
              <p className="text-base font-semibold text-gray-900">
                Scan the QR code to collect your Vegas Gold Call chip
              </p>
              <p className="mt-1 text-sm text-gray-500">
                then visit the other activations to collect the remaining three chips
              </p>
            </div>
          </div>
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
        <div
          className="relative max-w-5xl space-y-12 animate-[popIn_0.6s_ease-out]"
          style={{ fontFamily: "var(--font-noto-sans)" }}
        >
          <p className="flex items-center justify-center gap-4 text-xl font-semibold text-violet-600">
            <span className="h-px w-10 bg-violet-300" />
            {state.drawLabel ?? "Gold Call"}
            <span className="h-px w-10 bg-violet-300" />
          </p>
          <p className="text-3xl font-light text-gray-700 sm:text-4xl">
            The winner of our 1oz gold coin from our {ordinalWord(state.ordinal ?? 1)} Gold Call
            is…
          </p>
          <h1 className="bg-gradient-to-r from-[#b98f3a] via-[#d8ab4c] to-[#f0d199] bg-[length:200%_auto] bg-clip-text text-7xl font-semibold text-transparent [animation:shimmer_2.5s_linear_infinite] sm:text-8xl">
            {state.winner?.name} {state.winner?.surname}
          </h1>
          <p className="text-2xl font-light text-gray-700">
            Please come up to the front to collect your prize!
          </p>
        </div>
      )}

      {state && state.mode === "empty" && (
        <div className="relative space-y-6">
          <SectionLabel>{state.slotLabel ?? "Vegas Gold Call"}</SectionLabel>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            {state.emptyReason ?? "No eligible entries yet"}
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
        @keyframes factFade {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
