import { supabaseServer } from './_lib/supabase'

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { name, surname, className } = body || {}

    if (!name || !surname || !className) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

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

    const { data: existing } = await supabaseServer
      .from('students')
      .select('id')
      .eq('name', name)
      .eq('surname', surname)
      .eq('class_id', cls.id)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'Student already registered for this class' })
    }

    const { data: student, error: studentError } = await supabaseServer
      .from('students')
      .insert([{ name, surname, class_id: cls.id, attended: false }])
      .select()
      .single()

    if (studentError || !student) {
      return res.status(500).json({ error: 'Failed to create student' })
    }

    const uniqueCode = `${name.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}`
    const { data: ticket, error: ticketError } = await supabaseServer
      .from('tickets')
      .insert([{ 
          student_id: student.id, 
          barcode: uniqueCode, 
          is_used: false, 
          ticket_data: { student_name: `${name} ${surname}`, class: className } 
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
