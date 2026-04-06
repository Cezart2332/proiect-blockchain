import { useEffect, useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.tsx'
import ResultsBar from '../components/ResultsBar.tsx'
import SkeletonCards from '../components/SkeletonCards.tsx'
import SkeletonList from '../components/SkeletonList.tsx'
import StatCard from '../components/StatCard.tsx'
import VoteStatus from '../components/VoteStatus.tsx'
import {
  fetchCandidates,
  getConnectedAddress,
  getReadContract,
  parseContractError,
} from '../hooks/useContract.js'
import type { Candidate, StatMetric } from '../types'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [connectedAddress, setConnectedAddress] = useState('Wallet not connected')
  const [isVotingOpen, setIsVotingOpen] = useState(false)
  const [candidateCount, setCandidateCount] = useState(0)

  const totalVotes = useMemo(
    () => candidates.reduce((total, candidate) => total + candidate.voteCount, 0),
    [candidates],
  )

  const leadingVotes = useMemo(
    () => candidates.reduce((max, candidate) => Math.max(max, candidate.voteCount), 0),
    [candidates],
  )

  const dashboardStats = useMemo<StatMetric[]>(
    () => [
      {
        id: 'candidates',
        label: 'Candidates',
        value: candidateCount,
        decimals: 0,
        delta: 'Loaded from contract.candidatesCount()',
      },
      {
        id: 'votes-cast',
        label: 'Votes Cast',
        value: totalVotes,
        decimals: 0,
        delta:
          totalVotes > 0
            ? `${candidates.length} active candidates`
            : 'No votes recorded yet',
      },
      {
        id: 'leading-votes',
        label: 'Leading Candidate Votes',
        value: leadingVotes,
        decimals: 0,
        delta:
          leadingVotes > 0
            ? 'Highest vote total from current candidates'
            : 'Awaiting first vote',
      },
    ],
    [candidateCount, candidates.length, leadingVotes, totalVotes],
  )

  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      setLoading(true)
      setError(null)

      try {
        const contract = getReadContract()
        const [countRaw, votingState, fetchedCandidates, address] = await Promise.all([
          contract.candidatesCount(),
          contract.votingOpen(),
          fetchCandidates(contract),
          getConnectedAddress(),
        ])

        if (!mounted) {
          return
        }

        setCandidateCount(Number(countRaw))
        setIsVotingOpen(Boolean(votingState))
        setCandidates(fetchedCandidates)
        setConnectedAddress(address ?? 'Wallet not connected')
      } catch (fetchError) {
        if (!mounted) {
          return
        }

        setError(parseContractError(fetchError))
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
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
          <p className="mono-value">{connectedAddress}</p>
          <p className="panel-subtle">Candidates on chain: {candidateCount}</p>
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
            <p className="panel-label">Voting Status</p>
            <VoteStatus isOpen={isVotingOpen} />
            <p className="panel-subtle">
              {isVotingOpen
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
