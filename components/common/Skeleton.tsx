export function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}
