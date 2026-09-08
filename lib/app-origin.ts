export function appOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers";
  return raw.replace(/\/$/, "");
}
