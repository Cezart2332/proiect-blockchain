import { useEffect, useMemo, useState } from 'react'
import CandidateCard from '../components/CandidateCard.tsx'
import SkeletonCards from '../components/SkeletonCards.tsx'
import VoteStatus from '../components/VoteStatus.tsx'
import { candidates, currentUser, votingOpen } from '../mockData.js'

export default function VotePage() {
  const [loading, setLoading] = useState(true)
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(currentUser.hasVoted)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(false)
    }, 900)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [selectedCandidateId],
  )

  const votingLocked = hasVoted || !votingOpen
  const canCastVote = selectedCandidate !== null && !votingLocked

  const castVote = () => {
    if (!canCastVote) {
      return
    }

    setHasVoted(true)
  }

  return (
    <section className="page-screen">
      <header className="page-header compact">
        <div>
          <p className="page-kicker mono-value">/ vote</p>
          <h1>Cast Ballot</h1>
          <p className="page-description">
            Select one candidate and submit your ballot. Voting locks instantly after a
            successful cast.
          </p>
        </div>
      </header>

      <section className="panel-card vote-page-panel">
        <div className="section-heading-row">
          <h2>Available Candidates</h2>
          <VoteStatus isOpen={votingOpen} />
        </div>

        {loading ? (
          <SkeletonCards className="candidate-grid" count={candidates.length} />
        ) : (
          <div className="candidate-grid">
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidateId === candidate.id}
                isLocked={votingLocked}
                showCheckmark={hasVoted && selectedCandidateId === candidate.id}
                onSelect={(id) => setSelectedCandidateId(id)}
              />
            ))}
          </div>
        )}

        <div className="vote-action-row">
          <div>
            <p className="panel-label">Selected candidate</p>
            <p className="mono-value vote-selection-display">
              {selectedCandidate ? `${selectedCandidate.name} (#${selectedCandidate.id})` : 'None'}
            </p>
          </div>

          <button
            className="terminal-button"
            type="button"
            disabled={!canCastVote}
            onClick={castVote}
          >
            {hasVoted ? 'Already Voted' : 'Cast Vote'}
          </button>
        </div>
      </section>
    </section>
  )
}
