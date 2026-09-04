"use client";

import IdentityCheck, { type IdentifiedVisitor } from "@/components/IdentityCheck";
import ProgressTracker from "@/components/ProgressTracker";
import NextSteps from "@/components/NextSteps";
import type { Progress } from "@/lib/visitor";

function PassportContent({
  visitor,
  progress,
}: {
  visitor: IdentifiedVisitor;
  progress: Progress;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-md">
        <h1 className="text-2xl font-bold text-slate-100">{visitor.name}&rsquo;s Passport</h1>
        <div className="mt-6">
          <ProgressTracker progress={progress} />
        </div>
        <NextSteps progress={progress} registeredAt={visitor.createdAt} />
      </div>
    </main>
  );
}

export default function PassportPage() {
  return (
    <IdentityCheck>
      {({ visitor, progress }) => <PassportContent visitor={visitor} progress={progress} />}
    </IdentityCheck>
  );
}
