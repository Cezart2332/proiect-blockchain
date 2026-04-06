import { useState } from 'react'
import { useElection } from '../context/ElectionContext'
import { shortenAddress } from '../utils/format'
import ElectionStateBadge from './ElectionStateBadge.tsx'

export default function TopNavbar() {
  const {
    currentState,
    connectedAddress,
    hasMetaMask,
    wrongNetwork,
    connectWalletAction,
    switchNetworkAction,
  } = useElection()

  const [busy, setBusy] = useState(false)

  const handleConnect = async () => {
    setBusy(true)

    try {
      await connectWalletAction()
    } finally {
      setBusy(false)
    }
  }

  const handleSwitchNetwork = async () => {
    setBusy(true)

    try {
      await switchNetworkAction()
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
        <ElectionStateBadge state={currentState} compact />

        {!hasMetaMask ? (
          <span className="wallet-pill mono-value">Please install MetaMask</span>
        ) : connectedAddress ? (
          <span className="wallet-pill mono-value">{shortenAddress(connectedAddress)}</span>
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
