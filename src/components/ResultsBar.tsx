import { useEffect, useMemo, useState } from 'react'
import type { Candidate } from '../types'

interface ResultsBarProps {
  candidates: Candidate[]
}

export default function ResultsBar({ candidates }: ResultsBarProps) {
  const [animate, setAnimate] = useState(false)

  const totalVotes = useMemo(
    () => candidates.reduce((total, candidate) => total + candidate.voteCount, 0),
    [candidates],
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAnimate(true)
    }, 120)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [candidates])

  return (
    <div className="results-bar-list">
      {candidates.map((candidate) => {
        const percentage = totalVotes === 0 ? 0 : (candidate.voteCount / totalVotes) * 100

        return (
          <div className="results-bar-row" key={candidate.id}>
            <div className="results-bar-meta">
              <p className="results-bar-name">{candidate.name}</p>
              <p className="mono-value">{candidate.voteCount} votes</p>
            </div>

            <div className="results-bar-track" role="img" aria-label={`${candidate.name} ${percentage.toFixed(1)} percent`}>
              <span
                className="results-bar-fill"
                style={{ width: animate ? `${percentage}%` : '0%' }}
              />
            </div>

            <p className="results-bar-percentage mono-value">{percentage.toFixed(1)}%</p>
          </div>
        )
      })}
    </div>
  )
}
