import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle, Clock, TrendingUp, Download } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
// (removed – Database type is not exported from this module)

 const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
import type { Student, Class } from '../lib/supabase'
import { toast } from 'sonner'
 

const CLASS_TEACHERS: Record<string, string> = {
  '12A': 'E.J. Davids',
  '12B': 'A.L. Peter',
  '12C': 'F. Naidoo',
  '12D': 'S. Hariparsad',
}

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [staffTickets, setStaffTickets] = useState<{ id: string; barcode: string; is_used: boolean; created_at: string; staff: { id: number; initials: string; surname: string; class_name?: string | null; designation?: string | null } }[]>([])
  const [staffAttendance, setStaffAttendance] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchDashboardData()
    const channel = supabase
      .channel('realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_tickets' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_attendance' }, fetchDashboardData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    const seedIfEmpty = async () => {
      try {
        const { data } = await supabase
          .from('authorized_students')
          .select('id')
          .eq('class_name', '12A')
          .limit(1)

        if ((!data || data.length === 0) && !sessionStorage.getItem('seeded_12A')) {
          await seedAuthorized12A()
          sessionStorage.setItem('seeded_12A', '1')
        }
      } catch {
        // silent
      }
    }
    seedIfEmpty()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [studentsData, classesData, staffTicketsData] = await Promise.all([
        supabase.from('students').select(`
          *,
          class:class_id (name, form_teacher:form_teacher_id (name))
        `),
        supabase.from('classes').select('*'),
        supabase
          .from('staff_tickets')
          .select('id, barcode, is_used, created_at, staff:staff_id (id, initials, surname, class_name, designation)')
          .order('created_at', { ascending: false }),
      ])

      if (studentsData.data) setStudents(studentsData.data)
      if (classesData.data) setClasses(classesData.data)
      if (staffTicketsData.data) {
        const list = staffTicketsData.data as unknown as { id: string; barcode: string; is_used: boolean; created_at: string; staff: { id: number; initials: string; surname: string; class_name?: string | null; designation?: string | null } }[]
        setStaffTickets(list)
        const ids = Array.from(new Set(list.map(t => t.staff?.id).filter(Boolean))) as number[]
        if (ids.length > 0) {
          const { data: attendanceData } = await supabase
            .from('staff_attendance')
            .select('staff_id, check_in_time')
            .in('staff_id', ids)
          const map: Record<number, string> = {}
          ;(attendanceData || []).forEach((row: { staff_id: number; check_in_time: string }) => {
            if (!map[row.staff_id]) map[row.staff_id] = row.check_in_time
          })
          setStaffAttendance(map)
        } else {
          setStaffAttendance({})
        }
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const seedAuthorized12A = async () => {
    const authorized12A = [
      { surname: 'BAJRUNGBALI', first: 'Reshani' },
      { surname: 'DAVNARAIN', first: 'Kiara - Ann' },
      { surname: 'DLAMINI', first: 'Andisa Khanya' },
      { surname: 'DLAMINI', first: 'Siphesihle Yolanda' },
      { surname: 'DLAMINI', first: 'Yolanda Olwethu' },
      { surname: 'EBRAHIM', first: 'Zaarah' },
      { surname: 'GOVENDER', first: 'Bernette' },
      { surname: 'GOVENDER', first: 'Tamia Lee' },
      { surname: 'GUMEDE', first: 'Candice Andiswa' },
      { surname: 'HARILAL', first: 'Brandon Ezekiel' },
      { surname: 'KABITUNGA', first: 'Aphile' },
      { surname: 'KHATSHWA', first: 'Sanelisiwe' },
      { surname: 'MASUKU', first: 'Siphokuhle Amahle' },
      { surname: 'MATI', first: 'Anele Lucas' },
      { surname: 'MDLALOSE', first: 'Amahle' },
      { surname: 'MDLETSHE', first: 'Ashante Lucia' },
      { surname: 'MHLONGO', first: 'Sthembile' },
      { surname: 'MICHAEL', first: 'Jared' },
      { surname: 'MKHIZE', first: 'Saneliswe' },
      { surname: 'MOONSAMY', first: 'Deuel Zion' },
      { surname: 'MUNSAMY', first: 'Amelia' },
      { surname: 'MUNSAMY', first: 'Thamishka' },
      { surname: 'NAICKER', first: 'Teneal Alyssa' },
      { surname: 'NAIDOO', first: 'Jordan Clemence' },
      { surname: 'NAIDOO', first: 'Seshlan' },
      { surname: 'NAIR', first: 'Makayla' },
      { surname: 'NDLOVU', first: 'Snothile Sanelisiwe' },
      { surname: 'NOKRAJ', first: 'Sohaan' },
      { surname: 'PILLAY', first: 'Aiden' },
      { surname: 'PILLAY', first: 'Brayleen Esther' },
      { surname: 'PILLAY', first: 'Keenan James' },
      { surname: 'SEWNARAIN', first: 'Suniel' },
      { surname: 'SHAIK', first: 'Tasmiya' },
      { surname: 'SHAMASE', first: 'Sibongiso Kwanele' },
      { surname: 'SOPOTELA', first: 'Omphile' },
      { surname: 'THEVAR', first: 'Kovashen' },
      { surname: 'WINDVOGEL', first: 'Liam Shaun' },
    ]

    const records = authorized12A.map(({ surname, first }) => ({
      name: `${String(first).replace(/\s+/g, ' ').trim()} ${String(surname).replace(/\s+/g, ' ').trim()}`,
      class_name: '12A'
    }))

    try {
      const { error } = await supabase
        .from('authorized_students')
        .upsert(records)

      if (error) {
        toast.error('Failed to import authorized learners')
      } else {
        toast.success('Imported 12A authorized learners')
      }
    } catch {
      toast.error('Failed to import authorized learners')
    }
  }

  // Calculate statistics
  const totalStudents = students.length
  const registeredStudents = students.filter(s => s.registered).length
  const attendedStudents = students.filter(s => s.attended).length
  const attendanceRate = totalStudents > 0 ? (attendedStudents / totalStudents) * 100 : 0

  // Class statistics
  const classStats = classes
    .filter(cls => ['12A','12B','12C','12D'].includes(cls.name))
    .map(cls => {
      const classStudents = students.filter(s => s.class_id === cls.id)
      const registered = classStudents.filter(s => s.registered).length
      const attended = classStudents.filter(s => s.attended).length
      return {
        ...cls,
        total: classStudents.length,
        registered,
        attended,
        attendanceRate: registered > 0 ? (attended / registered) * 100 : 0,
        teacherName: CLASS_TEACHERS[cls.name] || cls.form_teacher?.name || 'N/A',
      }
    })

  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Class', 'Registered', 'Attended', 'Check-in Time']
    const data = students.map(student => [
      student.student_id,
      student.name,
      student.class?.name || '',
      student.registered ? 'Yes' : 'No',
      student.attended ? 'Yes' : 'No',
      student.check_in_time || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tmss-farewell-attendance-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-yellow-400">TMSS Matric Farewell 2025</p>
        </motion.div>

        

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-slate-900">{totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Registered</p>
                <p className="text-3xl font-bold text-green-600">{registeredStudents}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Attended</p>
                <p className="text-3xl font-bold text-yellow-600">{attendedStudents}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{attendanceRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Staff Registered</p>
                <p className="text-3xl font-bold text-slate-900">{staffTickets.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Staff Attended</p>
                <p className="text-3xl font-bold text-yellow-600">{staffTickets.filter(s => s.is_used).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Class Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Class Statistics</h2>
            <button
              onClick={exportToCSV}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Class</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Form Teacher</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Total</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Registered</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Attended</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((cls) => (
                  <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{cls.name}</td>
                    <td className="py-3 px-4">{cls.teacherName}</td>
                    <td className="py-3 px-4 text-center">{cls.total}</td>
                    <td className="py-3 px-4 text-center text-green-600 font-medium">{cls.registered}</td>
                    <td className="py-3 px-4 text-center text-yellow-600 font-medium">{cls.attended}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold ${
                        cls.attendanceRate >= 80 ? 'text-green-600' : 
                        cls.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {cls.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {classStats.map((cls) => (
              <div key={cls.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-900">{cls.name}</p>
                  <span className={`text-sm font-bold ${
                    cls.attendanceRate >= 80 ? 'text-green-600' : 
                    cls.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{cls.attendanceRate.toFixed(1)}%</span>
                </div>
                <p className="text-sm text-slate-600">Teacher: {cls.teacherName}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="font-medium">{cls.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Registered</p>
                    <p className="font-medium text-green-600">{cls.registered}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Attended</p>
                    <p className="font-medium text-yellow-600">{cls.attended}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Registrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-xl p-6"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Registrations</h2>
          <div className="overflow-x-auto overflow-y-auto hidden md:block max-h-[480px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Student ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Class</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => s.registered).map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-sm">{student.student_id}</td>
                    <td className="py-3 px-4 font-medium">{student.name}</td>
                    <td className="py-3 px-4">{student.class?.name || 'N/A'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.attended ? 'bg-green-100 text-green-800' :
                        student.registered ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.attended ? 'Attended' : student.registered ? 'Registered' : 'Not Registered'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">
                      {student.check_in_time ? 
                        new Date(student.check_in_time).toLocaleTimeString() : 
                        'Not checked in'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {students.filter(s => s.registered).map((student) => (
              <div key={student.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.attended ? 'bg-green-100 text-green-800' :
                    student.registered ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {student.attended ? 'Attended' : student.registered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">ID: {student.student_id}</p>
                <p className="text-sm text-slate-600">Class: {student.class?.name || 'N/A'}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {student.check_in_time ? new Date(student.check_in_time).toLocaleTimeString() : 'Not checked in'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-white rounded-xl shadow-xl p-6 mt-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Staff</h2>
          <div className="overflow-x-auto overflow-y-auto hidden md:block max-h-[480px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Role</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {staffTickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{t.staff?.initials} {t.staff?.surname}</td>
                    <td className="py-3 px-4">{t.staff?.class_name || t.staff?.designation || 'Staff'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_used ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {t.is_used ? 'Attended' : 'Registered'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">{t.is_used && t.staff?.id && staffAttendance[t.staff.id] ? new Date(staffAttendance[t.staff.id]).toLocaleTimeString() : 'Not checked in'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3 max-h-[480px] overflow-y-auto pr-2">
            {staffTickets.map((t) => (
              <div key={t.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-slate-900">{t.staff?.initials} {t.staff?.surname}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.is_used ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {t.is_used ? 'Attended' : 'Registered'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">Role: {t.staff?.class_name || t.staff?.designation || 'Staff'}</p>
                <p className="text-xs text-slate-500 mt-1">{t.is_used && t.staff?.id && staffAttendance[t.staff.id] ? new Date(staffAttendance[t.staff.id]).toLocaleTimeString() : 'Not checked in'}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard
