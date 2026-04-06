export const candidates = [
  { id: 1, name: 'Alice', voteCount: 42 },
  { id: 2, name: 'Bob', voteCount: 28 },
  { id: 3, name: 'Carol', voteCount: 15 },
]

export const totalVoters = 120
export const votingOpen = true
export const currentUser = {
  address: '0x1234...abcd',
  isOwner: true,
  hasVoted: false,
}

const votesCast = candidates.reduce((total, candidate) => total + candidate.voteCount, 0)

export const dashboardStats = [
  {
    id: 'registered-voters',
    label: 'Registered Voters',
    value: totalVoters,
    decimals: 0,
    delta: 'Voter registry finalized',
  },
  {
    id: 'candidates',
    label: 'Candidates',
    value: candidates.length,
    decimals: 0,
    delta: 'Ballot positions published',
  },
  {
    id: 'votes-cast',
    label: 'Votes Cast',
    value: votesCast,
    decimals: 0,
    delta: `${Math.round((votesCast / totalVoters) * 100)}% turnout`,
  },
]
