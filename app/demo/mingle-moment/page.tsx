import { notFound } from "next/navigation";
import { MingleMomentPreview } from "@/components/mingle-moment/MingleMomentPreview";
import { isDemoRouteEnabled } from "@/lib/demo/access";

export default function MingleMomentDemoPage() {
  if (!isDemoRouteEnabled()) notFound();
  return <MingleMomentPreview />;
}
