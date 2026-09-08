"use server";

import { geocodeLocation } from "@/lib/geocoding/nominatim";
import { createClient } from "@/lib/supabase/server";

function coordsMissing(error: { message?: string } | null) {
  if (!error) return false;
  return /latitude|longitude|schema cache|column/i.test(error.message ?? "");
}

export async function syncProfileCoordinates(
  kind: "talent" | "company",
  location: string,
  previousLocation = "",
): Promise<void> {
  const trimmed = location.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const table = kind === "talent" ? "talent_profiles" : "company_profiles";
  const { data: existing, error: readError } = await supabase
    .from(table)
    .select("latitude, longitude")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readError && coordsMissing(readError)) return;
  if (readError) return;

  const unchanged =
    previousLocation.trim().toLowerCase() === trimmed.toLowerCase();
  if (
    unchanged &&
    existing?.latitude != null &&
    existing?.longitude != null
  ) {
    return;
  }

  const point = await geocodeLocation(trimmed);
  if (!point) return;

  const { error } = await supabase
    .from(table)
    .update({ latitude: point.latitude, longitude: point.longitude })
    .eq("user_id", user.id);
  if (error && !coordsMissing(error)) {
    console.error("geocode save failed:", error.message);
  }
}
