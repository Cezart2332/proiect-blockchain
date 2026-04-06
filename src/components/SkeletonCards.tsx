interface SkeletonCardsProps {
  count?: number
  className?: string
}

export default function SkeletonCards({ count = 3, className = '' }: SkeletonCardsProps) {
  return (
    <div className={`stats-grid ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article className="panel-card stat-card skeleton-card" key={index}>
          <div className="skeleton-line short" />
          <div className="skeleton-line large" />
          <div className="skeleton-line" />
        </article>
      ))}
    </div>
  )
}
