import { currentUser, votingOpen } from '../mockData.js'
import VoteStatus from './VoteStatus.tsx'

export default function TopNavbar() {
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
        <VoteStatus isOpen={votingOpen} compact />
        <span className="wallet-pill mono-value">{currentUser.address}</span>
      </div>
    </header>
  )
}
