export type GeoPoint = { latitude: number; longitude: number };

const cache = new Map<string, GeoPoint | null>();
let lastCallAt = 0;

function cacheKey(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, " ");
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceKmBetween(
  a: { latitude: number | null; longitude: number | null } | null | undefined,
  b: { latitude: number | null; longitude: number | null } | null | undefined,
): number | null {
  if (
    a?.latitude == null ||
    a.longitude == null ||
    b?.latitude == null ||
    b.longitude == null
  ) {
    return null;
  }
  return haversineKm(
    { latitude: a.latitude, longitude: a.longitude },
    { latitude: b.latitude, longitude: b.longitude },
  );
}

export async function geocodeLocation(location: string): Promise<GeoPoint | null> {
  const key = cacheKey(location);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const wait = 1100 - (Date.now() - lastCallAt);
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastCallAt = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", location.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "mingle/1.0 (https://mingle.careers; noreply@mingle.careers)",
      },
    });
    if (!response.ok) {
      cache.set(key, null);
      return null;
    }
    const rows = (await response.json()) as { lat?: string; lon?: string }[];
    const lat = Number.parseFloat(rows[0]?.lat ?? "");
    const lon = Number.parseFloat(rows[0]?.lon ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      cache.set(key, null);
      return null;
    }
    const point = { latitude: lat, longitude: lon };
    cache.set(key, point);
    return point;
  } catch {
    return null;
  }
}
