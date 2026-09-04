"use client";

import { useEffect, useState } from "react";
import ProgressTracker from "@/components/ProgressTracker";
import NextSteps from "@/components/NextSteps";
import type { Progress } from "@/lib/visitor";
import {
  getStoredVisitor,
  setStoredVisitor,
  clearStoredVisitor,
} from "@/lib/visitorStorage";

type Result = {
  visitor: { id: string; name: string; surname: string; personalCode: string; createdAt: string };
  progress: Progress;
  alreadyRegistered?: boolean;
};

type Phase = "checking" | "form" | "success";

export default function RegisterPage() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [result, setResult] = useState<Result | null>(null);
  const [showLookup, setShowLookup] = useState(false);

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredVisitor();
    if (!stored) {
      setPhase("form");
      return;
    }

    fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: stored.id, code: stored.code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Result) => {
        setResult(data);
        setPhase("success");
      })
      .catch(() => {
        clearStoredVisitor();
        setPhase("form");
      });
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, surname, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStoredVisitor({
        id: data.visitor.id,
        code: data.visitor.personalCode,
        name: data.visitor.name,
      });
      setResult(data);
      setPhase("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "We couldn't find that visitor.");
        return;
      }
      setStoredVisitor({
        id: data.visitor.id,
        code: data.visitor.personalCode,
        name: data.visitor.name,
      });
      setResult(data);
      setPhase("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <p className="text-slate-400">Checking for your registration…</p>
      </main>
    );
  }

  if (phase === "success" && result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-md">
          <h1 className="text-2xl font-bold text-slate-100">
            {result.alreadyRegistered ? `Welcome back, ${result.visitor.name}!` : `You're in, ${result.visitor.name}!`}
          </h1>
          <p className="mt-2 text-slate-400">Your code - save this if you switch phones</p>
          <p className="mt-2 text-4xl font-mono font-bold tracking-widest text-yellow-400">
            {result.visitor.personalCode}
          </p>
          <div className="mt-6">
            <ProgressTracker progress={result.progress} />
          </div>
          <NextSteps progress={result.progress} registeredAt={result.visitor.createdAt} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-md">
        <h1 className="text-2xl font-bold text-slate-100">Hold Gold Registration</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter your details to start collecting tokens.
        </p>

        {!showLookup ? (
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Surname</label>
              <input
                type="text"
                required
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
                placeholder="Your surname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-amber-400 py-3 font-bold tracking-wide text-slate-900 shadow-[0_4px_14px_rgba(251,191,36,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(251,191,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? "Submitting…" : "Register"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLookup(true);
                setError(null);
              }}
              className="w-full text-sm text-slate-400 underline"
            >
              Already registered on another device?
            </button>
          </form>
        ) : (
          <form onSubmit={handleLookup} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email or 4-digit code
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
                placeholder="you@example.com or 1234"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-amber-400 py-3 font-bold tracking-wide text-slate-900 shadow-[0_4px_14px_rgba(251,191,36,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(251,191,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? "Looking up…" : "Find my progress"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLookup(false);
                setError(null);
              }}
              className="w-full text-sm text-slate-400 underline"
            >
              New here? Register instead
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
