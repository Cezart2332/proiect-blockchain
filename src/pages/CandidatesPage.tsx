import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.tsx'
import SkeletonList from '../components/SkeletonList.tsx'
import { candidates } from '../mockData.js'

export default function CandidatesPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(false)
    }, 900)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const totalVotes = useMemo(
    () => candidates.reduce((total, candidate) => total + candidate.voteCount, 0),
    [],
  )

  const leadingVotes = useMemo(
    () => candidates.reduce((max, candidate) => Math.max(max, candidate.voteCount), 0),
    [],
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
                  const percentage =
                    totalVotes === 0 ? 0 : (candidate.voteCount / totalVotes) * 100
                  const isWinner = candidate.voteCount === leadingVotes

                  return (
                    <tr key={candidate.id}>
                      <td className="mono-value">#{candidate.id}</td>
                      <td>{candidate.name}</td>
                      <td className="mono-value">{candidate.voteCount}</td>
                      <td className="mono-value">{percentage.toFixed(1)}%</td>
                      <td>
                        {isWinner ? <span className="winner-badge">Winner</span> : '-'}
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
