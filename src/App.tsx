import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import InvitationCard from './pages/InvitationCard'
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'))
const TicketPage = lazy(() => import('./pages/TicketPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const BarcodeScanner = lazy(() => import('./pages/BarcodeScanner'))
const StaffRegister = lazy(() => import('./pages/StaffRegister'))
const StaffTicketPage = lazy(() => import('./pages/StaffTicketPage'))
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123'

const Navigation = () => {
  const location = useLocation()
  
  // Hide navigation on invitation page for full luxury experience
  if (location.pathname === '/') {
    return null
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-lg sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 flex-wrap gap-2">
          <Link to="/" className="text-lg sm:text-xl font-bold text-slate-900">
            TMSS Farewell 2025
          </Link>
          <div className="flex space-x-4 sm:space-x-6 mt-2 sm:mt-0">
            <Link
              to="/admin"
              className="text-slate-600 hover:text-yellow-600 font-medium transition-colors"
            >
              Admin
            </Link>
            <Link
              to="/admin/scanner"
              className="text-slate-600 hover:text-yellow-600 font-medium transition-colors"
            >
              Scanner
            </Link>
            <Link
              to="/staff/register"
              className="text-slate-600 hover:text-yellow-600 font-medium transition-colors"
            >
              Staff
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

const PasswordPrompt = ({ title, onSuccess }: { title: string; onSuccess: () => void }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASS) {
      sessionStorage.setItem('tmss_admin_auth', '1')
      onSuccess()
    } else {
      setError('Incorrect password')
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-yellow-400 p-6">
        <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-600 mb-4">Enter admin password to continue</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none"
            required
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-bold uppercase tracking-wider">
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

const ProtectedAdmin = () => {
  const [authed, setAuthed] = useState(sessionStorage.getItem('tmss_admin_auth') === '1')
  if (authed) return <AdminDashboard />
  return <PasswordPrompt title="Admin" onSuccess={() => setAuthed(true)} />
}

const ProtectedScanner = () => {
  const [authed, setAuthed] = useState(sessionStorage.getItem('tmss_admin_auth') === '1')
  if (authed) return <BarcodeScanner />
  return <PasswordPrompt title="Scanner" onSuccess={() => setAuthed(true)} />
}

const ProtectedStaff = () => {
  const [authed, setAuthed] = useState(sessionStorage.getItem('tmss_admin_auth') === '1')
  if (authed) return <StaffRegister />
  return <PasswordPrompt title="Staff Register" onSuccess={() => setAuthed(true)} />
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="text-center py-10 text-slate-700">Loading...</div>}>
            <Routes>
              <Route path="/" element={<InvitationCard />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/ticket/:id" element={<TicketPage />} />
              <Route path="/admin" element={<ProtectedAdmin />} />
              <Route path="/admin/scanner" element={<ProtectedScanner />} />
              <Route path="/staff/register" element={<ProtectedStaff />} />
              <Route path="/staff/ticket/:barcode" element={<StaffTicketPage />} />
            </Routes>
          </Suspense>
        </AnimatePresence>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#ffffff',
              border: '1px solid #fbbf24',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
