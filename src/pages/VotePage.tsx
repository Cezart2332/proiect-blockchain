import { useCallback, useEffect, useMemo, useState } from 'react'
import CandidateCard from '../components/CandidateCard.tsx'
import EmptyState from '../components/EmptyState.tsx'
import SkeletonCards from '../components/SkeletonCards.tsx'
import VoteStatus from '../components/VoteStatus.tsx'
import {
  checkNetwork,
  connectWallet,
  fetchCandidates,
  getConnectedAddress,
  getContract,
  getReadContract,
  isMetaMaskInstalled,
  isSepoliaNetwork,
  parseContractError,
} from '../hooks/useContract.js'
import type { Candidate } from '../types'
import { shortenAddress } from '../utils/format'

interface ToastState {
  type: 'success' | 'error'
  message: string
}

type TransactionPhase = 'idle' | 'wallet' | 'mining'

export default function VotePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isRegistered, setIsRegistered] = useState(true)
  const [votingOpen, setVotingOpen] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(true)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [txPhase, setTxPhase] = useState<TransactionPhase>('idle')
  const [connecting, setConnecting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const txPending = txPhase !== 'idle'

  const refreshVotingData = useCallback(async (addressFromAction?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      const contract = getReadContract()
      const [votingState, fetchedCandidates] = await Promise.all([
        contract.votingOpen(),
        fetchCandidates(contract),
      ])

      setVotingOpen(Boolean(votingState))
      setCandidates(fetchedCandidates)

      const walletInstalled = isMetaMaskInstalled()
      setHasMetaMask(walletInstalled)

      if (!walletInstalled) {
        setWalletAddress(null)
        setWrongNetwork(false)
        setHasVoted(false)
        setIsRegistered(true)
        return
      }

      const activeAddress = addressFromAction ?? (await getConnectedAddress())
      setWalletAddress(activeAddress)
      setWrongNetwork(!(await isSepoliaNetwork()))

      if (!activeAddress) {
        setHasVoted(false)
        setIsRegistered(true)
        return
      }

      const [votedState, registeredState] = await Promise.all([
        contract.hasVoted(activeAddress),
        contract.registeredVoters(activeAddress),
      ])

      setHasVoted(Boolean(votedState))
      setIsRegistered(Boolean(registeredState))
    } catch (fetchError) {
      setError(parseContractError(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshVotingData()
  }, [refreshVotingData])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 3800)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toast])

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  )

  const votingLocked =
    hasVoted ||
    !votingOpen ||
    !isRegistered ||
    txPending ||
    !walletAddress ||
    wrongNetwork

  const canCastVote = selectedCandidate !== null && !votingLocked

  const handleConnectWallet = async () => {
    setConnecting(true)
    setError(null)

    try {
      const address = await connectWallet()

      if (!address) {
        throw new Error('Conectarea la wallet a esuat.')
      }

      setToast({ type: 'success', message: 'Wallet conectat cu succes.' })
      await refreshVotingData(address)
    } catch (connectError) {
      const message = parseContractError(connectError)
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setConnecting(false)
    }
  }

  const handleSwitchNetwork = async () => {
    setConnecting(true)
    setError(null)

    try {
      const switched = await checkNetwork()
      setWrongNetwork(!switched)

      if (switched) {
        setToast({ type: 'success', message: 'Ai trecut pe reteaua Sepolia.' })
      }
    } catch (networkError) {
      const message = parseContractError(networkError)
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setConnecting(false)
    }
  }

  const castVote = async () => {
    if (!canCastVote) {
      return
    }

    const candidateToVote = selectedCandidate
    if (!candidateToVote) {
      return
    }

    try {
      setError(null)
      setTxPhase('wallet')

      let activeAddress = walletAddress

      if (!activeAddress) {
        activeAddress = await connectWallet()
        setWalletAddress(activeAddress)
      }

      if (!activeAddress) {
        throw new Error('Conecteaza wallet-ul pentru a putea vota.')
      }

      const onSepolia = await checkNetwork()

      if (!onSepolia) {
        setWrongNetwork(true)
        setToast({ type: 'error', message: 'Schimba reteaua pe Sepolia.' })
        return
      }

      setWrongNetwork(false)

      const readContract = getReadContract()
      const [votedState, registeredState] = await Promise.all([
        readContract.hasVoted(activeAddress),
        readContract.registeredVoters(activeAddress),
      ])

      if (votedState) {
        setHasVoted(true)
        setToast({ type: 'error', message: 'Ai votat deja.' })
        return
      }

      if (!registeredState) {
        setIsRegistered(false)
        setToast({ type: 'error', message: 'Nu esti inregistrat ca votant.' })
        return
      }

      const contract = await getContract()
      const transaction = await contract.vote(candidateToVote.id)

      setTxPhase('mining')
      await transaction.wait()

      setToast({ type: 'success', message: 'Votul a fost inregistrat cu succes.' })
      await refreshVotingData(activeAddress)
      setHasVoted(true)
    } catch (voteError) {
      const message = parseContractError(voteError)
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setTxPhase('idle')
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
              onClick={handleSwitchNetwork}
              disabled={connecting || txPending}
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

      <section className="panel-card vote-page-panel">
        <div className="section-heading-row">
          <h2>Available Candidates</h2>
          <VoteStatus isOpen={votingOpen} />
        </div>

        <div className="wallet-connect-row">
          <div>
            <p className="panel-label">Wallet</p>
            <p className="mono-value vote-selection-display">
              {walletAddress ? shortenAddress(walletAddress) : 'Not connected'}
            </p>
          </div>

          {!walletAddress && hasMetaMask ? (
            <button
              className="terminal-button"
              type="button"
              onClick={handleConnectWallet}
              disabled={connecting || txPending}
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : null}
        </div>

        {walletAddress && !isRegistered ? (
          <p className="panel-subtle tx-copy-error">Nu esti inregistrat ca votant.</p>
        ) : null}

        {walletAddress && hasVoted ? (
          <p className="panel-subtle tx-copy-warning">Ai votat deja.</p>
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
                isLocked={votingLocked}
                showCheckmark={hasVoted && selectedCandidateId === candidate.id}
                onSelect={(id) => setSelectedCandidateId(id)}
              />
            ))}
          </div>
        )}

        {txPending ? (
          <div className="tx-pending-row" role="status" aria-live="polite">
            <span className="tx-spinner" aria-hidden="true" />
            <p className="panel-subtle">
              {txPhase === 'wallet'
                ? 'Confirm transaction in MetaMask...'
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
            {hasVoted
              ? 'Already Voted'
              : txPhase === 'wallet'
                ? 'Confirm in MetaMask...'
                : txPhase === 'mining'
                  ? 'Transaction Pending...'
                  : 'Cast Vote'}
          </button>
        </div>
      </section>
    </section>
  )
}
