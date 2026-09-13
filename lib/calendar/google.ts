import { appOrigin } from "@/lib/app-origin";

export function googleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function googleCalendarRedirectUri(): string {
  return `${appOrigin()}/api/auth/google-calendar/callback`;
}

export function googleCalendarAuthorizeUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("google calendar env missing");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCalendarRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ].join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

export async function exchangeGoogleCalendarCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
  email: string | null;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("google calendar env missing");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleCalendarRedirectUri(),
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token || !tokenJson.refresh_token) {
    throw new Error(tokenJson.error_description || "google token failed");
  }

  const expiresAt =
    typeof tokenJson.expires_in === "number"
      ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
      : null;

  let email: string | null = null;
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (userRes.ok) {
      const user = (await userRes.json()) as { email?: string };
      email = user.email?.trim() || null;
    }
  } catch {
    // optional
  }

  return {
    accessToken: tokenJson.access_token,
    refreshToken: tokenJson.refresh_token,
    expiresAt,
    email,
  };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresAt: string | null;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("google calendar env missing");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || "google refresh failed");
  }

  return {
    accessToken: tokenJson.access_token,
    expiresAt:
      typeof tokenJson.expires_in === "number"
        ? new Date(Date.now() + tokenJson.expires_in * 1000).toISOString()
        : null,
  };
}

export async function createGoogleCalendarEvent(input: {
  accessToken: string;
  calendarId?: string;
  summary: string;
  description?: string;
  startsAt: string;
  durationMinutes: number;
  attendeeEmails?: string[];
  locationType: "video" | "in_person";
}): Promise<{ eventId: string; meetLink: string | null }> {
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const calendarId = encodeURIComponent(input.calendarId?.trim() || "primary");

  const eventBody: Record<string, unknown> = {
    summary: input.summary,
    description: input.description ?? undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    attendees: (input.attendeeEmails ?? [])
      .filter(Boolean)
      .map((email) => ({ email })),
  };

  if (input.locationType === "video") {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `mingle-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events` +
    (input.locationType === "video" ? "?conferenceDataVersion=1" : "");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody),
  });

  const json = (await res.json()) as {
    id?: string;
    hangoutLink?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json.id) {
    throw new Error(json.error?.message || "Could not create calendar event");
  }

  return {
    eventId: json.id,
    meetLink: json.hangoutLink?.trim() || null,
  };
}
