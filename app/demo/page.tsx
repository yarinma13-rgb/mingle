import { Suspense } from "react";
import { DemoShell } from "@/components/DemoShell";

export default function DemoPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Suspense fallback={null}>
        <DemoShell />
      </Suspense>
    </main>
  );
}
