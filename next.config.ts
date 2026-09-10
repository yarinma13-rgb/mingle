import type { NextConfig } from "next";

const STORAGE_PATH = "/storage/v1/object/**";

function supabaseStoragePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: STORAGE_PATH,
    },
  ];
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return patterns;
  try {
    const url = new URL(raw);
    const protocol = url.protocol === "http:" ? "http" : "https";
    patterns.push({
      protocol,
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: STORAGE_PATH,
    });
  } catch {
    return patterns;
  }
  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseStoragePatterns(),
  },
};

export default nextConfig;
