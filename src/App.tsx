import { BrowserRouter, Routes, Route } from 'react-router-dom'
// TODO: Re-enable after testing: import { Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import StormsPage from './pages/StormsPage'
import LeadsPage from './pages/LeadsPage'
import PropertiesPage from './pages/PropertiesPage'
import SettingsPage from './pages/SettingsPage'
// TODO: Re-enable after testing: import { useAuthStore } from './store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

// TODO: Re-enable auth check after testing. Original:
// function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const user = useAuthStore((state) => state.user)
//   return user ? <>{children}</> : <Navigate to="/login" />
// }
function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="storms" element={<StormsPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertiesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
