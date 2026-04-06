import { useMemo } from 'react'
import ElectionStateBadge from '../components/ElectionStateBadge.tsx'
import EmptyState from '../components/EmptyState.tsx'
import ResultsBar from '../components/ResultsBar.tsx'
import SkeletonCards from '../components/SkeletonCards.tsx'
import SkeletonList from '../components/SkeletonList.tsx'
import StatCard from '../components/StatCard.tsx'
import { useElection } from '../context/ElectionContext'
import type { StatMetric } from '../types'

export default function DashboardPage() {
  const {
    loading,
    error,
    currentState,
    candidates,
    totalCandidates,
    totalVotes,
    totalVoters,
    winner,
    connectedAddress,
  } = useElection()

  const stateDescription = useMemo(() => {
    if (currentState === 'PREPARATION') {
      return 'Candidate and voter setup is active.'
    }

    if (currentState === 'OPEN') {
      return 'Ballot is actively accepting votes.'
    }

    return 'Election is closed and results are final.'
  }, [currentState])

  const dashboardStats = useMemo<StatMetric[]>(
    () => [
      {
        id: 'total-candidates',
        label: 'Total Candidates',
        value: totalCandidates,
        decimals: 0,
        delta: 'Loaded from contract.candidatesCount()',
      },
      {
        id: 'total-voters',
        label: 'Total Voters',
        value: totalVoters,
        decimals: 0,
        delta: 'Loaded from contract.getVotersCount()',
      },
      {
        id: 'votes-cast',
        label: 'Votes Cast',
        value: totalVotes,
        decimals: 0,
        delta: 'Loaded from contract.getTotalVotes()',
      },
    ],
    [totalCandidates, totalVoters, totalVotes],
  )

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
          <p className="mono-value">{connectedAddress ?? 'Wallet not connected'}</p>
          <p className="panel-subtle">Election state synchronized from contract</p>
        </aside>
      </header>

      {error ? (
        <div className="panel-card access-restricted">
          <p className="panel-label">Contract Read Error</p>
          <p className="panel-subtle">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="stats-grid">
          {dashboardStats.map((metric) => (
            <StatCard key={metric.id} metric={metric} />
          ))}

          <article className="panel-card stat-card voting-status-card">
            <p className="panel-label">Current State</p>
            <ElectionStateBadge state={currentState} />
            <p className="panel-subtle">{stateDescription}</p>
          </article>
        </div>
      )}

      {currentState === 'CLOSED' && winner ? (
        <section className="panel-card winner-summary-card">
          <div className="section-heading-row">
            <h2>Winner</h2>
            <span className="winner-badge">🏆 Winner</span>
          </div>
          <p className="mono-value winner-summary-name">{winner.name}</p>
          <p className="panel-subtle">{winner.voteCount} votes</p>
        </section>
      ) : null}

      <section className="panel-card">
        <div className="section-heading-row">
          <h2>Votes Per Candidate</h2>
          <p className="panel-subtle">Bar chart view across all election states</p>
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
