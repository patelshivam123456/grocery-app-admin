import { cn } from '@/utils/cn';

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn('font-bold', className)}>
      <span className="text-black">Just</span>{' '}
      <span className="text-primary">Harvst</span>
    </span>
  );
}
