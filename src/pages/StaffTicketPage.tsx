import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateQRCode } from '../utils/ticketUtils'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

type StaffTicket = {
  id: string
  staff_id: number
  barcode: string
  is_used: boolean
  ticket_data: { staff_name?: string; class?: string | null; designation?: string | null }
  created_at: string
  staff?: { id: number; initials: string; surname: string; class_name?: string | null; designation?: string | null }
}

const StaffTicketPage = () => {
  const { barcode } = useParams<{ barcode: string }>()
  const appName = import.meta.env.VITE_APP_NAME || 'TMSS Matric Farewell 2025'
  const eventDate = import.meta.env.VITE_EVENT_DATE || '2025-11-27'
  const eventTime = import.meta.env.VITE_EVENT_TIME || '11:00 - 17:00'
  const eventVenue = import.meta.env.VITE_EVENT_VENUE || 'Havenpark Secondary School'
  const d = new Date(eventDate)
  const dateLabel = d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
  const [ticket, setTicket] = useState<StaffTicket | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchTicket = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('staff_tickets')
        .select('*, staff:staff_id (id, initials, surname, class_name, designation)')
        .eq('barcode', barcode)
        .maybeSingle()
      if (data) {
        setTicket(data as unknown as StaffTicket)
        const qrUrl = await generateQRCode(String(data.barcode))
        setQrCode(qrUrl)
      }
    } catch {
      toast.error('Failed to load staff ticket')
    } finally {
      setLoading(false)
    }
  }, [barcode])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  const downloadPDF = async () => {
    try {
      const el = document.getElementById('staff-ticket-card') as HTMLElement
      const canvas = await html2canvas(el, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const y = (pageHeight - imgHeight) / 2
      pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight)
      pdf.save(`TMSS-Staff-Ticket-${ticket?.barcode}.pdf`)
    } catch {
      toast.error('Failed to download ticket')
    }
  }

  const shareTicket = async () => {
    try {
      const shareData = {
        title: 'TMSS Staff Ticket',
        text: `Ticket for ${ticket?.staff?.initials} ${ticket?.staff?.surname} (${ticket?.staff?.class_name || ticket?.staff?.designation || 'Staff'})`,
        url: window.location.href,
      }
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Ticket link copied to clipboard')
      }
    } catch {
      toast.error('Failed to share ticket')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Loading staff ticket...</div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-amber-800 text-xl">Staff ticket not found</div>
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
          className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden"
        >
          <div id="staff-ticket-card" className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-amber-700">{appName}</h2>
              <p className="text-sm text-slate-600 mt-1">{eventVenue} • {dateLabel} • {eventTime}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-slate-600">Name</p>
                  <p className="text-lg font-semibold text-amber-800">{ticket.staff?.initials} {ticket.staff?.surname}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-slate-600">Role</p>
                  <p className="text-lg font-semibold text-amber-800">{ticket.staff?.class_name || ticket.staff?.designation || 'Staff'}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-slate-600">Ticket Code</p>
                  <p className="text-lg font-semibold text-amber-800">{ticket.barcode}</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="bg-white p-4 rounded-xl border border-amber-100">
                  <img src={qrCode} alt="Ticket QR" className="w-64 h-64" />
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={downloadPDF} className="bg-amber-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow">
                <Download className="w-5 h-5" />
                <span>Download Ticket</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={shareTicket} className="bg-white border-2 border-amber-600 text-amber-800 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 shadow">
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

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

export default StaffTicketPage
