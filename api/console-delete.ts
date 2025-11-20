import { supabaseServer } from './_lib/supabase'

interface VercelRequest {
  method?: string
  body: unknown
}
interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as { type?: string; id?: string | number })
    const { type, id } = body || {}
    if (!type || !id) return res.status(400).json({ error: 'Missing type or id' })

    if (type === 'student') {
      const { error: aErr } = await supabaseServer
        .from('attendance')
        .delete()
        .eq('student_id', id)

      const { error: tErr } = await supabaseServer
        .from('tickets')
        .delete()
        .eq('student_id', id)

      const { error: sErr } = await supabaseServer
        .from('students')
        .delete()
        .eq('id', id)

      if (aErr || tErr || sErr) return res.status(500).json({ error: 'Failed to delete student records' })
      return res.status(200).json({ success: true })
    }

    if (type === 'staff') {
      // Delete attendance first, then ticket
      const { error: aErr } = await supabaseServer
        .from('staff_attendance')
        .delete()
        .eq('staff_id', id)
      const { error: tErr } = await supabaseServer
        .from('staff_tickets')
        .delete()
        .eq('staff_id', id)
      if (aErr || tErr) return res.status(500).json({ error: 'Failed to delete staff records' })
      return res.status(200).json({ success: true })
    }

    return res.status(400).json({ error: 'Invalid type' })
  } catch (e: unknown) {
    const message = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Unknown'
    return res.status(500).json({ error: 'Server error', details: message })
  }
}
