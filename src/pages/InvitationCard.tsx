import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'

const InvitationCard = () => {
  const navigate = useNavigate()
  const appName = import.meta.env.VITE_APP_NAME || 'TMSS Matric Farewell 2025'
  const eventDate = import.meta.env.VITE_EVENT_DATE || '2025-11-27'
  const eventTime = import.meta.env.VITE_EVENT_TIME || '11:00 - 17:00'
  const eventVenue = import.meta.env.VITE_EVENT_VENUE || 'Havenpark Secondary School'
  const dressCode = import.meta.env.VITE_DRESS_CODE || 'Smart Casual'
  const logoUrl = (import.meta.env.VITE_LOGO_URL as string) || 'https://i.ibb.co/JW0Y9m3m/image-removebg-preview.png'

  const d = new Date(eventDate)
  const monthName = d.toLocaleString('en-US', { month: 'long' })
  const dayName = d.toLocaleString('en-US', { weekday: 'long' })
  const dayNum = String(d.getDate()).padStart(2, '0')
  const yearNum = d.getFullYear()

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full opacity-10 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-24 h-24 bg-yellow-300 rounded-full opacity-15 blur-lg"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [-20, 20, -20],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-500 rounded-full opacity-10 blur-md"
          animate={{
            y: [-30, 30, -30],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center h-[100dvh] px-2 py-2">
        <div className="w-full max-w-sm max-h-[86dvh] sm:max-h-[90vh] mx-auto">
          <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-700 p-[3px] rounded-3xl shadow-[0_25px_50px_rgba(255,215,0,0.25)]">
            <div className="relative h-full rounded-3xl bg-gradient-to-br from-[#0b1430] via-[#101a3f] to-[#162253] overflow-hidden">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 1.2 }} className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 -left-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-40 -right-24 w-80 h-80 bg-yellow-500/10 rounded-full blur-2xl"></div>
              </motion.div>
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                  initial={{ x: '-50%' }}
                  animate={{ x: '50%' }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute top-0 left-0 h-full w-[150%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12"
                />
              </div>
              <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="relative z-10 w-full h-full p-3 sm:p-5 scale-[0.95] sm:scale-100 origin-center">
                <div className="w-full max-w-sm mx-auto">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-center mb-3 sm:mb-4">
                    <div className="mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                      <img src={logoUrl} alt="School Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-2xl" />
                    </div>
                    <h3 className="text-yellow-400 text-base sm:text-lg font-serif tracking-wider">TRENANCE MANOR</h3>
                    <p className="text-yellow-300 text-[10px] sm:text-xs">SECONDARY SCHOOL</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="text-center mb-2 sm:mb-3">
                    <p className="text-white text-xs sm:text-sm uppercase tracking-widest mb-1">Dear Learners,</p>
                    <p className="text-yellow-400 text-xs sm:text-sm uppercase tracking-wider">{appName}</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, duration: 1 }} className="text-center mb-3 sm:mb-5">
                    <h1 className="text-xl sm:text-3xl font-serif text-white mb-1 leading-tight">Grade 12 Farewell</h1>
                    <h2 className="text-xl sm:text-3xl font-serif text-yellow-400 leading-tight">Celebration 2025</h2>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8 }} className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                    <div className="text-center">
                      <p className="text-yellow-400 text-base uppercase tracking-wider mb-1">{monthName}</p>
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-1 h-10 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
                        <div>
                          <p className="text-white text-xs uppercase tracking-wider">{dayName}</p>
                          <p className="text-yellow-400 text-4xl sm:text-6xl font-serif font-bold">{dayNum}</p>
                        </div>
                        <div className="w-1 h-10 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
                      </div>
                      <p className="text-white text-xs sm:text-sm mt-1">{eventTime}</p>
                      <p className="text-yellow-300 text-sm sm:text-base mt-1">{yearNum}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                      <MapPin className="w-5 h-5 text-yellow-400 mb-1 sm:mb-0" />
                      <span className="text-white text-sm uppercase tracking-wider leading-tight">Venue: {eventVenue}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                      <Star className="w-5 h-5 text-yellow-400 mb-1 sm:mb-0" />
                      <span className="text-white text-sm uppercase tracking-wider leading-tight">Dress Code: {dressCode}</span>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }} className="text-center mb-4 sm:mb-5">
                    <p className="text-yellow-400 text-sm font-semibold uppercase tracking-wider">No Weapons, Alcohol or Drugs Allowed!</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 0.6 }} className="text-center mb-3 sm:mb-4">
                    <p className="text-yellow-300 text-xs sm:text-sm uppercase tracking-wider mb-2">For RSVP contact</p>
                    <div className="relative overflow-hidden max-w-sm mx-auto">
                      <motion.div initial={{ x: 0 }} animate={{ x: '-50%' }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} className="inline-flex items-center gap-6 whitespace-nowrap">
                        <span className="text-white text-xs sm:text-sm">F. Naidoo</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">A.L. Peter</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">S. Hariparsad</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">S. Balgobind</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">F. Naidoo</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">A.L. Peter</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">S. Hariparsad</span>
                        <span className="text-yellow-400">•</span>
                        <span className="text-white text-xs sm:text-sm">S. Balgobind</span>
                      </motion.div>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 0.8 }} className="text-center">
                    <motion.button whileHover={{ scale: 1.03, boxShadow: "0 12px 24px rgba(255, 215, 0, 0.25)" }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/register')} className="relative overflow-hidden bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-slate-900 px-6 sm:px-8 py-2 rounded-full text-base sm:text-lg font-bold uppercase tracking-wider shadow-2xl transition-all duration-300 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700">
                      <span className="relative z-10">Accept Invitation</span>
                      <motion.span initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} className="absolute inset-y-0 -left-1 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-12 sm:h-24 bg-gradient-to-t from-slate-900 to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-12 sm:h-24 bg-gradient-to-b from-slate-900 to-transparent"></div>
    </div>
  )
}

export default InvitationCard
