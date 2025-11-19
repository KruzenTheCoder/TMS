import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import InvitationCard from './pages/InvitationCard'
const RegistrationForm = lazy(() => import('./pages/RegistrationForm'))
const TicketPage = lazy(() => import('./pages/TicketPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const BarcodeScanner = lazy(() => import('./pages/BarcodeScanner'))

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
          </div>
        </div>
      </div>
    </motion.nav>
  )
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
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/scanner" element={<BarcodeScanner />} />
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
