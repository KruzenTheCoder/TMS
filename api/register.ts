import { supabaseServer, generateTicketNumber } from './_lib/supabase'

interface VercelRequest {
  method?: string;
  body: unknown;
}
interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Service unavailable', details: 'Supabase server credentials not configured' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { name, surname, className } = body || {}

    if (!name || !surname || !className) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const fullName = `${String(name).trim()} ${String(surname).trim()}`

    let cls
    const { data: existingClass } = await supabaseServer
      .from('classes')
      .select('id, name')
      .ilike('name', className)
      .maybeSingle()

    if (existingClass) {
      cls = existingClass
    } else {
      const { data: created, error: createErr } = await supabaseServer
        .from('classes')
        .insert([{ name: className }])
        .select('id, name')
        .single()
      
      if (createErr || !created) {
        return res.status(400).json({ error: 'Invalid class selected' })
      }
      cls = created
    }

    const { data: authorized } = await supabaseServer
      .from('authorized_students')
      .select('id')
      .ilike('name', fullName)
      .eq('class_name', className)
      .maybeSingle()

    if (!authorized) {
      return res.status(403).json({ error: 'Not authorized to register for this event' })
    }

    const { data: existing } = await supabaseServer
      .from('students')
      .select('id')
      .eq('name', fullName)
      .eq('class_id', cls.id)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'Student already registered for this class' })
    }

    const autoStudentId = `S-${generateTicketNumber()}`
    const { data: student, error: studentError } = await supabaseServer
      .from('students')
      .insert([{ student_id: autoStudentId, name: fullName, email: null, class_id: cls.id, registered: true, attended: false }])
      .select()
      .single()

    if (studentError || !student) {
      return res.status(500).json({ error: 'Failed to create student' })
    }

    const ticketNumber = generateTicketNumber()
    const { data: ticket, error: ticketError } = await supabaseServer
      .from('tickets')
      .insert([{ 
          student_id: student.id, 
          barcode: ticketNumber, 
          is_used: false, 
          ticket_data: { 
            student_name: fullName,
            student_id: autoStudentId,
            class: className,
            event_name: process.env.VITE_APP_NAME || 'TMSS Matric Farewell 2025',
            event_date: new Date(String(process.env.VITE_EVENT_DATE || '2025-11-27')).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
            event_time: process.env.VITE_EVENT_TIME || '11:00 - 17:00',
            venue: process.env.VITE_EVENT_VENUE || 'Havenpark Secondary School',
            entertainment: 'DJ by TMSS',
          } 
      }])
      .select()
      .single()

    if (ticketError || !ticket) {
      return res.status(500).json({ error: 'Failed to create ticket' })
    }

    return res.status(200).json({ student, ticket })
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Unknown'
    return res.status(500).json({ error: 'Server error', details: message })
  }
}
