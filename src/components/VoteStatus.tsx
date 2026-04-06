interface VoteStatusProps {
  isOpen: boolean
  compact?: boolean
}

export default function VoteStatus({ isOpen, compact = false }: VoteStatusProps) {
  const text = isOpen ? 'VOTING OPEN' : 'VOTING CLOSED'

  return (
    <span className={`vote-status ${isOpen ? 'is-open' : 'is-closed'} ${compact ? 'is-compact' : ''}`}>
      {text}
    </span>
  )
}
