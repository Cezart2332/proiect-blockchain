interface EmptyStateProps {
  title: string
  description: string
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-illustration" aria-hidden="true">
        <div className="empty-chip" />
        <div className="empty-line" />
        <div className="empty-line short" />
        <div className="empty-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
