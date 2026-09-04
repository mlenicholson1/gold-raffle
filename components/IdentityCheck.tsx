"use client";

import { useEffect, useState } from "react";
import type { Progress } from "@/lib/visitor";
import {
  getStoredVisitor,
  setStoredVisitor,
  clearStoredVisitor,
} from "@/lib/visitorStorage";

export type IdentifiedVisitor = {
  id: string;
  name: string;
  surname: string;
  personalCode: string;
  createdAt: string;
};

type IdentifyResponse = {
  visitor: IdentifiedVisitor;
  progress: Progress;
};

type Phase = "checking" | "identify" | "register" | "ready";

export default function IdentityCheck({
  children,
}: {
  children: (ctx: {
    visitor: IdentifiedVisitor;
    progress: Progress;
    refresh: () => void;
  }) => React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [visitor, setVisitor] = useState<IdentifiedVisitor | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyIdentified(data: IdentifyResponse) {
    setStoredVisitor({
      id: data.visitor.id,
      code: data.visitor.personalCode,
      name: data.visitor.name,
    });
    setVisitor(data.visitor);
    setProgress(data.progress);
    setPhase("ready");
  }

  useEffect(() => {
    const stored = getStoredVisitor();
    if (!stored) {
      setPhase("identify");
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
      .then(applyIdentified)
      .catch(() => {
        clearStoredVisitor();
        setPhase("identify");
      });
  }, []);

  function refresh() {
    const stored = getStoredVisitor();
    if (!stored) return;
    fetch("/api/identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: stored.id, code: stored.code }),
    })
      .then((res) => res.json())
      .then((data: IdentifyResponse) => {
        setVisitor(data.visitor);
        setProgress(data.progress);
      });
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
      applyIdentified(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
      applyIdentified(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <p className="text-slate-400">Checking who you are…</p>
      </main>
    );
  }

  if (phase === "ready" && visitor && progress) {
    return <>{children({ visitor, progress, refresh })}</>;
  }

  if (phase === "register") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-md">
          <h1 className="text-xl font-bold text-slate-100">New here? Register first</h1>
          <p className="mt-1 text-sm text-slate-400">
            Just your name, surname, and email - takes a few seconds.
          </p>
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-yellow-500 focus:outline-none"
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
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-amber-400 py-3 font-bold tracking-wide text-slate-900 shadow-[0_4px_14px_rgba(251,191,36,0.35)] transition hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_6px_20px_rgba(251,191,36,0.45)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(251,191,36,0.3)] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? "Submitting…" : "Register & continue"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhase("identify");
                setError(null);
              }}
              className="w-full text-sm text-slate-400 underline"
            >
              Already registered? Look yourself up
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-md">
        <h1 className="text-xl font-bold text-slate-100">Who are you?</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter the email or 4-digit code from when you registered.
        </p>
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
            className="w-full rounded-lg bg-yellow-500 py-2.5 font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
          >
            {submitting ? "Looking up…" : "Continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("register");
              setError(null);
            }}
            className="w-full text-sm text-slate-400 underline"
          >
            New here? Register instead
          </button>
        </form>
      </div>
    </main>
  );
}
