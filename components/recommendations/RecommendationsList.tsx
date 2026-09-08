import { RecommendationStars } from "@/components/recommendations/RecommendationStars";
import type { SubmittedRecommendation } from "@/lib/recommendations/persistence";

export function RecommendationsList({
  items,
}: {
  items: SubmittedRecommendation[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <article key={item.id} className="flex flex-col gap-2">
          <RecommendationStars rating={item.rating} />
          <p className="text-sm font-medium text-mingle-text">{item.recommenderName}</p>
          <p className="text-xs text-mingle-text-secondary">מאומת דרך LinkedIn</p>
          {item.body ? (
            <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
              {item.body}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
