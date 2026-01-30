import { NavLink } from 'react-router-dom'
import { CloudRain, LayoutDashboard, Map, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebarStore } from '../../store/sidebarStore'

const navigation = [
  { name: 'Dashboard', to: '/app', icon: LayoutDashboard },
  { name: 'Storm Map', to: '/app/storms', icon: Map },
  { name: 'Leads', to: '/app/leads', icon: Users },
  { name: 'Settings', to: '/app/settings', icon: Settings },
]

export default function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()

  return (
    <aside 
      className={`
        ${collapsed ? 'w-16' : 'w-64'} 
        bg-white border-r border-gray-200 flex flex-col 
        transition-all duration-200 ease-in-out
        relative
      `}
      aria-label="Main navigation"
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-20 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-500" aria-hidden="true" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-500" aria-hidden="true" />
        )}
      </button>

      {/* Logo Section */}
      <div className={`${collapsed ? 'p-3' : 'p-6'} border-b border-gray-200`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">HailStorm Pro</h1>
              <p className="text-xs text-gray-500">Lead Generation</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'p-2' : 'p-4'} space-y-1`} aria-label="Primary">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            end={item.to === '/app'}
            title={collapsed ? item.name : undefined}
            aria-label={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                {isActive && <span className="sr-only">(current page)</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade Section */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} border-t border-gray-200`}>
        {collapsed ? (
          <button 
            className="w-full aspect-square bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
            aria-label="Upgrade to Pro plan"
            title="Upgrade to Pro"
          >
            <span className="text-xs font-bold" aria-hidden="true">PRO</span>
          </button>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4" role="region" aria-label="Subscription status">
            <p className="text-sm font-medium text-blue-900">Free Tier</p>
            <p className="text-xs text-blue-700 mt-1">50 leads remaining this month</p>
            <button 
              className="mt-3 w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition"
              aria-label="Upgrade to Pro plan for unlimited leads"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
