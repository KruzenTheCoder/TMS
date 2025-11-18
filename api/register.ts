import { supabaseServer, generateTicketNumber } from './_lib/supabase'

const APP_NAME = process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME || 'TMSS Matric Farewell 2025'
const EVENT_DATE_ISO = process.env.EVENT_DATE || process.env.NEXT_PUBLIC_EVENT_DATE || '2025-11-27'
const EVENT_TIME = process.env.EVENT_TIME || process.env.NEXT_PUBLIC_EVENT_TIME || '11:00 - 17:00'
const EVENT_VENUE = process.env.EVENT_VENUE || process.env.NEXT_PUBLIC_EVENT_VENUE || 'Havenpark Secondary School'

const dateLabel = (() => {
  try {
    const d = new Date(EVENT_DATE_ISO)
    return d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
  } catch {
    return 'November 27, 2025'
  }
})()

export default async function handler(req: unknown, res: unknown) {
  const r = req as { method?: string; body?: unknown }
  const s = res as { status: (code: number) => { json: (data: unknown) => void } }

  if (r.method !== 'POST') {
    s.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const raw = r.body
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw
    const { name, surname, className } = (body || {}) as { name?: string; surname?: string; className?: string }

    if (!name || !surname || !className) {
      s.status(400).json({ error: 'Missing required fields' })
      return
    }

    const fullName = `${name} ${surname}`

    // Resolve class by name (create if missing)
    let { data: cls } = await supabaseServer
      .from('classes')
      .select('id, name')
      .eq('name', className)
      .maybeSingle()

    if (!cls) {
      const { data: created, error: createErr } = await supabaseServer
        .from('classes')
        .insert([{ name: className, grade: '12' }])
        .select('id, name')
        .single()
      if (createErr || !created) {
        s.status(400).json({ error: 'Invalid class selected' })
        return
      }
      cls = created
    }

    // Prevent duplicate registration by name + class
    const { data: existing } = await supabaseServer
      .from('students')
      .select('id')
      .eq('name', fullName)
      .eq('class_id', cls.id)
      .maybeSingle()

    if (existing) {
      s.status(409).json({ error: 'Student already registered for this class' })
      return
    }

    // Auto-generate a student_id
    const ticketSeed = generateTicketNumber()
    const autoStudentId = `S-${ticketSeed}`

    // Create student
    const { data: student, error: studentError } = await supabaseServer
      .from('students')
      .insert([
        {
          student_id: autoStudentId,
          name: fullName,
          email: null,
          class_id: cls.id,
          registered: true,
        },
      ])
      .select()
      .single()

    if (studentError || !student) {
      s.status(500).json({ error: 'Failed to create student' })
      return
    }

    // Create ticket
    const ticketNumber = generateTicketNumber()
    const { data: ticket, error: ticketError } = await supabaseServer
      .from('tickets')
      .insert([
        {
          student_id: student.id,
          barcode: ticketNumber,
          ticket_data: {
            student_name: fullName,
            student_id: autoStudentId,
            class: cls.name,
            event_name: APP_NAME,
            event_date: dateLabel,
            event_time: EVENT_TIME,
            venue: EVENT_VENUE,
            entertainment: 'DJ by TMSS',
          },
        },
      ])
      .select()
      .single()

    if (ticketError || !ticket) {
      s.status(500).json({ error: 'Failed to create ticket' })
      return
    }

    s.status(200).json({ student, ticket })
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Unknown error'
    s.status(500).json({ error: 'Server error', details: message })
  }
}
