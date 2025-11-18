import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { generateTicketNumber } from '../utils/ticketUtils'

const RegistrationForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const classOptions = ['12A', '12B', '12C', '12D', '12E', '12F']
  const appName = import.meta.env.VITE_APP_NAME || 'TMSS Matric Farewell 2025'
  const eventDate = import.meta.env.VITE_EVENT_DATE || '2025-11-27'
  const eventTime = import.meta.env.VITE_EVENT_TIME || '11:00 - 17:00'
  const eventVenue = import.meta.env.VITE_EVENT_VENUE || 'Havenpark Secondary School'
  const d = new Date(eventDate)
  const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    className: ''
  })
  const [checking, setChecking] = useState(false)
  const [health, setHealth] = useState<{ label: string; status: 'ok' | 'fail'; detail?: string }[]>([])

  useEffect(() => {
    // no-op: static class list
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let json: { student: { id: string } } | null = null

      if (import.meta.env.DEV) {
        const fullName = `${formData.name} ${formData.surname}`
        const { data: cls } = await supabase
          .from('classes')
          .select('id, name')
          .eq('name', formData.className)
          .maybeSingle()

        const className = formData.className

        const { data: existing } = await supabase
          .from('students')
          .select('id')
          .eq('name', fullName)
          .eq('class_id', cls?.id ?? null)
          .maybeSingle()

        if (existing) {
          toast.error('Student already registered for this class')
          setLoading(false)
          return
        }

        const ticketSeed = generateTicketNumber()
        const autoStudentId = `S-${ticketSeed}`

        const { data: student, error: studentError } = await supabase
          .from('students')
          .insert([
            {
              student_id: autoStudentId,
              name: fullName,
              email: null,
              class_id: cls?.id ?? null,
              registered: true,
            },
          ])
          .select()
          .single()

        if (studentError || !student) {
          toast.error('Failed to create student')
          setLoading(false)
          return
        }

        const ticketNumber = generateTicketNumber()
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert([
            {
              student_id: student.id,
              barcode: ticketNumber,
              is_used: false,
              ticket_data: {
                student_name: fullName,
                student_id: autoStudentId,
                class: className,
                event_name: appName,
                event_date: dateLabel,
                event_time: eventTime,
                venue: eventVenue,
                entertainment: 'DJ by TMSS',
              },
            },
          ])
          .select()
          .single()

        if (ticketError || !ticket) {
          toast.error('Failed to create ticket')
          setLoading(false)
          return
        }

        json = { student }
      } else {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            surname: formData.surname,
            className: formData.className,
          })
        })
        if (response.status === 404) {
          const fullName = `${formData.name} ${formData.surname}`
          const { data: cls } = await supabase
            .from('classes')
            .select('id, name')
            .eq('name', formData.className)
            .maybeSingle()

          const className = formData.className

          const { data: existing } = await supabase
            .from('students')
            .select('id')
            .eq('name', fullName)
            .eq('class_id', cls?.id ?? null)
            .maybeSingle()

          if (existing) {
            toast.error('Student already registered for this class')
            setLoading(false)
            return
          }

          const ticketSeed = generateTicketNumber()
          const autoStudentId = `S-${ticketSeed}`

          const { data: student, error: studentError } = await supabase
            .from('students')
            .insert([
              {
                student_id: autoStudentId,
                name: fullName,
                email: null,
                class_id: cls?.id ?? null,
                registered: true,
              },
            ])
            .select()
            .single()

          if (studentError || !student) {
            toast.error('Failed to create student')
            setLoading(false)
            return
          }

          const ticketNumber = generateTicketNumber()
          const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert([
              {
                student_id: student.id,
                barcode: ticketNumber,
                is_used: false,
              ticket_data: {
                student_name: fullName,
                student_id: autoStudentId,
                class: className,
                event_name: appName,
                event_date: dateLabel,
                event_time: eventTime,
                venue: eventVenue,
                entertainment: 'DJ by TMSS',
              },
              },
            ])
            .select()
            .single()

          if (ticketError || !ticket) {
            toast.error('Failed to create ticket')
            setLoading(false)
            return
          }

          json = { student }
        } else {
          try {
            json = await response.json()
          } catch {
            json = null
          }
          if (!response.ok || !json) {
            toast.error('Registration failed. Please try again.')
            setLoading(false)
            return
          }
        }
      }

      toast.success('Registration successful! Generating your ticket...')
      navigate(`/ticket/${json!.student.id}`)

    } catch {
      toast.error('Registration failed. Please try again.')
      setLoading(false)
    }
  }

  const runHealthCheck = async () => {
    setChecking(true)
    const results: { label: string; status: 'ok' | 'fail'; detail?: string }[] = []

    try {
      const { error } = await supabase
        .from('classes')
        .select('id, name')
        .limit(1)

      if (error) {
        results.push({ label: 'Supabase client', status: 'fail', detail: error.message || 'Unknown error' })
      } else {
        results.push({ label: 'Supabase client', status: 'ok' })
      }

      if (error && /relation|Not configured/i.test(error.message)) {
        results.push({ label: 'Tables', status: 'fail', detail: 'Missing classes/students/tickets tables' })
      } else {
        results.push({ label: 'Tables', status: 'ok' })
      }

      const envOk = Boolean(
        (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) &&
        (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      )
      results.push({ label: 'Env vars', status: envOk ? 'ok' : 'fail', detail: envOk ? undefined : 'Missing URL or anon key' })

      setHealth(results)
      const fail = results.find(r => r.status === 'fail')
      if (fail) {
        toast.error(`${fail.label} failed: ${fail.detail || ''}`)
      } else {
        toast.success('Health check passed')
      }
    } catch (e: unknown) {
      let msg = 'Unknown error'
      if (e && typeof e === 'object' && 'message' in e) {
        const m = (e as { message: unknown }).message
        msg = typeof m === 'string' ? m : String(m)
      }
      setHealth([{ label: 'Health check', status: 'fail', detail: msg }])
      toast.error('Health check failed')
    } finally {
      setChecking(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
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
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-6 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Student Registration</h1>
            <p className="text-slate-700">{appName}</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={runHealthCheck}
                disabled={checking}
                className="bg-white border-2 border-yellow-600 text-amber-800 px-3 py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Health Check'}
              </button>
              {health.length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {health.map((h, idx) => (
                    <span key={idx} className={h.status === 'ok' ? 'text-green-700' : 'text-red-700'}>
                      {h.label}: {h.status}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Surname
                </label>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
                  placeholder="Your surname"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Class
              </label>
              <select
                name="className"
                value={formData.className}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none transition-colors"
              >
                <option value="">Select your class</option>
                {classOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 py-4 rounded-lg font-bold text-lg uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register for Event'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default RegistrationForm
