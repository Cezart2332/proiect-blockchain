import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState.tsx'
import ResultsBar from '../components/ResultsBar.tsx'
import SkeletonCards from '../components/SkeletonCards.tsx'
import SkeletonList from '../components/SkeletonList.tsx'
import StatCard from '../components/StatCard.tsx'
import VoteStatus from '../components/VoteStatus.tsx'
import { candidates, currentUser, dashboardStats, totalVoters, votingOpen } from '../mockData.js'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLoading(false)
    }, 850)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <section className="page-screen">
      <header className="page-header">
        <div>
          <p className="page-kicker mono-value">/ dashboard</p>
          <h1>Election Analytics Board</h1>
          <p className="page-description">
            Track turnout, monitor candidate performance, and verify ballot state at a
            glance.
          </p>
        </div>

        <aside className="panel-card header-aside">
          <p className="panel-label">Current voter</p>
          <p className="mono-value">{currentUser.address}</p>
          <p className="panel-subtle">Registry size: {totalVoters} voters</p>
        </aside>
      </header>

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="stats-grid">
          {dashboardStats.map((metric) => (
            <StatCard key={metric.id} metric={metric} />
          ))}

          <article className="panel-card stat-card voting-status-card">
            <p className="panel-label">Voting Status</p>
            <VoteStatus isOpen={votingOpen} />
            <p className="panel-subtle">
              {votingOpen
                ? 'Ballot is actively accepting votes.'
                : 'Ballot is closed for tally finalization.'}
            </p>
          </article>
        </div>
      )}

      <section className="panel-card">
        <div className="section-heading-row">
          <h2>Votes Per Candidate</h2>
          <p className="panel-subtle">CSS chart view of current ballot distribution</p>
        </div>

        {loading ? (
          <SkeletonList columns={3} rows={3} />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No candidates registered"
            description="Candidate vote bars appear after nomination data is available."
          />
        ) : (
          <ResultsBar candidates={candidates} />
        )}
      </section>
    </section>
  )
}
