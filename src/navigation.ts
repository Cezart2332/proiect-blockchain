export interface NavigationItem {
  to: string
  label: string
  short: string
}

export const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Dashboard', short: 'DB' },
  { to: '/vote', label: 'Vote', short: 'VT' },
  { to: '/candidates', label: 'Candidates', short: 'CD' },
  { to: '/admin', label: 'Admin', short: 'AD' },
]
