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
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: 'Service unavailable', details: 'Supabase server credentials not configured' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { barcode } = body || {}

    if (!barcode) {
      return res.status(400).json({ error: 'Missing barcode' })
    }

    const { data: ticket } = await supabaseServer
      .from('tickets')
      .select('*, student:students(*)')
      .eq('barcode', barcode)
      .maybeSingle()

    if (!ticket) {
      const { data: staffTicket, error: sErr } = await supabaseServer
        .from('staff_tickets')
        .select('*, staff:authorized_staff(*)')
        .eq('barcode', barcode)
        .maybeSingle()

      if (sErr || !staffTicket) {
        return res.status(404).json({ error: 'Ticket not found' })
      }

      if (staffTicket.is_used) {
        return res.status(409).json({ error: 'Ticket already used' })
      }

      const { error: uErr2 } = await supabaseServer
        .from('staff_tickets')
        .update({ is_used: true })
        .eq('id', staffTicket.id)

      if (uErr2) return res.status(500).json({ error: 'Failed to update ticket' })

      await supabaseServer.from('staff_attendance').insert([
        { staff_id: staffTicket.staff_id, check_in_method: 'barcode' },
      ])

      const staffName = `${staffTicket.staff?.initials ?? ''} ${staffTicket.staff?.surname ?? ''}`.trim()
      return res.status(200).json({ success: true, student: { id: String(staffTicket.staff_id), name: staffName, student_id: `STAFF-${staffTicket.staff_id}`, class: { name: staffTicket.staff?.class_name || staffTicket.staff?.designation || 'STAFF' } } })
    }

    if (ticket.is_used) {
      return res.status(409).json({ error: 'Ticket already used' })
    }

    const { error: uErr } = await supabaseServer
      .from('tickets')
      .update({ is_used: true })
      .eq('id', ticket.id)

    if (uErr) return res.status(500).json({ error: 'Failed to update ticket' })

    const nowIso = new Date().toISOString()
    const { error: sErr } = await supabaseServer
      .from('students')
      .update({ attended: true, check_in_time: nowIso })
      .eq('id', ticket.student_id)

    if (sErr) return res.status(500).json({ error: 'Failed to update student' })

    await supabaseServer.from('attendance').insert([
      { student_id: ticket.student_id, check_in_method: 'barcode' },
    ])

    return res.status(200).json({ success: true, student: ticket.student })

  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Unknown'
    return res.status(500).json({ error: 'Server error', details: message })
  }
}
