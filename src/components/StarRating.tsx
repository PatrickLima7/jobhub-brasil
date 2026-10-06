import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

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
  const [hoveredStar, setHoveredStar] = useState(0);

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
          const displayRating = interactive && hoveredStar > 0 ? hoveredStar : rating;
          const fillPercentage = Math.min(1, Math.max(0, displayRating - i)) * 100;
          const isActive = interactive && starIndex <= (hoveredStar || rating);

          return (
            <motion.button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => interactive && setHoveredStar(starIndex)}
              onMouseLeave={() => interactive && setHoveredStar(0)}
              whileTap={interactive ? { scale: 1.3 } : undefined}
              animate={isActive && interactive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut', delay: interactive ? i * 0.03 : 0 }}
              className={`relative ${interactive ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-100`}
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
                    className="text-accent fill-accent transition-colors duration-150"
                    strokeWidth={0}
                  />
                </div>
              )}
            </motion.button>
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
