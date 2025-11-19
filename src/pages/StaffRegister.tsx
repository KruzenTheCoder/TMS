import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { generateTicketNumber, generateQRCode } from '../utils/ticketUtils'

const StaffRegister = () => {
  const [initials, setInitials] = useState('')
  const [surname, setSurname] = useState('')
  const [mode, setMode] = useState<'class' | 'designation'>('class')
  const [className, setClassName] = useState('12A')
  const [designation, setDesignation] = useState('PRINCIPAL')
  const [loading, setLoading] = useState(false)
  const [ticketCode, setTicketCode] = useState<string>('')
  const [ticketQr, setTicketQr] = useState<string>('')
  const navigate = useNavigate()

  const classes = [
    '12A','12B','12C','12D',
    '11A','11B','11C','11D',
    '10A','10B','10C','10D','10E',
    '9A','9B','9C',
    '8A','8B','8C','8D',
  ]
  const designations = [
    'PRINCIPAL','DEPT. PRINCIPAL','DEPT. HEAD','ADMIN','STAFF'
  ]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const init = initials.replace(/\./g, '').trim().toUpperCase()
      const sur = surname.trim().toUpperCase()

      let query = supabase
        .from('authorized_staff')
        .select('id, initials, surname, class_name, designation')
        .eq('surname', sur)
        .eq('initials_sanitized', init)
        .limit(1)

      if (mode === 'class') {
        query = query.eq('class_name', className)
      } else {
        query = query.is('class_name', null).eq('designation', designation)
      }

      const { data, error } = await query
      if (error) {
        toast.error('Authorization check failed')
        setLoading(false)
        return
      }
      if (!data || data.length === 0) {
        toast.error('Not authorized. Please check initials, surname and selection')
        setLoading(false)
        return
      }
      const staff = data[0]
      const ticketNumber = generateTicketNumber()
      const { data: ticket, error: ticketError } = await supabase
        .from('staff_tickets')
        .insert([
          {
            staff_id: staff.id,
            barcode: ticketNumber,
            is_used: false,
            ticket_data: {
              staff_name: `${staff.initials} ${staff.surname}`,
              class: staff.class_name || null,
              designation: staff.designation || null,
            },
          },
        ])
        .select()
        .single()

      if (ticketError || !ticket) {
        toast.error('Failed to create staff ticket')
        setLoading(false)
        return
      }

      setTicketCode(ticketNumber)
      const qrUrl = generateQRCode(ticketNumber)
      setTicketQr(qrUrl)
      toast.success('Authorized — staff ticket created')
    } catch {
      toast.error('Authorization check failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-2xl shadow-2xl border-2 border-yellow-400 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-6">
            <h1 className="text-2xl font-bold text-slate-900">Staff Register</h1>
            <p className="text-slate-700">TMSS Authorized Staff Validation</p>
          </div>
          <form onSubmit={submit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Initial(s)</label>
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value)}
                  placeholder="e.g. F or A L"
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Surname</label>
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="e.g. Naidoo"
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex gap-4 mb-3">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" checked={mode==='class'} onChange={() => setMode('class')} />
                  <span>Class</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="mode" checked={mode==='designation'} onChange={() => setMode('designation')} />
                  <span>Designation</span>
                </label>
              </div>
              {mode === 'class' ? (
                <select value={className} onChange={(e) => setClassName(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none">
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none">
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-3 rounded-lg font-bold uppercase tracking-wider shadow-lg disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Validate'}
            </motion.button>
          </form>
          {ticketCode && (
            <div className="px-6 pb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-slate-800 text-sm mb-2">Your staff ticket code:</p>
                <p className="text-2xl font-bold text-yellow-700 mb-4">{ticketCode}</p>
                {ticketQr && (
                  <img src={ticketQr} alt="Ticket QR" className="mx-auto w-40 h-40" />
                )}
                <p className="text-xs text-slate-600 mt-2">Present this code/QR for scanning at entry</p>
                <div className="mt-4">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(`/staff/ticket/${ticketCode}`)} className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 px-6 py-2 rounded-lg font-bold">
                    View Ticket
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default StaffRegister
