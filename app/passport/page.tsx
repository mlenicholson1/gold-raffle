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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f7f2fc] to-[#efe4f9] px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-violet-100 bg-white p-8 text-center shadow-[0_20px_60px_-15px_rgba(124,58,237,0.25)]">
        <h1 className="text-2xl font-bold text-gray-900">{visitor.name}&rsquo;s Passport</h1>
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
