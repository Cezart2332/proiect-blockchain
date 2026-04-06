import type { ReactNode } from 'react'

interface AdminGuardProps {
  isOwner: boolean
  children: ReactNode
}

export default function AdminGuard({ isOwner, children }: AdminGuardProps) {
  if (isOwner) {
    return <>{children}</>
  }

  return (
    <div className="admin-guard-block">
      <div className="panel-card access-restricted">
        <p className="panel-label">Owner Permissions Required</p>
        <h2>Access Restricted</h2>
        <p className="panel-subtle">
          Only the contract owner can manage candidates, voter registration, or voting state.
        </p>
      </div>
    </div>
  )
}
