"use server";

import { cookies } from "next/headers";
import {
  LINKEDIN_REC_COOKIE,
  parseLinkedInRecSession,
} from "@/lib/recommendations/linkedin-session";

export async function linkedinIdentityForToken(
  token: string,
): Promise<{ name: string } | null> {
  try {
    const cookieStore = await cookies();
    const session = parseLinkedInRecSession(
      cookieStore.get(LINKEDIN_REC_COOKIE.name)?.value,
    );
    if (!session || session.token !== token) return null;
    return { name: session.name };
  } catch {
    return null;
  }
}
