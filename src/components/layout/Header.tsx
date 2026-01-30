import { useAuthStore } from '../../store/authStore'
import { Bell, User, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/login')
    } catch (error: any) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4" role="banner">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Welcome back!</p>
        </div>

        <nav className="flex items-center gap-4" aria-label="User navigation">
          <button 
            className="p-2 hover:bg-gray-100 rounded-lg transition relative"
            aria-label="View notifications (1 unread)"
            aria-haspopup="true"
          >
            <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
            <span 
              className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
            
            <div className="flex items-center gap-2" role="group" aria-label="User account actions">
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="View user profile"
                aria-haspopup="true"
              >
                <User className="w-5 h-5 text-gray-600" aria-hidden="true" />
              </button>
              
              <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-red-50 rounded-lg transition"
                aria-label="Sign out of your account"
                title="Sign out"
              >
                <LogOut className="w-5 h-5 text-red-600" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
