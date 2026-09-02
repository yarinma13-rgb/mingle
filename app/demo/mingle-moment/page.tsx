import { notFound } from "next/navigation";
import { MingleMomentPreview } from "@/components/mingle-moment/MingleMomentPreview";

export default function MingleMomentDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MingleMomentPreview />;
}
