import { useMemo } from 'react'
import EmptyState from '../components/EmptyState.tsx'
import SkeletonList from '../components/SkeletonList.tsx'
import { useElection } from '../context/ElectionContext'

export default function CandidatesPage() {
  const { loading, error, currentState, candidates, totalVotes, winner } = useElection()

  const votesDenominator = useMemo(
    () => (currentState === 'PREPARATION' ? 0 : totalVotes),
    [currentState, totalVotes],
  )

  return (
    <section className="page-screen">
      <header className="page-header compact">
        <div>
          <p className="page-kicker mono-value">/ candidates</p>
          <h1>Candidate Standings</h1>
          <p className="page-description">
            View vote totals, ranking percentages, and the current leader in real time.
          </p>
        </div>
      </header>

      <section className="panel-card">
        {error ? (
          <div className="panel-card access-restricted">
            <p className="panel-label">Contract Read Error</p>
            <p className="panel-subtle">{error}</p>
          </div>
        ) : null}

        {loading ? (
          <SkeletonList columns={5} rows={5} />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No candidates available"
            description="Register candidates from the admin panel to populate this table."
          />
        ) : (
          <div className="table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Votes</th>
                  <th>Share</th>
                  <th>Rank</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => {
                  const displayedVotes =
                    currentState === 'PREPARATION' ? 0 : candidate.voteCount

                  const percentage =
                    votesDenominator === 0 ? 0 : (displayedVotes / votesDenominator) * 100

                  const isWinner =
                    currentState === 'CLOSED' &&
                    winner !== null &&
                    winner.name === candidate.name &&
                    winner.voteCount === candidate.voteCount

                  return (
                    <tr key={candidate.id} className={isWinner ? 'results-row-winner' : ''}>
                      <td className="mono-value">#{candidate.id}</td>
                      <td>{candidate.name}</td>
                      <td className="mono-value">
                        {currentState === 'PREPARATION'
                          ? '0 votes - election not started'
                          : displayedVotes}
                      </td>
                      <td className="mono-value">{percentage.toFixed(1)}%</td>
                      <td>
                        {isWinner ? <span className="winner-badge">🏆 Winner</span> : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
