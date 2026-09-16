import { notFound } from "next/navigation";
import { MascotShowcase } from "@/components/MascotShowcase";
import { isDemoRouteEnabled } from "@/lib/demo/access";

export default function MascotDemoPage() {
  if (!isDemoRouteEnabled()) notFound();

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <MascotShowcase />
    </main>
  );
}
