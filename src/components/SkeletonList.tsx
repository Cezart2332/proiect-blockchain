interface SkeletonListProps {
  columns: number
  rows?: number
}

export default function SkeletonList({ columns, rows = 4 }: SkeletonListProps) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="skeleton-table-row" key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <div className="skeleton-line" key={columnIndex} />
          ))}
        </div>
      ))}
    </div>
  )
}
