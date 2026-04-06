export interface Candidate {
  id: number
  name: string
  voteCount: number
}

export type ElectionState = 'PREPARATION' | 'OPEN' | 'CLOSED'

export interface CurrentUser {
  address: string
  isOwner: boolean
  hasVoted: boolean
}

export interface StatMetric {
  id: string
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  delta?: string
}
