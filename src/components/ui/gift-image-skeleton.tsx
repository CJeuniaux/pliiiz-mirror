import { Skeleton } from '@/components/ui/skeleton';

interface GiftImageSkeletonProps {
  className?: string;
}

export function GiftImageSkeleton({ className }: GiftImageSkeletonProps) {
  return (
    <div className={className}>
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}