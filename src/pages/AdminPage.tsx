import { isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import AdminGuard from '../components/AdminGuard.tsx'
import VoteStatus from '../components/VoteStatus.tsx'
import {
  checkNetwork,
  connectWallet,
  getConnectedAddress,
  getContract,
  getReadContract,
  isMetaMaskInstalled,
  isSepoliaNetwork,
  parseContractError,
} from '../hooks/useContract.js'
import { shortenAddress } from '../utils/format'

interface ToastState {
  type: 'success' | 'error'
  message: string
}

type TransactionPhase = 'idle' | 'wallet' | 'mining'

export default function AdminPage() {
  const [candidateName, setCandidateName] = useState('')
  const [voterAddress, setVoterAddress] = useState('')
  const [isVotingOpen, setIsVotingOpen] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null)
  const [hasMetaMask, setHasMetaMask] = useState(true)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [txPhase, setTxPhase] = useState<TransactionPhase>('idle')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const txPending = txPhase !== 'idle'

  const isOwner = useMemo(() => {
    if (!walletAddress || !ownerAddress) {
      return false
    }

    return walletAddress.toLowerCase() === ownerAddress.toLowerCase()
  }, [ownerAddress, walletAddress])

  const refreshAdminData = useCallback(async (addressFromAction?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      const contract = getReadContract()
      const [owner, votingStatus] = await Promise.all([
        contract.owner(),
        contract.votingOpen(),
      ])

      setOwnerAddress(String(owner))
      setIsVotingOpen(Boolean(votingStatus))

      const walletInstalled = isMetaMaskInstalled()
      setHasMetaMask(walletInstalled)

      if (!walletInstalled) {
        setWalletAddress(null)
        setWrongNetwork(false)
        return
      }

      const activeAddress = addressFromAction ?? (await getConnectedAddress())
      setWalletAddress(activeAddress)
      setWrongNetwork(!(await isSepoliaNetwork()))
    } catch (fetchError) {
      setError(parseContractError(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshAdminData()
  }, [refreshAdminData])

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

  const handleConnectWallet = async () => {
    setConnecting(true)
    setError(null)

    try {
      const address = await connectWallet()

      if (!address) {
        throw new Error('Conectarea la wallet a esuat.')
      }

      setToast({ type: 'success', message: 'Wallet conectat cu succes.' })
      await refreshAdminData(address)
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

  const submitAddCandidate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const name = candidateName.trim()
    if (!name) {
      setToast({ type: 'error', message: 'Introdu numele candidatului.' })
      return
    }

    try {
      setError(null)
      setTxPhase('wallet')

      const activeAddress = walletAddress ?? (await connectWallet())
      if (!activeAddress) {
        throw new Error('Conecteaza wallet-ul pentru a continua.')
      }

      setWalletAddress(activeAddress)

      const onSepolia = await checkNetwork()
      if (!onSepolia) {
        setWrongNetwork(true)
        setToast({ type: 'error', message: 'Schimba reteaua pe Sepolia.' })
        return
      }

      setWrongNetwork(false)

      const contract = await getContract()
      const transaction = await contract.addCandidate(name)

      setTxPhase('mining')
      await transaction.wait()

      setCandidateName('')
      setToast({ type: 'success', message: 'Candidatul a fost adaugat.' })
      await refreshAdminData(activeAddress)
    } catch (submitError) {
      const message = parseContractError(submitError)
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setTxPhase('idle')
    }
  }

  const submitRegisterVoter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const address = voterAddress.trim()
    if (!isAddress(address)) {
      setToast({ type: 'error', message: 'Adresa introdusa nu este valida.' })
      return
    }

    try {
      setError(null)
      setTxPhase('wallet')

      const activeAddress = walletAddress ?? (await connectWallet())
      if (!activeAddress) {
        throw new Error('Conecteaza wallet-ul pentru a continua.')
      }

      setWalletAddress(activeAddress)

      const onSepolia = await checkNetwork()
      if (!onSepolia) {
        setWrongNetwork(true)
        setToast({ type: 'error', message: 'Schimba reteaua pe Sepolia.' })
        return
      }

      setWrongNetwork(false)

      const contract = await getContract()
      const transaction = await contract.registerVoter(address)

      setTxPhase('mining')
      await transaction.wait()

      setVoterAddress('')
      setToast({ type: 'success', message: 'Votantul a fost inregistrat.' })
      await refreshAdminData(activeAddress)
    } catch (submitError) {
      const message = parseContractError(submitError)
      setError(message)
      setToast({ type: 'error', message })
    } finally {
      setTxPhase('idle')
    }
  }

  const toggleVotingState = async () => {
    const nextState = !isVotingOpen

    try {
      setError(null)
      setTxPhase('wallet')

      const activeAddress = walletAddress ?? (await connectWallet())
      if (!activeAddress) {
        throw new Error('Conecteaza wallet-ul pentru a continua.')
      }

      setWalletAddress(activeAddress)

      const onSepolia = await checkNetwork()
      if (!onSepolia) {
        setWrongNetwork(true)
        setToast({ type: 'error', message: 'Schimba reteaua pe Sepolia.' })
        return
      }

      setWrongNetwork(false)

      const contract = await getContract()
      const transaction = await contract.setVotingStatus(nextState)

      setTxPhase('mining')
      await transaction.wait()

      setIsVotingOpen(nextState)
      setToast({
        type: 'success',
        message: nextState ? 'Votarea a fost deschisa.' : 'Votarea a fost inchisa.',
      })
      await refreshAdminData(activeAddress)
    } catch (toggleError) {
      const message = parseContractError(toggleError)
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
          <p className="page-kicker mono-value">/ admin</p>
          <h1>Election Administration</h1>
          <p className="page-description">
            Manage candidates, register voters, and control voting lifecycle operations.
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
          <p className="panel-label">Admin Error</p>
          <p className="panel-subtle">{error}</p>
        </div>
      ) : null}

      <section className="panel-card wallet-connect-row">
        <div>
          <p className="panel-label">Connected Wallet</p>
          <p className="mono-value vote-selection-display">
            {walletAddress ? shortenAddress(walletAddress) : 'Not connected'}
          </p>
          <p className="panel-subtle">
            Contract owner: {ownerAddress ? shortenAddress(ownerAddress) : loading ? 'Loading...' : 'N/A'}
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
      </section>

      {txPending ? (
        <div className="panel-card tx-pending-row" role="status" aria-live="polite">
          <span className="tx-spinner" aria-hidden="true" />
          <p className="panel-subtle">
            {txPhase === 'wallet'
              ? 'Confirm transaction in MetaMask...'
              : 'Transaction pending on Sepolia. Waiting for confirmation...'}
          </p>
        </div>
      ) : null}

      <AdminGuard isOwner={isOwner}>
        <div className="admin-grid">
          <form className="panel-card admin-card" onSubmit={(event) => void submitAddCandidate(event)}>
            <div className="admin-card-heading">
              <h2>Add Candidate</h2>
              {!isOwner ? (
                <span className="lock-pill" aria-hidden="true">
                  &#128274; LOCKED
                </span>
              ) : null}
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
              disabled={!isOwner || txPending || loading}
            />

            <button
              className="terminal-button"
              type="submit"
              disabled={!isOwner || txPending || loading || wrongNetwork || !hasMetaMask}
            >
              {!isOwner ? (
                <span className="inline-lock" aria-hidden="true">
                  &#128274;
                </span>
              ) : null}
              Add Candidate
            </button>
          </form>

          <form
            className="panel-card admin-card"
            onSubmit={(event) => void submitRegisterVoter(event)}
          >
            <div className="admin-card-heading">
              <h2>Register Voter</h2>
              {!isOwner ? (
                <span className="lock-pill" aria-hidden="true">
                  &#128274; LOCKED
                </span>
              ) : null}
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
              disabled={!isOwner || txPending || loading}
            />

            <button
              className="terminal-button"
              type="submit"
              disabled={!isOwner || txPending || loading || wrongNetwork || !hasMetaMask}
            >
              {!isOwner ? (
                <span className="inline-lock" aria-hidden="true">
                  &#128274;
                </span>
              ) : null}
              Register Voter
            </button>
          </form>

          <section className="panel-card admin-card">
            <div className="admin-card-heading">
              <h2>Voting State</h2>
              {!isOwner ? (
                <span className="lock-pill" aria-hidden="true">
                  &#128274; LOCKED
                </span>
              ) : null}
            </div>

            <VoteStatus isOpen={isVotingOpen} />

            <button
              className="terminal-button"
              type="button"
              disabled={!isOwner || txPending || loading || wrongNetwork || !hasMetaMask}
              onClick={() => void toggleVotingState()}
            >
              {!isOwner ? (
                <span className="inline-lock" aria-hidden="true">
                  &#128274;
                </span>
              ) : null}
              {isVotingOpen ? 'Close Voting' : 'Open Voting'}
            </button>
          </section>
        </div>
      </AdminGuard>
    </section>
  )
}
