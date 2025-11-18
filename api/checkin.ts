import { supabaseServer } from './_lib/supabase'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { barcode } = body
    if (!barcode) {
      res.status(400).json({ error: 'Missing barcode' })
      return
    }

    // Find ticket
    const { data: ticket, error: tErr } = await supabaseServer
      .from('tickets')
      .select('*, student:student_id(*, class:class_id(name))')
      .eq('barcode', barcode)
      .single()

    if (tErr || !ticket) {
      res.status(404).json({ error: 'Ticket not found' })
      return
    }

    if (ticket.is_used) {
      res.status(409).json({ error: 'Ticket already used' })
      return
    }

    // Update student attendance
    const { error: sErr } = await supabaseServer
      .from('students')
      .update({ attended: true, check_in_time: new Date().toISOString() })
      .eq('id', ticket.student_id)

    if (sErr) {
      res.status(500).json({ error: 'Failed to update student' })
      return
    }

    // Mark ticket as used
    await supabaseServer.from('tickets').update({ is_used: true }).eq('id', ticket.id)

    // Record attendance
    await supabaseServer.from('attendance').insert([
      { student_id: ticket.student_id, check_in_method: 'barcode' },
    ])

    res.status(200).json({ success: true, student: ticket.student })
  } catch (e: any) {
    res.status(500).json({ error: 'Server error', details: e?.message })
  }
}
