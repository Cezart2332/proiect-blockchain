import type { ElectionState } from '../types'

interface ElectionStateBadgeProps {
  state: ElectionState
  compact?: boolean
}

const STATE_LABELS: Record<ElectionState, string> = {
  PREPARATION: '⚙️ Preparation',
  OPEN: '🟢 Voting Open',
  CLOSED: '🔴 Voting Closed',
}

export default function ElectionStateBadge({ state, compact = false }: ElectionStateBadgeProps) {
  const stateClass = state.toLowerCase()

  return (
    <span
      className={`election-state-badge is-${stateClass} ${state === 'OPEN' ? 'is-pulsing' : ''} ${compact ? 'is-compact' : ''}`}
    >
      {STATE_LABELS[state]}
    </span>
  )
}
