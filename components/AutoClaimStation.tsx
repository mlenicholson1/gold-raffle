"use client";

import { useEffect, useState } from "react";
import IdentityCheck, { type IdentifiedVisitor } from "@/components/IdentityCheck";
import ProgressTracker from "@/components/ProgressTracker";
import NextSteps from "@/components/NextSteps";
import type { Progress, Station } from "@/lib/visitor";

function AutoClaimContent({
  visitor,
  progress: initialProgress,
  refresh,
  station,
  title,
  fact,
}: {
  visitor: IdentifiedVisitor;
  progress: Progress;
  refresh: () => void;
  station: Station;
  title: string;
  fact: string;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [justClaimed, setJustClaimed] = useState(false);
  const [claiming, setClaiming] = useState(!initialProgress.stations[station]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProgress.stations[station]) return; // already collected, nothing to do

    let cancelled = false;
    fetch("/api/tokens/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: visitor.id, station }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
        if (cancelled) return;
        setJustClaimed(true);
        setProgress(data.progress);
        refresh();
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Something went wrong. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setClaiming(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)]">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        {claiming ? (
          <p className="mt-6 text-gray-500">Collecting your token…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : (
          <>
            <p className="mt-4 text-sm text-gray-600">{fact}</p>
            <p className="mt-6 font-semibold text-gray-900">
              {justClaimed && progress.complete
                ? `All ${progress.total} tokens are collected. You are entered in every raffle draw today.`
                : justClaimed
                  ? `Token collected. ${progress.count} of ${progress.total} so far.`
                  : `You have already collected this token. Progress: ${progress.count} of ${progress.total}.`}
            </p>
            <div className="mt-4">
              <ProgressTracker progress={progress} />
            </div>
            <NextSteps progress={progress} registeredAt={visitor.createdAt} />
          </>
        )}
      </div>
    </main>
  );
}

export default function AutoClaimStation({
  station,
  title,
  fact,
}: {
  station: Station;
  title: string;
  fact: string;
}) {
  return (
    <IdentityCheck>
      {({ visitor, progress, refresh }) => (
        <AutoClaimContent
          visitor={visitor}
          progress={progress}
          refresh={refresh}
          station={station}
          title={title}
          fact={fact}
        />
      )}
    </IdentityCheck>
  );
}
