import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

type StudentRow = { id: string; name: string; student_id: string; class: { name: string } }
type StaffRow = { id: string; staff_id: number; barcode: string; is_used: boolean; staff: { id: number; initials: string; surname: string; class_name?: string | null; designation?: string | null } }

const Console = () => {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const fetchData = async () => {
    try {
      const [{ data: sData }, { data: stData }] = await Promise.all([
        supabase
          .from('students')
          .select('id, name, student_id, class:class_id (name)')
          .eq('registered', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('staff_tickets')
          .select('id, staff_id, barcode, is_used, staff:staff_id (id, initials, surname, class_name, designation)')
          .order('created_at', { ascending: false }),
      ])
      setStudents((sData || []) as unknown as StudentRow[])
      const seen = new Set<string>()
      const deduped = ((stData || []) as unknown as StaffRow[]).filter((row) => {
        if (seen.has(row.id)) return false
        seen.add(row.id)
        return true
      })
      setStaff(deduped)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.student_id.toLowerCase().includes(query.toLowerCase()))
  const filteredStaff = staff.filter(s => (`${s.staff.initials} ${s.staff.surname}`).toLowerCase().includes(query.toLowerCase()) || (s.staff.class_name || s.staff.designation || '').toLowerCase().includes(query.toLowerCase()))

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase.rpc('delete_student_registration', { p_student_id: id })
      if (error) { toast.error('Delete failed'); return }
      toast.success('Student deleted')
      setStudents(students.filter(s => s.id !== id))
      fetchData()
    } catch { toast.error('Delete failed') }
  }

  const deleteStaff = async (_ticket_id: string, staff_id: number) => {
    try {
      const { error } = await supabase.rpc('delete_staff_registration', { p_staff_id: staff_id })
      if (error) { toast.error('Delete failed'); return }
      toast.success('Staff records deleted')
      fetchData()
    } catch { toast.error('Delete failed') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-yellow-300 text-xl">Loading console...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Administration Console</h1>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, ID, role..." className="w-full sm:w-80 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-yellow-500 focus:outline-none" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Students Registered</h2>
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-xs">
                    <th className="text-left py-2 px-3 font-semibold text-slate-900">Student ID</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-900">Name</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-900">Class</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs">
                      <td className="py-2 px-3 font-mono text-[11px]">{s.student_id}</td>
                      <td className="py-2 px-3 font-medium">{s.name}</td>
                      <td className="py-2 px-3">{s.class?.name}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => navigate(`/ticket/${s.id}`)} className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-xs">View</button>
                          <button onClick={() => deleteStudent(s.id)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {filteredStudents.map((s) => (
                <div key={s.id} className="border border-slate-200 rounded-lg p-3">
                  <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                  <p className="text-xs text-slate-600">{s.class?.name} • {s.student_id}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => navigate(`/ticket/${s.id}`)} className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-xs">View</button>
                    <button onClick={() => deleteStudent(s.id)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Staff Registered</h2>
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-xs">
                    <th className="text-left py-2 px-3 font-semibold text-slate-900">Name</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-900">Role</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-900">Ticket</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 text-xs">
                      <td className="py-2 px-3 font-medium">{s.staff.initials} {s.staff.surname}</td>
                      <td className="py-2 px-3">{s.staff.class_name || s.staff.designation || 'Staff'}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">{s.barcode}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => navigate(`/staff/ticket/${s.barcode}`)} className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-xs">View</button>
                          <button onClick={() => deleteStaff(s.id, s.staff_id)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {filteredStaff.map((s) => (
                <div key={s.id} className="border border-slate-200 rounded-lg p-3">
                  <p className="font-medium text-slate-900 text-sm">{s.staff.initials} {s.staff.surname}</p>
                  <p className="text-xs text-slate-600">{s.staff.class_name || s.staff.designation || 'Staff'} • {s.barcode}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => navigate(`/staff/ticket/${s.barcode}`)} className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white text-xs">View</button>
                    <button onClick={() => deleteStaff(s.id, s.staff_id)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Console
