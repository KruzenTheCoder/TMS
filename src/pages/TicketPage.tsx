import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Student, Ticket } from '../lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const TicketPage = () => {
  const { id } = useParams<{ id: string }>()
  const appName = import.meta.env.VITE_APP_NAME || 'TMSS Matric Farewell 2025'
  const eventDate = import.meta.env.VITE_EVENT_DATE || '2025-11-27'
  const eventTime = import.meta.env.VITE_EVENT_TIME || '11:00 - 17:00'
  const eventVenue = import.meta.env.VITE_EVENT_VENUE || 'Havenpark Secondary School'
  const d = new Date(eventDate)
  const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
  const [student, setStudent] = useState<Student | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  
  const [loading, setLoading] = useState(true)
  const dressCode = import.meta.env.VITE_DRESS_CODE || 'Formal'

  const fetchStudentAndTicket = useCallback(async () => {
    try {
      // Fetch student data
      const { data: studentData } = await supabase
        .from('students')
        .select(`
          *,
          class:class_id (name, form_teacher:form_teacher_id (name))
        `)
        .eq('id', id)
        .single()

      if (studentData) {
        setStudent(studentData)
        
        // Fetch ticket
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*')
          .eq('student_id', id)
          .maybeSingle()

        if (ticketData) {
          setTicket(ticketData)
        }
      }
    } catch {
      toast.error('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchStudentAndTicket()
  }, [fetchStudentAndTicket])

  const downloadPDF = async () => {
    const element = document.getElementById('ticket-card')
    if (!element) return

    const images = Array.from(element.querySelectorAll('img'))
    await Promise.all(
      images.map(img => new Promise<void>(resolve => {
        if (img.complete) return resolve()
        img.onload = () => resolve()
        img.onerror = () => resolve()
      }))
    )

    await new Promise(resolve => setTimeout(resolve, 100))

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      scale: 2
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgAspect = canvas.width / canvas.height
    let renderWidth = pageWidth - 20
    let renderHeight = renderWidth / imgAspect
    if (renderHeight > pageHeight - 20) {
      renderHeight = pageHeight - 20
      renderWidth = renderHeight * imgAspect
    }
    const x = (pageWidth - renderWidth) / 2
    const y = (pageHeight - renderHeight) / 2
    pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight)
    pdf.save(`TMSS-Farewell-Ticket-${student?.student_id}.pdf`)
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TMSS Matric Farewell Ticket',
          text: `My ticket for TMSS Matric Farewell 2025`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Ticket link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Loading your ticket...</div>
      </div>
    )
  }

  if (!student || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Ticket not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-amber-100"
        >
          {/* Ticket Card */}
          <div id="ticket-card" className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-amber-700">{appName}</h2>
              <p className="text-sm text-slate-600 mt-1">{eventVenue} • {dateLabel} • {eventTime}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-slate-600">Name</p>
                  <p className="text-lg font-semibold text-slate-900">{student.name}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-600">Student ID</p>
                      <p className="font-medium text-slate-900">{student.student_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Class</p>
                      <p className="font-medium text-slate-900">{student.class?.name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="p-4 rounded-xl border border-amber-100 text-center">
                  <QRCodeCanvas value={ticket.barcode} size={192} includeMargin={true} />
                  <p className="mt-3 text-sm text-slate-700 font-mono">{ticket.barcode}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-slate-600">Date</p>
                <p className="font-semibold text-slate-900">{ticket.ticket_data?.event_date || dateLabel}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-slate-600">Time</p>
                <p className="font-semibold text-slate-900">{ticket.ticket_data?.event_time || eventTime}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-slate-600">Venue</p>
                <p className="font-semibold text-slate-900">{ticket.ticket_data?.venue || eventVenue}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-slate-600">Entertainment</p>
                <p className="font-semibold text-slate-900">{ticket.ticket_data?.entertainment || 'DJ by TMSS'}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-slate-600">Dress Code</p>
                <p className="font-semibold text-slate-900">{dressCode}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-amber-50 border-t border-amber-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadPDF} className="bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow">
              <Download className="w-5 h-5" />
              <span>Download Ticket</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={shareTicket} className="bg-white border-2 border-amber-600 text-amber-800 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow">
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Instructions */}
        <div className="mt-6 text-center text-amber-800">
          <div className="bg-white bg-opacity-80 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-amber-900">Important:</h3>
            <ul className="text-sm space-y-1 opacity-80">
              <li>• Save this ticket or take a screenshot</li>
              <li>• Present the QR code at entry for scanning</li>
              <li>• Each ticket can only be used once</li>
              <li>• Arrive early to ensure smooth entry</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketPage
