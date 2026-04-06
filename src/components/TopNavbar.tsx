import { useEffect, useState } from 'react'
import {
  checkNetwork,
  connectWallet,
  getConnectedAddress,
  getReadContract,
  isMetaMaskInstalled,
  isSepoliaNetwork,
} from '../hooks/useContract.js'
import { shortenAddress } from '../utils/format'
import VoteStatus from './VoteStatus.tsx'

export default function TopNavbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isVotingOpen, setIsVotingOpen] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(true)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const loadNavbarData = async () => {
      try {
        const contract = getReadContract()
        const votingState = await contract.votingOpen()
        setIsVotingOpen(Boolean(votingState))
      } catch {
        setIsVotingOpen(false)
      }

      const hasWallet = isMetaMaskInstalled()
      setHasMetaMask(hasWallet)

      if (!hasWallet) {
        return
      }

      try {
        const [address, onSepolia] = await Promise.all([
          getConnectedAddress(),
          isSepoliaNetwork(),
        ])

        setWalletAddress(address)
        setWrongNetwork(!onSepolia)
      } catch {
        setWalletAddress(null)
        setWrongNetwork(false)
      }
    }

    void loadNavbarData()
  }, [])

  const handleConnect = async () => {
    setBusy(true)

    try {
      const address = await connectWallet()
      setWalletAddress(address)
      setWrongNetwork(!(await isSepoliaNetwork()))
    } catch {
      setWalletAddress(null)
    } finally {
      setBusy(false)
    }
  }

  const handleSwitchNetwork = async () => {
    setBusy(true)

    try {
      const switched = await checkNetwork()
      setWrongNetwork(!switched)
    } catch {
      setWrongNetwork(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <header className="top-navbar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">
          []
        </div>
        <div>
          <p className="brand-title">VOTE TERMINAL</p>
          <p className="brand-subtitle">Decentralized Governance Control</p>
        </div>
      </div>

      <div className="top-navbar-meta">
        <VoteStatus isOpen={isVotingOpen} compact />

        {!hasMetaMask ? (
          <span className="wallet-pill mono-value">Please install MetaMask</span>
        ) : walletAddress ? (
          <span className="wallet-pill mono-value">{shortenAddress(walletAddress)}</span>
        ) : (
          <button
            className="top-wallet-button mono-value"
            type="button"
            onClick={handleConnect}
            disabled={busy}
          >
            {busy ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}

        {hasMetaMask && wrongNetwork ? (
          <button
            className="top-wallet-button mono-value"
            type="button"
            onClick={handleSwitchNetwork}
            disabled={busy}
          >
            Switch to Sepolia
          </button>
        ) : null}
      </div>
    </header>
  )
}
