export function RecommendationStars({
  rating,
  interactive = false,
  onChange,
  size = 22,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  size?: number;
}) {
  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${rating} of 5`}
    >
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;
        const star = (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden
            className={filled ? "text-mingle-pink" : "text-mingle-border"}
          >
            <path
              d="M12 3.2 14.4 8.6l6 .5-4.6 4 1.4 5.8L12 16.4 6.8 18.9l1.4-5.8-4.6-4 6-.5z"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </svg>
        );
        if (!interactive) return <span key={value}>{star}</span>;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${value} of 5`}
            onClick={() => onChange?.(value)}
            className="rounded-md p-0.5 transition-transform hover:scale-105"
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
