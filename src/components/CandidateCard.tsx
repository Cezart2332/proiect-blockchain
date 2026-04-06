import type { Candidate } from '../types'
import AnimatedNumber from './AnimatedNumber'

interface CandidateCardProps {
  candidate: Candidate
  isSelected: boolean
  isLocked: boolean
  showCheckmark: boolean
  onSelect: (id: number) => void
}

export default function CandidateCard({
  candidate,
  isSelected,
  isLocked,
  showCheckmark,
  onSelect,
}: CandidateCardProps) {
  return (
    <article
      className={`panel-card candidate-card ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`}
    >
      <button
        type="button"
        className="candidate-card-hitbox"
        onClick={() => onSelect(candidate.id)}
        disabled={isLocked}
      >
        <p className="panel-label">Candidate #{candidate.id}</p>
        <h3>{candidate.name}</h3>
        <p className="candidate-vote-count mono-value">
          <AnimatedNumber value={candidate.voteCount} decimals={0} /> votes
        </p>
      </button>

      {showCheckmark ? (
        <div className="candidate-check-overlay" aria-label="Already voted">
          <span className="candidate-check-icon" aria-hidden="true">
            &#10003;
          </span>
          <span className="candidate-check-text">Already Voted</span>
        </div>
      ) : null}
    </article>
  )
}
