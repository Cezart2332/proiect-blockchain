/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
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
import type { Candidate, ElectionState } from '../types'

interface WinnerData {
  name: string
  voteCount: number
}

interface ElectionToast {
  type: 'success' | 'error'
  message: string
}

type TransactionStep = 'idle' | 'wallet' | 'confirming'

interface ElectionContextValue {
  loading: boolean
  error: string | null
  currentState: ElectionState
  candidates: Candidate[]
  totalCandidates: number
  totalVotes: number
  totalVoters: number
  connectedAddress: string | null
  isOwner: boolean
  isRegistered: boolean
  hasVoted: boolean
  hasMetaMask: boolean
  wrongNetwork: boolean
  winner: WinnerData | null
  txStep: TransactionStep
  txPending: boolean
  toast: ElectionToast | null
  refreshData: (addressOverride?: string | null) => Promise<void>
  clearToast: () => void
  connectWalletAction: () => Promise<void>
  switchNetworkAction: () => Promise<void>
  addCandidate: (name: string) => Promise<boolean>
  registerVoter: (address: string) => Promise<boolean>
  openElection: () => Promise<boolean>
  closeElection: () => Promise<boolean>
  resetElection: () => Promise<boolean>
  vote: (candidateId: number) => Promise<boolean>
}

const ElectionContext = createContext<ElectionContextValue | undefined>(undefined)

function normalizeElectionState(rawState: unknown): ElectionState {
  const normalized = String(rawState).toUpperCase()

  if (normalized === 'OPEN' || normalized === 'CLOSED' || normalized === 'PREPARATION') {
    return normalized
  }

  return 'PREPARATION'
}

