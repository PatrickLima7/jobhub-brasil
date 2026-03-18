import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  showValue = true,
  reviewCount,
  interactive = false,
  onRate,
}: StarRatingProps) {
  const handleClick = (star: number) => {
    if (interactive && onRate) {
      onRate(star);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starIndex = i + 1;
          const fillPercentage = Math.min(1, Math.max(0, rating - i)) * 100;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starIndex)}
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} disabled:opacity-100`}
              style={{ width: size, height: size }}
            >
              {/* Empty star background */}
              <Star
                size={size}
                className="absolute inset-0 text-border fill-border"
                strokeWidth={0}
              />
              {/* Filled star with clip */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    size={size}
                    className="text-accent fill-accent"
                    strokeWidth={0}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="text-sm font-semibold text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-[13px] text-muted-foreground">
          ({reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  );
}
