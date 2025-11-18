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
    const { barcode } = body || {}

    if (!barcode) {
      return res.status(400).json({ error: 'Missing barcode' })
    }

    const { data: ticket, error: tErr } = await supabaseServer
      .from('tickets')
      .select('*, student:students(*)')
      .eq('barcode', barcode)
      .single()

    if (tErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
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
