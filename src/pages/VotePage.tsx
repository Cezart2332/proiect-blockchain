import { useMemo, useState } from 'react'
import CandidateCard from '../components/CandidateCard.tsx'
import ElectionStateBadge from '../components/ElectionStateBadge.tsx'
import EmptyState from '../components/EmptyState.tsx'
import SkeletonCards from '../components/SkeletonCards.tsx'
import { useElection } from '../context/ElectionContext'
import { shortenAddress } from '../utils/format'

export default function VotePage() {
  const {
    loading,
    error,
    currentState,
    candidates,
    connectedAddress,
    hasMetaMask,
    wrongNetwork,
    isRegistered,
    hasVoted,
    txStep,
    txPending,
    toast,
    connectWalletAction,
    switchNetworkAction,
    vote,
  } = useElection()

  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  )

  const canCastVote =
    currentState === 'OPEN' &&
    selectedCandidate !== null &&
    Boolean(connectedAddress) &&
    isRegistered &&
    !hasVoted &&
    !wrongNetwork &&
    !txPending

  const castVote = async () => {
    if (!selectedCandidate) {
      return
    }

    const success = await vote(selectedCandidate.id)
    if (success) {
      setSelectedCandidateId(null)
    }
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

      <section className="panel-card wallet-connect-row">
        <div>
          <p className="panel-label">Current State</p>
          <ElectionStateBadge state={currentState} />
        </div>
        <div>
          <p className="panel-label">Wallet</p>
          <p className="mono-value vote-selection-display">
            {connectedAddress ? shortenAddress(connectedAddress) : 'Not connected'}
          </p>
        </div>
      </section>

      {!hasMetaMask ? (
        <div className="panel-card tx-alert tx-alert-error">
          <p className="panel-label">Wallet Required</p>
          <p className="panel-subtle">Please install MetaMask</p>
        </div>
      ) : null}

      {hasMetaMask && wrongNetwork ? (
        <div className="panel-card tx-alert tx-alert-warning">
          <p className="panel-label">Wrong Network</p>
          <div className="tx-alert-action-row">
            <p className="panel-subtle">Connected wallet is not on Sepolia (11155111).</p>
            <button
              className="terminal-button"
              type="button"
              onClick={() => void switchNetworkAction()}
              disabled={txPending}
            >
              Switch to Sepolia
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`panel-card tx-toast ${toast.type === 'success' ? 'tx-toast-success' : 'tx-toast-error'}`}
          role="status"
        >
          <p className="panel-subtle">{toast.message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="panel-card access-restricted">
          <p className="panel-label">Vote Error</p>
          <p className="panel-subtle">{error}</p>
        </div>
      ) : null}

      {currentState === 'PREPARATION' ? (
        <section className="panel-card">
          <EmptyState
            title="Election not started yet"
            description="Voting will become available after the owner opens the election."
          />
        </section>
      ) : null}

      {currentState === 'CLOSED' ? (
        <section className="panel-card">
          <EmptyState
            title="Election has ended"
            description="Voting is closed and no additional ballots can be submitted."
          />
        </section>
      ) : null}

      {currentState === 'OPEN' ? (
        <section className="panel-card vote-page-panel">
          <div className="section-heading-row">
            <h2>Available Candidates</h2>
            <ElectionStateBadge state={currentState} compact />
          </div>

          {!connectedAddress && hasMetaMask ? (
            <div className="panel-card tx-alert tx-alert-warning">
              <p className="panel-subtle">Connect your wallet to continue.</p>
              <button
                className="terminal-button"
                type="button"
                onClick={() => void connectWalletAction()}
                disabled={txPending}
              >
                Connect Wallet
              </button>
            </div>
          ) : null}

          {connectedAddress && !isRegistered ? (
            <div className="panel-card tx-alert tx-alert-error">
              <p className="panel-subtle">You are not registered to vote.</p>
            </div>
          ) : null}

          {connectedAddress && hasVoted ? (
            <div className="panel-card vote-locked-card">
              <span className="candidate-check-icon" aria-hidden="true">
                &#10003;
              </span>
              <p className="panel-subtle">You have already voted</p>
            </div>
          ) : null}

          {loading ? (
            <SkeletonCards className="candidate-grid" count={Math.max(candidates.length, 3)} />
          ) : candidates.length === 0 ? (
            <EmptyState
              title="No candidates registered"
              description="Add candidates from the admin page before opening voting."
            />
          ) : (
            <div className="candidate-grid">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidateId === candidate.id}
                  isLocked={
                    txPending ||
                    hasVoted ||
                    !isRegistered ||
                    wrongNetwork ||
                    !connectedAddress
                  }
                  showCheckmark={false}
                  onSelect={(id) => setSelectedCandidateId(id)}
                />
              ))}
            </div>
          )}

          {txPending ? (
            <div className="tx-pending-row" role="status" aria-live="polite">
              <span className="tx-spinner" aria-hidden="true" />
              <p className="panel-subtle">
                {txStep === 'wallet'
                  ? 'Waiting for MetaMask...'
                  : 'Transaction pending on Sepolia. Waiting for confirmation...'}
              </p>
            </div>
          ) : null}

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
              onClick={() => void castVote()}
            >
              {txStep === 'wallet' ? (
                <span className="inline-button-content">
                  <span className="tx-spinner inline-spinner" aria-hidden="true" />
                  Waiting for MetaMask...
                </span>
              ) : txStep === 'confirming' ? (
                <span className="inline-button-content">
                  <span className="tx-spinner inline-spinner" aria-hidden="true" />
                  Confirming transaction...
                </span>
              ) : (
                'Cast Vote'
              )}
            </button>
          </div>
        </section>
      ) : null}
    </section>
  )
}
