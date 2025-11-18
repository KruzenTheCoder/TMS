import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Student, Ticket } from '../lib/supabase'
import { generateQRCode } from '../utils/ticketUtils'
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
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)

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
          const qrUrl = await generateQRCode(ticketData.barcode)
          setQrCode(qrUrl)
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

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      width: 800,
      height: 400
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4')
    const imgWidth = 280
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    pdf.save(`TMSS-Farewell-Ticket-${student?.student_id}.pdf`)
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TMSS Matric Farewell Ticket',
          text: `My ticket for TMSS Matric Farewell 2024`,
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
          transition={{ duration: 0.8 }}
          className="bg-white rounded-lg shadow-2xl overflow-hidden"
        >
          {/* Ticket Card */}
          <div id="ticket-card" className="flex">
            {/* Left Side Panel */}
            <div className="w-24 bg-amber-100 flex items-center justify-center relative">
              <div className="transform -rotate-90 text-black font-semibold text-sm tracking-wider">
                TICKET NUMBER: {ticket.barcode}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 relative">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-black uppercase tracking-wider mb-2">
                  TRENANCE MATRIC
                </h1>
                <h2 className="text-2xl font-bold text-black uppercase tracking-wider">
                  {appName.toUpperCase()}
                </h2>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Left Column - Student Info */}
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-black uppercase mb-2">Student Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {student.name}</p>
                      <p><span className="font-medium">Student ID:</span> {student.student_id}</p>
                      <p><span className="font-medium">Class:</span> {student.class?.name}</p>
                    </div>
                  </div>

                  {/* Date Panel */}
                  <div className="bg-amber-100 p-4 rounded-lg text-center">
                    <p className="font-bold text-black text-lg uppercase tracking-wider">
                      {dateLabel.toUpperCase()}
                    </p>
                    <p className="text-black text-sm">{eventTime}</p>
                  </div>
                </div>

                {/* Right Column - Event Details */}
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-black uppercase mb-1">• DISCO BY</p>
                    <p className="font-bold text-black text-lg uppercase">DJ BY TMSS</p>
                  </div>

                  <div>
                    <p className="font-semibold text-black uppercase">Time:</p>
                    <p className="text-black">{eventTime}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-black uppercase">Price:</p>
                    <p className="font-bold text-black text-lg uppercase">FREE</p>
                  </div>

                  <div>
                    <p className="font-semibold text-black uppercase">Venue:</p>
                    <p className="font-bold text-black text-lg uppercase">{eventVenue.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Perforation Line */}
              <div className="absolute top-8 bottom-8 right-32 border-l-2 border-dashed border-black"></div>

              {/* Circular Tabs */}
              <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-black rounded-full"></div>
            </div>

            {/* QR Code Area */}
            <div className="w-48 bg-amber-100 flex flex-col items-center justify-center relative">
              <div className="mb-4">
                <img
                  src={qrCode}
                  alt="Ticket QR Code"
                  className="h-48 w-48 object-contain"
                />
              </div>
              <p className="text-sm text-black font-mono text-center">
                {ticket.barcode}
              </p>
            </div>

            {/* Right Side Panel */}
            <div className="w-16 bg-amber-100 flex items-center justify-center relative">
              <div className="transform -rotate-90 text-black font-semibold text-xs tracking-wider">
                RIGHT OF ADMISSION RESERVED
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-amber-50 flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={downloadPDF}
              className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span>Download Ticket</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={shareTicket}
              className="flex-1 bg-white border-2 border-amber-600 text-amber-800 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Share Ticket</span>
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
