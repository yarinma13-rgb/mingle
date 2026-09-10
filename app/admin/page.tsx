import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/access";

export default async function AdminIndexPage() {
  await requireAdmin();
  redirect("/admin/matches");
}
