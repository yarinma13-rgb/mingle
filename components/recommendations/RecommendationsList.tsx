import { RecommendationStars } from "@/components/recommendations/RecommendationStars";
import type { SubmittedRecommendation } from "@/lib/recommendations/persistence";

function looksRtl(text: string): boolean {
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(text);
}

export function RecommendationsList({
  items,
}: {
  items: SubmittedRecommendation[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const bodyRtl = item.body ? looksRtl(item.body) : false;
        return (
          <article key={item.id} className="flex flex-col gap-2">
            <RecommendationStars rating={item.rating} />
            <p className="text-sm font-medium text-mingle-text">
              {item.recommenderName}
            </p>
            <p
              lang="he"
              dir="rtl"
              className="text-xs text-mingle-text-secondary"
            >
              מאומת דרך LinkedIn
            </p>
            {item.body ? (
              <p
                dir={bodyRtl ? "rtl" : "auto"}
                lang={bodyRtl ? "he" : undefined}
                className="whitespace-pre-wrap text-sm text-mingle-text-secondary"
              >
                {item.body}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
