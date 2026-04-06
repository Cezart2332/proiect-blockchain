import { useState } from 'react'
import AdminGuard from '../components/AdminGuard.tsx'
import VoteStatus from '../components/VoteStatus.tsx'
import { currentUser, votingOpen } from '../mockData.js'

export default function AdminPage() {
  const [candidateName, setCandidateName] = useState('')
  const [voterAddress, setVoterAddress] = useState('')
  const [isVotingOpen, setIsVotingOpen] = useState(votingOpen)

  const isOwner = currentUser.isOwner

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

      <AdminGuard isOwner={isOwner}>
        <div className="admin-grid">
          <form className="panel-card admin-card" onSubmit={(event) => event.preventDefault()}>
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
              disabled={!isOwner}
            />

            <button className="terminal-button" type="submit" disabled={!isOwner}>
              {!isOwner ? (
                <span className="inline-lock" aria-hidden="true">
                  &#128274;
                </span>
              ) : null}
              Add Candidate
            </button>
          </form>

          <form className="panel-card admin-card" onSubmit={(event) => event.preventDefault()}>
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
              disabled={!isOwner}
            />

            <button className="terminal-button" type="submit" disabled={!isOwner}>
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
              disabled={!isOwner}
              onClick={() => setIsVotingOpen((value) => !value)}
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
