import { MingleLogo } from "@/components/MingleLogo";
import { RecommendForm } from "@/components/recommendations/RecommendForm";
import { linkedinIdentityForToken } from "@/lib/recommendations/linkedin-identity";
import { previewRecommendationRequest } from "@/lib/recommendations/persistence";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function RecommendPage({
  params,
  searchParams,
}: PageProps<"/recommend/[token]">) {
  const { token } = await params;
  const query = await searchParams;
  const linkedinError = query.error === "linkedin";

  if (!UUID.test(token)) {
    return (
      <main className="flex min-h-screen flex-1 justify-center px-6 py-16">
        <p className="text-sm text-mingle-text-secondary" dir="rtl">
          הקישור לא תקין.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  let preview: Awaited<ReturnType<typeof previewRecommendationRequest>> = null;
  try {
    preview = await previewRecommendationRequest(supabase, token);
  } catch {
    preview = null;
  }

  const identity = preview?.status === "pending" ? await linkedinIdentityForToken(token) : null;

  return (
    <main className="flex min-h-screen flex-1 justify-center px-6 py-16 sm:px-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={40} className="mb-4" />
        </div>

        {!preview ? (
          <p className="text-center text-sm text-mingle-text-secondary" dir="rtl">
            הקישור לא תקין או שפג תוקפו.
          </p>
        ) : preview.status === "submitted" ? (
          <p className="text-center text-sm text-mingle-text-secondary" dir="rtl">
            ההמלצה כבר נשלחה. תודה.
          </p>
        ) : (
          <>
            <h1
              className="text-center font-display text-2xl font-bold text-mingle-text"
              dir="rtl"
            >
              כתוב המלצה עבור {preview.candidateName}
            </h1>
            {linkedinError && !identity ? (
              <p className="text-center text-sm text-mingle-pink" dir="rtl">
                לא הצלחנו להתחבר ל-LinkedIn. נסו שוב.
              </p>
            ) : null}
            {identity ? (
              <RecommendForm token={token} linkedinName={identity.name} />
            ) : (
              <a
                href={`/api/auth/linkedin?token=${encodeURIComponent(token)}`}
                className="rounded-full bg-mingle-cta px-8 py-3.5 text-center font-display text-sm font-semibold text-white"
              >
                Sign in with LinkedIn
              </a>
            )}
          </>
        )}
      </div>
    </main>
  );
}
