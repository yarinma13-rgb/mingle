/** Classify messaging failures so the UI can show a useful recovery path. */

export type MessagingFailureKind =
  | "not_accepted"
  | "missing_schema"
  | "permission"
  | "unknown";

export function classifyMessagingError(error: unknown): MessagingFailureKind {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : error instanceof Error
        ? error.message
        : String(error ?? "");
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const lower = message.toLowerCase();

  if (
    code === "42P01" ||
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("could not find the table")
  ) {
    return "missing_schema";
  }
  if (
    code === "42501" ||
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("violates row-level security")
  ) {
    return "permission";
  }
  if (
    lower.includes("accepted") ||
    lower.includes("not accepted") ||
    lower.includes("connection")
  ) {
    return "not_accepted";
  }
  return "unknown";
}
