import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('border rounded-lg p-4 md:p-6 space-y-3', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 skeleton-shimmer rounded" />
          <div className="h-4 w-24 skeleton-shimmer rounded" />
        </div>
        <div className="h-6 w-20 skeleton-shimmer rounded-pill" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-40 skeleton-shimmer rounded" />
        <div className="h-4 w-36 skeleton-shimmer rounded" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 skeleton-shimmer rounded" />
        <div className="h-5 w-16 skeleton-shimmer rounded-pill" />
      </div>
    </div>
  );
}

export function SkeletonCandidateCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('border rounded-lg p-4 space-y-3', className)}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full skeleton-shimmer shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 skeleton-shimmer rounded" />
          <div className="h-3 w-20 skeleton-shimmer rounded" />
          <div className="flex gap-1.5">
            <div className="h-5 w-16 skeleton-shimmer rounded-pill" />
            <div className="h-5 w-14 skeleton-shimmer rounded-pill" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 skeleton-shimmer rounded-md" />
        <div className="h-9 w-9 skeleton-shimmer rounded-md" />
      </div>
    </div>
  );
}
