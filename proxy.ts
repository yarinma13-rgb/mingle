import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/profile",
  "/company-profile",
  "/dashboard",
  "/discover",
  "/connections",
  "/conversations",
  "/board",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !user) {
    const onboardingPath = request.nextUrl.pathname.startsWith(
      "/onboarding/company",
    )
      ? "company"
      : "talent";
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("path", onboardingPath);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/onboarding/:path*",
    "/profile/:path*",
    "/company-profile/:path*",
    "/dashboard/:path*",
    "/discover/:path*",
    "/connections/:path*",
    "/conversations/:path*",
    "/board/:path*",
  ],
};
