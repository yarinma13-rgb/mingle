import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

/** Old placeholder URL: plans now live at /plans (companies only). */
export default async function ComingSoonPage() {
  const { isCompany } = await requireAppUser({ skipBillingGate: true });
  redirect(isCompany ? "/plans" : "/dashboard");
}
