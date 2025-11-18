import { supabaseServer } from './_lib/supabase'

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
    const { barcode } = (body || {}) as { barcode?: string }
    if (!barcode) {
      s.status(400).json({ error: 'Missing barcode' })
      return
    }

    // Find ticket
    const { data: ticket, error: tErr } = await supabaseServer
      .from('tickets')
      .select('*, student:student_id(*, class:class_id(name))')
      .eq('barcode', barcode)
      .single()

    if (tErr || !ticket) {
      s.status(404).json({ error: 'Ticket not found' })
      return
    }

    if (ticket.is_used) {
      s.status(409).json({ error: 'Ticket already used' })
      return
    }

    // Update student attendance
    const { error: sErr } = await supabaseServer
      .from('students')
      .update({ attended: true, check_in_time: new Date().toISOString() })
      .eq('id', ticket.student_id)

    if (sErr) {
      s.status(500).json({ error: 'Failed to update student' })
      return
    }

    // Mark ticket as used
    await supabaseServer.from('tickets').update({ is_used: true }).eq('id', ticket.id)

    // Record attendance
    await supabaseServer.from('attendance').insert([
      { student_id: ticket.student_id, check_in_method: 'barcode' },
    ])

    s.status(200).json({ success: true, student: ticket.student })
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Unknown error'
    s.status(500).json({ error: 'Server error', details: message })
  }
}
