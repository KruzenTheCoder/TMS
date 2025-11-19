import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QrCode, AlertCircle, CheckCircle, Camera } from 'lucide-react'
type DetectedCode = { rawValue?: string }
type LastScanBase = { id: string; name: string; student_id: string; class?: { name?: string } }
type LastScan = LastScanBase & { status: 'success' | 'fail'; message: string }
type FallbackTicket = { id: string; barcode: string; is_used: boolean; student: LastScanBase }
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

const BarcodeScanner = () => {
  const [scanning, setScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<LastScan | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [manualCode, setManualCode] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)

  useEffect(() => {
    checkCameraPermission()
  }, [])

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      const state = result.state
      setCameraPermission(state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'prompt')
    } catch (error) {
      console.log('Camera permission check failed:', error)
    }
  }

  const handleScan = async (detectedCodes: DetectedCode[]) => {
    if (!detectedCodes || detectedCodes.length === 0 || scanning) return

    const result = detectedCodes[0]?.rawValue
    if (!result) return

    setScanning(true)
    
    try {
      // The result should be the ticket barcode
      const barcode = result

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode })
      })

      if (response.status === 404) {
        await checkinFallback(barcode, 'scan')
      } else {
        let json: unknown = null
        const ct = response.headers.get('content-type')
        if (ct && ct.includes('application/json')) {
          try { json = await response.json() } catch { json = null }
        }
        if (!response.ok || !json) {
          toast.error('Check-in failed')
          setScanning(false)
          return
        }
        const data = json as { student?: LastScanBase }
        setLastScanned({
          ...(data.student as LastScanBase),
          status: 'success',
          message: 'Successfully checked in!'
        })
        toast.success(`${data.student?.name || 'Ticket'} checked in successfully!`)
      }

    } catch (error) {
      toast.error('Scanning failed. Please try again.')
      console.error('Scan error:', error)
    } finally {
      setScanning(false)
    }
  }

  const handleError = (error: unknown) => {
    console.error('Scanner error:', error)
    toast.error('Camera error. Please check permissions.')
  }

  const submitManual = async () => {
    const code = manualCode.trim()
    if (!code) {
      toast.error('Enter ticket code')
      return
    }
    setManualSubmitting(true)
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code })
      })
      if (response.status === 404) {
        await checkinFallback(code, 'manual')
        setManualCode('')
      } else {
        let json: unknown = null
        const ct = response.headers.get('content-type')
        if (ct && ct.includes('application/json')) {
          try { json = await response.json() } catch { json = null }
        }
        if (!response.ok || !json) {
          toast.error('Check-in failed')
          return
        }
        const data = json as { student?: LastScanBase }
        setLastScanned({
          ...(data.student as LastScanBase),
          status: 'success',
          message: 'Successfully checked in!'
        })
        toast.success(`${data.student?.name || 'Ticket'} checked in successfully!`)
        setManualCode('')
      }
    } catch (error) {
      toast.error('Check-in failed. Please try again.')
      console.error('Manual check-in error:', error)
    } finally {
      setManualSubmitting(false)
    }
  }

  const checkinFallback = async (barcode: string, method: 'manual' | 'scan') => {
    try {
      const { data: ticket, error: tErr } = await supabase
        .from('tickets')
        .select('id, barcode, is_used, student:student_id (id, name, student_id, class:class_id(name))')
        .eq('barcode', barcode)
        .maybeSingle()

      if (tErr || !ticket) {
        const { data: staffTicket } = await supabase
          .from('staff_tickets')
          .select('id, barcode, is_used, staff:staff_id (id, initials, surname, class_name, designation)')
          .eq('barcode', barcode)
          .maybeSingle()

        if (!staffTicket) {
          toast.error('Ticket not found')
          return
        }

        const st = staffTicket as unknown as StaffTicketRow
        if (st.is_used) {
          setLastScanned({ id: String(st.staff.id), name: `${st.staff.initials} ${st.staff.surname}`, student_id: `STAFF-${st.staff.id}`, class: { name: st.staff.class_name || st.staff.designation || 'STAFF' }, status: 'fail', message: 'Ticket already used' })
          toast.error('Ticket already used')
          return
        }

        const { error: aErr2 } = await supabase
          .from('staff_attendance')
          .insert([{ staff_id: st.staff.id, check_in_method: method, scanned_by: 'admin' }])

        const { error: uErr2 } = await supabase
          .from('staff_tickets')
          .update({ is_used: true })
          .eq('id', st.id)

        if (aErr2 || uErr2) {
          toast.error('Check-in failed (permissions)')
          return
        }

        setLastScanned({ id: String(st.staff.id), name: `${st.staff.initials} ${st.staff.surname}`, student_id: `STAFF-${st.staff.id}`, class: { name: st.staff.class_name || st.staff.designation || 'STAFF' }, status: 'success', message: 'Successfully checked in!' })
        toast.success(`${st.staff.surname || 'Ticket'} checked in successfully!`)
        return
      }

      const t = ticket as unknown as FallbackTicket

      if (t.is_used) {
        setLastScanned({
          ...t.student,
          status: 'fail',
          message: 'Ticket already used'
        })
        toast.error('Ticket already used')
        return
      }

      const nowIso = new Date().toISOString()

      const { error: sErr } = await supabase
        .from('students')
        .update({ attended: true, check_in_time: nowIso })
        .eq('id', t.student.id)

      const { error: aErr } = await supabase
        .from('attendance')
        .insert([{ student_id: t.student.id, check_in_method: method, scanned_by: 'admin' }])

      const { error: uErr } = await supabase
        .from('tickets')
        .update({ is_used: true })
        .eq('id', t.id)

      if (sErr || aErr || uErr) {
        toast.error('Check-in failed (permissions). Run migrations policies.')
        return
      }

      setLastScanned({
        ...t.student,
        status: 'success',
        message: 'Successfully checked in!'
      })
      toast.success(`${t.student?.name || 'Ticket'} checked in successfully!`)
    } catch (e) {
      toast.error('Fallback check-in failed')
      console.error('Fallback error:', e)
    }
  }

  if (cameraPermission === 'denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center py-8 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl p-8 shadow-xl">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Camera Access Denied</h2>
            <p className="text-slate-600 mb-6">
              Please enable camera access in your browser settings to use the barcode scanner.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Camera className="w-6 h-6 text-white" />
            <h1 className="text-3xl font-bold text-white">Entry Scanner</h1>
          </div>
          <p className="text-yellow-400">Scan student tickets for check-in</p>
        </motion.div>
        {lastScanned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`sticky top-4 z-10 rounded-xl shadow-xl p-4 mb-6 ${
              lastScanned.status === 'success' 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {lastScanned.status === 'success' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className={`text-base font-bold ${
                  lastScanned.status === 'success' ? 'text-green-900' : 'text-red-900'
                }`}>
                  {lastScanned.name}
                </h3>
                <p className={`text-sm ${
                  lastScanned.status === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastScanned.message}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Student ID: {lastScanned.student_id} • Class: {lastScanned.class?.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Scanner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden mb-8"
        >
          <div className="p-6">
            <div className="text-center mb-6">
              <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Scan Ticket QR Code</h2>
              <p className="text-slate-600">Position the QR code within the camera frame</p>
            </div>

            <div className="relative">
              <div className="w-full max-w-md mx-auto aspect-square bg-slate-100 rounded-lg overflow-hidden">
                <QrScanner
                  onScan={handleScan}
                  onError={handleError}
                  constraints={{
                    facingMode: 'environment'
                  }}
                  scanDelay={1000}
                />
              </div>
              
              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-yellow-400 rounded-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-yellow-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-yellow-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-yellow-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-yellow-400"></div>
                </div>
              </div>
            </div>

            {scanning && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Manual Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl shadow-xl overflow-hidden mb-8"
        >
          <div className="p-6">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Enter Ticket Code Manually</h2>
              <p className="text-slate-600">Use this if the QR code does not scan</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter ticket code"
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none"
              />
              <button
                onClick={submitManual}
                disabled={manualSubmitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {manualSubmitting ? 'Checking...' : 'Check In'}
              </button>
            </div>
          </div>
        </motion.div>

        

        {/* Instructions */}
        <div className="mt-8 text-center text-white">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Scanning Instructions:</h3>
            <ul className="text-sm space-y-1 opacity-80">
              <li>• Hold the ticket steady in the camera frame</li>
              <li>• Ensure good lighting for best results</li>
              <li>• Wait for the confirmation before scanning the next ticket</li>
              <li>• Each ticket can only be used once</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner
type StaffTicketRow = { id: string; barcode: string; is_used: boolean; staff: { id: number; initials: string; surname: string; class_name?: string | null; designation?: string | null } }
