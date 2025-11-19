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

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const channel = supabase
      .channel('realtime-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchDashboardData)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [studentsData, classesData] = await Promise.all([
        supabase.from('students').select(`
          *,
          class:class_id (name, form_teacher:form_teacher_id (name))
        `),
        supabase.from('classes').select('*'),
      ])

      if (studentsData.data) setStudents(studentsData.data)
      if (classesData.data) setClasses(classesData.data)
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const totalStudents = students.length
  const registeredStudents = students.filter(s => s.registered).length
  const attendedStudents = students.filter(s => s.attended).length
  const attendanceRate = totalStudents > 0 ? (attendedStudents / totalStudents) * 100 : 0

  // Class statistics
  const classStats = classes.map(cls => {
    const classStudents = students.filter(s => s.class_id === cls.id)
    const registered = classStudents.filter(s => s.registered).length
    const attended = classStudents.filter(s => s.attended).length
    return {
      ...cls,
      total: classStudents.length,
      registered,
      attended,
      attendanceRate: registered > 0 ? (attended / registered) * 100 : 0
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
                    <td className="py-3 px-4">{cls.form_teacher?.name || 'N/A'}</td>
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
                <p className="text-sm text-slate-600">Teacher: {cls.form_teacher?.name || 'N/A'}</p>
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
          <div className="overflow-x-auto hidden md:block">
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
                {students.slice(0, 10).map((student) => (
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
          <div className="md:hidden space-y-3">
            {students.slice(0, 10).map((student) => (
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
      </div>
    </div>
  )
}

export default AdminDashboard