export function ElectionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentState, setCurrentState] = useState<ElectionState>('PREPARATION')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [totalVotes, setTotalVotes] = useState(0)
  const [totalVoters, setTotalVoters] = useState(0)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(true)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [winner, setWinner] = useState<WinnerData | null>(null)
  const [txStep, setTxStep] = useState<TransactionStep>('idle')
  const [toast, setToast] = useState<ElectionToast | null>(null)

  const txPending = txStep !== 'idle'

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  const refreshData = useCallback(async (addressOverride?: string | null) => {
    setLoading(true)
    setError(null)

    try {
      const contract = getReadContract()

      const [
        stateRaw,
        candidateCountRaw,
        totalVotesRaw,
        totalVotersRaw,
        ownerAddressRaw,
        fetchedCandidates,
      ] = await Promise.all([
        contract.getCurrentState(),
        contract.candidatesCount(),
        contract.getTotalVotes(),
        contract.getVotersCount(),
        contract.owner(),
        fetchCandidates(contract),
      ])

      const nextState = normalizeElectionState(stateRaw)
      const nextCandidates = fetchedCandidates
      const nextTotalCandidates = Number(candidateCountRaw)
      const nextTotalVotes = Number(totalVotesRaw)
      const nextTotalVoters = Number(totalVotersRaw)
      const ownerAddress = String(ownerAddressRaw)

      let nextWinner: WinnerData | null = null
      if (nextState === 'CLOSED' && nextTotalCandidates > 0) {
        try {
          const winnerResult = await contract.getWinner()
          const winnerName = Array.isArray(winnerResult)
            ? winnerResult[0]
            : winnerResult.winnerName

          const winnerVotesRaw = Array.isArray(winnerResult)
            ? winnerResult[1]
            : winnerResult.winnerVotes

          nextWinner = {
            name: String(winnerName),
            voteCount: Number(winnerVotesRaw),
          }
        } catch {
          nextWinner = null
        }
      }

      const walletInstalled = isMetaMaskInstalled()
      setHasMetaMask(walletInstalled)

      let nextAddress: string | null = null
      let nextWrongNetwork = false

      if (walletInstalled) {
        nextAddress = addressOverride ?? (await getConnectedAddress())
        nextWrongNetwork = !(await isSepoliaNetwork())
      }

      let nextIsOwner = false
      let nextIsRegistered = false
      let nextHasVoted = false

      if (nextAddress) {
        nextIsOwner = nextAddress.toLowerCase() === ownerAddress.toLowerCase()

        const [registeredState, votedState] = await Promise.all([
          contract.registeredVoters(nextAddress),
          contract.hasVoted(nextAddress),
        ])

        nextIsRegistered = Boolean(registeredState)
        nextHasVoted = Boolean(votedState)
      }

      setCurrentState(nextState)
      setCandidates(nextCandidates)
      setTotalCandidates(nextTotalCandidates)
      setTotalVotes(nextTotalVotes)
      setTotalVoters(nextTotalVoters)
      setConnectedAddress(nextAddress)
      setIsOwner(nextIsOwner)
      setIsRegistered(nextIsRegistered)
      setHasVoted(nextHasVoted)
      setWrongNetwork(nextWrongNetwork)
      setWinner(nextWinner)
    } catch (refreshError) {
      setError(parseContractError(refreshError))
    } finally {
      setLoading(false)
    }
  }, [])

  const connectWalletAction = useCallback(async () => {
    setError(null)

    try {
      const address = await connectWallet()
      await refreshData(address)
    } catch (walletError) {
      const message = parseContractError(walletError)
      setError(message)
      setToast({ type: 'error', message })
    }
  }, [refreshData])

  const switchNetworkAction = useCallback(async () => {
    setError(null)

    try {
      const switched = await checkNetwork()
      setWrongNetwork(!switched)

      if (switched) {
        await refreshData()
      }
    } catch (networkError) {
      const message = parseContractError(networkError)
      setError(message)
      setToast({ type: 'error', message })
    }
  }, [refreshData])

  const executeWriteTransaction = useCallback(
    async (writer: (contract: Awaited<ReturnType<typeof getContract>>) => Promise<{ wait: () => Promise<unknown> }>) => {
      setError(null)

      try {
        setTxStep('wallet')

        let activeAddress = connectedAddress

        if (!activeAddress) {
          activeAddress = await connectWallet()
          setConnectedAddress(activeAddress)
        }

        const onSepolia = await checkNetwork()
        setWrongNetwork(!onSepolia)

        if (!onSepolia) {
          throw new Error('Please switch to Sepolia')
        }

        const contract = await getContract()
        const tx = await writer(contract)

        setTxStep('confirming')
        await tx.wait()

        setToast({ type: 'success', message: 'Transaction confirmed ✅' })
        await refreshData(activeAddress)

        return true
      } catch (txError) {
        const message = parseContractError(txError)
        setError(message)
        setToast({ type: 'error', message })
        return false
      } finally {
        setTxStep('idle')
      }
    },
    [connectedAddress, refreshData],
  )

  const addCandidate = useCallback(
    async (name: string) => executeWriteTransaction((contract) => contract.addCandidate(name)),
    [executeWriteTransaction],
  )

  const registerVoter = useCallback(
    async (address: string) =>
      executeWriteTransaction((contract) => contract.registerVoter(address)),
    [executeWriteTransaction],
  )

  const openElection = useCallback(
    async () => executeWriteTransaction((contract) => contract.openElection()),
    [executeWriteTransaction],
  )

  const closeElection = useCallback(
    async () => executeWriteTransaction((contract) => contract.closeElection()),
    [executeWriteTransaction],
  )

  const resetElection = useCallback(
    async () => executeWriteTransaction((contract) => contract.resetElection()),
    [executeWriteTransaction],
  )

  const vote = useCallback(
    async (candidateId: number) =>
      executeWriteTransaction((contract) => contract.vote(candidateId)),
    [executeWriteTransaction],
  )

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 3500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toast])

  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      return undefined
    }

    const ethereum = (window as Window & { ethereum?: { on?: (event: string, callback: () => void) => void; removeListener?: (event: string, callback: () => void) => void } }).ethereum

    if (!ethereum?.on) {
      return undefined
    }

    const handleWalletChange = () => {
      void refreshData()
    }

    ethereum.on('accountsChanged', handleWalletChange)
    ethereum.on('chainChanged', handleWalletChange)

    return () => {
      ethereum.removeListener?.('accountsChanged', handleWalletChange)
      ethereum.removeListener?.('chainChanged', handleWalletChange)
    }
  }, [refreshData])

  const value = useMemo<ElectionContextValue>(
    () => ({
      loading,
      error,
      currentState,
      candidates,
      totalCandidates,
      totalVotes,
      totalVoters,
      connectedAddress,
      isOwner,
      isRegistered,
      hasVoted,
      hasMetaMask,
      wrongNetwork,
      winner,
      txStep,
      txPending,
      toast,
      refreshData,
      clearToast,
      connectWalletAction,
      switchNetworkAction,
      addCandidate,
      registerVoter,
      openElection,
      closeElection,
      resetElection,
      vote,
    }),
    [
      loading,
      error,
      currentState,
      candidates,
      totalCandidates,
      totalVotes,
      totalVoters,
      connectedAddress,
      isOwner,
      isRegistered,
      hasVoted,
      hasMetaMask,
      wrongNetwork,
      winner,
      txStep,
      txPending,
      toast,
      refreshData,
      clearToast,
      connectWalletAction,
      switchNetworkAction,
      addCandidate,
      registerVoter,
      openElection,
      closeElection,
      resetElection,
      vote,
    ],
  )

  return <ElectionContext.Provider value={value}>{children}</ElectionContext.Provider>
}

export function useElection() {
  const context = useContext(ElectionContext)

  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider')
  }

  return context
}
