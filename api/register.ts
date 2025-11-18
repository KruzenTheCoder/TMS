import { supabaseServer, generateTicketNumber } from './_lib/supabase'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { name, surname, className } = body

    if (!name || !surname || !className) {
      res.status(400).json({ error: 'Missing required fields' })
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
        res.status(400).json({ error: 'Invalid class selected' })
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
      res.status(409).json({ error: 'Student already registered for this class' })
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
      res.status(500).json({ error: 'Failed to create student' })
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
            event_name: 'TMSS Matric Farewell 2024',
            event_date: 'December 04, 2024',
            event_time: '10:30AM - 16:00 PM',
            venue: 'Havenpark Secondary School Hall',
            entertainment: 'DJ by TMSS',
          },
        },
      ])
      .select()
      .single()

    if (ticketError || !ticket) {
      res.status(500).json({ error: 'Failed to create ticket' })
      return
    }

    res.status(200).json({ student, ticket })
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e?.message })
  }
}
