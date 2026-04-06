import { NavLink } from 'react-router-dom'
import { navigationItems } from '../navigation'

export default function SideNavigation() {
  return (
    <aside className="side-navigation" aria-label="Primary">
      <nav className="side-navigation-list">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `side-navigation-link ${isActive ? 'is-active' : ''}`
            }
          >
            <span className="side-navigation-short mono-value">{item.short}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
