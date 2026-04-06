import { isAddress } from 'ethers'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminGuard from '../components/AdminGuard.tsx'
import ElectionStateBadge from '../components/ElectionStateBadge.tsx'
import EmptyState from '../components/EmptyState.tsx'
import { useElection } from '../context/ElectionContext'
import { shortenAddress } from '../utils/format'

export default function AdminPage() {
  const navigate = useNavigate()
  const {
    loading,
    error,
    currentState,
    candidates,
    totalCandidates,
    totalVotes,
    totalVoters,
    connectedAddress,
    isOwner,
    hasMetaMask,
    wrongNetwork,
    winner,
    txStep,
    txPending,
    toast,
    connectWalletAction,
    switchNetworkAction,
    addCandidate,
    registerVoter,
    openElection,
    closeElection,
    resetElection,
  } = useElection()

  const [candidateName, setCandidateName] = useState('')
  const [voterAddress, setVoterAddress] = useState('')
  const [localValidationError, setLocalValidationError] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetNotice, setResetNotice] = useState<string | null>(null)

  const rankedCandidates = useMemo(
    () =>
      [...candidates].sort(
        (left, right) => right.voteCount - left.voteCount || left.id - right.id,
      ),
    [candidates],
  )

  const openDisabledReason = useMemo(() => {
    if (currentState !== 'PREPARATION') {
      return 'Election can only be opened from preparation state.'
    }

    if (!hasMetaMask) {
      return 'Please install MetaMask.'
    }

    if (wrongNetwork) {
      return 'Please switch to Sepolia.'
    }

    if (txPending) {
      return 'A transaction is already in progress.'
    }

    if (totalCandidates < 2) {
      return 'Need at least 2 candidates to open election.'
    }

    if (totalVoters < 1) {
      return 'Register at least one voter before opening election.'
    }

    return null
  }, [currentState, hasMetaMask, wrongNetwork, txPending, totalCandidates, totalVoters])

  const closeDisabledReason = useMemo(() => {
    if (currentState !== 'OPEN') {
      return 'Election can only be closed while it is open.'
    }

    if (!hasMetaMask) {
      return 'Please install MetaMask.'
    }

    if (wrongNetwork) {
      return 'Please switch to Sepolia.'
    }

    if (txPending) {
      return 'A transaction is already in progress.'
    }

    return null
  }, [currentState, hasMetaMask, wrongNetwork, txPending])

  const resetDisabledReason = useMemo(() => {
    if (!hasMetaMask) {
      return 'Please install MetaMask.'
    }

    if (wrongNetwork) {
      return 'Please switch to Sepolia.'
    }

    if (txPending) {
      return 'A transaction is already in progress.'
    }

    return null
  }, [hasMetaMask, wrongNetwork, txPending])

  const txActionLabel =
    txStep === 'wallet'
      ? 'Waiting for MetaMask...'
      : txStep === 'confirming'
        ? 'Confirming transaction...'
        : null

  const submitAddCandidate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = candidateName.trim()
    if (!name) {
      setLocalValidationError('Candidate name cannot be empty.')
      return
    }

    setLocalValidationError(null)
    const success = await addCandidate(name)
    if (success) {
      setCandidateName('')
    }
  }

  const submitRegisterVoter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const address = voterAddress.trim()
    if (!isAddress(address)) {
      setLocalValidationError('Please enter a valid wallet address.')
      return
    }

    setLocalValidationError(null)
    const success = await registerVoter(address)
    if (success) {
      setVoterAddress('')
    }
  }

  const handleOpenElection = async () => {
    setLocalValidationError(null)
    setResetNotice(null)

    const success = await openElection()
    if (success) {
      setResetNotice('Election is now OPEN.')
    }
  }

  const handleCloseElection = async () => {
    setLocalValidationError(null)
    setResetNotice(null)

    const success = await closeElection()
    if (success) {
      setResetNotice('Election is now CLOSED.')
    }
  }

  const handleConfirmReset = async () => {
    setLocalValidationError(null)

    const success = await resetElection()
    if (!success) {
      return
    }

    setShowResetModal(false)
    setResetNotice('Election reset complete. Redirecting to dashboard...')
    window.setTimeout(() => {
      navigate('/')
    }, 1100)
  }

  return (
    <section className="page-screen">
      <header className="page-header compact">
        <div>
          <p className="page-kicker mono-value">/ admin</p>
          <h1>Election Administration</h1>
          <p className="page-description">
            Manage candidates, register voters, and control voting lifecycle operations.
          </p>
        </div>
      </header>

      <section className="panel-card wallet-connect-row">
        <div>
          <p className="panel-label">Current State</p>
          <ElectionStateBadge state={currentState} />
        </div>
        <div>
          <p className="panel-label">Connected Wallet</p>
          <p className="mono-value vote-selection-display">
            {connectedAddress ? shortenAddress(connectedAddress) : 'Not connected'}
          </p>
        </div>
        {!connectedAddress && hasMetaMask ? (
          <button
            className="terminal-button"
            type="button"
            onClick={() => void connectWalletAction()}
            disabled={txPending}
          >
            Connect Wallet
          </button>
        ) : null}
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

      {resetNotice ? (
        <div className="panel-card tx-toast tx-toast-success" role="status">
          <p className="panel-subtle">{resetNotice}</p>
        </div>
      ) : null}

      {error ? (
        <div className="panel-card access-restricted">
          <p className="panel-label">Admin Error</p>
          <p className="panel-subtle">{error}</p>
        </div>
      ) : null}

      {localValidationError ? (
        <div className="panel-card tx-alert tx-alert-error" role="alert">
          <p className="panel-subtle">{localValidationError}</p>
        </div>
      ) : null}

      {txPending ? (
        <div className="panel-card tx-pending-row" role="status" aria-live="polite">
          <span className="tx-spinner" aria-hidden="true" />
          <p className="panel-subtle">
            {txStep === 'wallet'
              ? 'Waiting for MetaMask...'
              : 'Transaction pending on Sepolia. Waiting for confirmation...'}
          </p>
        </div>
      ) : null}

      <AdminGuard isOwner={isOwner}>
        {currentState === 'PREPARATION' ? (
          <div className="admin-grid">
            <form className="panel-card admin-card" onSubmit={(event) => void submitAddCandidate(event)}>
              <div className="admin-card-heading">
                <h2>Add Candidate</h2>
              </div>

              <label className="field-label" htmlFor="candidate-name">
                Candidate Name
              </label>
              <input
                id="candidate-name"
                className="field-input"
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
                placeholder="Enter candidate name"
                disabled={txPending || loading}
              />

              <button
                className="terminal-button"
                type="submit"
                disabled={txPending || loading || wrongNetwork || !hasMetaMask}
              >
                {txActionLabel ?? 'Add Candidate'}
              </button>
            </form>

            <form
              className="panel-card admin-card"
              onSubmit={(event) => void submitRegisterVoter(event)}
            >
              <div className="admin-card-heading">
                <h2>Register Voter</h2>
              </div>

              <label className="field-label" htmlFor="voter-address">
                Wallet Address
              </label>
              <input
                id="voter-address"
                className="field-input mono-value"
                value={voterAddress}
                onChange={(event) => setVoterAddress(event.target.value)}
                placeholder="0x..."
                disabled={txPending || loading}
              />

              <button
                className="terminal-button"
                type="submit"
                disabled={txPending || loading || wrongNetwork || !hasMetaMask}
              >
                {txActionLabel ?? 'Register Voter'}
              </button>
            </form>

            <section className="panel-card admin-card">
              <div className="admin-card-heading">
                <h2>Preparation Controls</h2>
              </div>
              <p className="panel-subtle">Candidates: {totalCandidates}</p>
              <p className="panel-subtle">Registered voters: {totalVoters}</p>
              <button
                className="terminal-button"
                type="button"
                disabled={Boolean(openDisabledReason)}
                title={openDisabledReason ?? undefined}
                onClick={() => void handleOpenElection()}
              >
                {txActionLabel ?? 'Open Election'}
              </button>
              {openDisabledReason ? (
                <p className="panel-subtle tx-copy-warning">{openDisabledReason}</p>
              ) : null}
            </section>
          </div>
        ) : null}

        {currentState === 'OPEN' ? (
          <section className="panel-card admin-state-panel">
            <div className="section-heading-row">
              <h2>Live Election Controls</h2>
              <ElectionStateBadge state={currentState} compact />
            </div>

            <div className="admin-inline-stats">
              <article className="panel-card stat-card">
                <p className="panel-label">Candidates</p>
                <p className="mono-value">{totalCandidates}</p>
              </article>
              <article className="panel-card stat-card">
                <p className="panel-label">Votes Cast</p>
                <p className="mono-value">{totalVotes}</p>
              </article>
              <article className="panel-card stat-card">
                <p className="panel-label">Registered Voters</p>
                <p className="mono-value">{totalVoters}</p>
              </article>
            </div>

            <div className="admin-actions-row">
              <button
                className="terminal-button"
                type="button"
                disabled={Boolean(closeDisabledReason)}
                title={closeDisabledReason ?? undefined}
                onClick={() => void handleCloseElection()}
              >
                {txActionLabel ?? 'Close Election'}
              </button>
              <button
                className="terminal-button terminal-button-danger"
                type="button"
                disabled={Boolean(resetDisabledReason)}
                title={resetDisabledReason ?? undefined}
                onClick={() => setShowResetModal(true)}
              >
                {txActionLabel ?? 'Reset Election'}
              </button>
            </div>
          </section>
        ) : null}

        {currentState === 'CLOSED' ? (
          <section className="panel-card admin-state-panel">
            <div className="section-heading-row">
              <h2>Final Results</h2>
              <ElectionStateBadge state={currentState} compact />
            </div>

            {winner ? (
              <div className="panel-card winner-summary-card">
                <p className="panel-label">Election Winner</p>
                <p className="mono-value winner-summary-name">{winner.name}</p>
                <p className="panel-subtle">{winner.voteCount} votes</p>
              </div>
            ) : (
              <EmptyState
                title="Winner not available"
                description="No winner data returned by the contract."
              />
            )}

            {rankedCandidates.length > 0 ? (
              <div className="table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankedCandidates.map((candidate, index) => {
                      const isWinnerRow =
                        winner !== null &&
                        winner.name === candidate.name &&
                        winner.voteCount === candidate.voteCount

                      return (
                        <tr key={candidate.id} className={isWinnerRow ? 'results-row-winner' : ''}>
                          <td className="mono-value">#{index + 1}</td>
                          <td>{candidate.name}</td>
                          <td className="mono-value">{candidate.voteCount}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="admin-actions-row">
              <button
                className="terminal-button terminal-button-danger"
                type="button"
                disabled={Boolean(resetDisabledReason)}
                title={resetDisabledReason ?? undefined}
                onClick={() => setShowResetModal(true)}
              >
                {txActionLabel ?? 'Reset Election'}
              </button>
            </div>
          </section>
        ) : null}
      </AdminGuard>

      {showResetModal ? (
        <div className="modal-backdrop" role="presentation">
          <div className="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
            <h2 id="reset-modal-title">Reset Election</h2>
            <p className="panel-subtle">
              Are you sure? This will delete all candidates and voters.
            </p>
            <div className="modal-action-row">
              <button
                className="terminal-button"
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={txPending}
              >
                Cancel
              </button>
              <button
                className="terminal-button terminal-button-danger"
                type="button"
                onClick={() => void handleConfirmReset()}
                disabled={txPending}
              >
                {txActionLabel ?? 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
