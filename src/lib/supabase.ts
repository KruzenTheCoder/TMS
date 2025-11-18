import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

function createStubClient() {
  const builder = {
    select() {
      return builder
    },
    eq() {
      return builder
    },
    single() {
      return Promise.resolve({ data: null, error: { message: 'Not configured' } })
    },
    maybeSingle() {
      return Promise.resolve({ data: null, error: { message: 'Not configured' } })
    },
    insert() {
      return {
        select() {
          return Promise.resolve({ data: null, error: { message: 'Not configured' } })
        },
        single() {
          return Promise.resolve({ data: null, error: { message: 'Not configured' } })
        },
      }
    },
  }
  return {
    from() {
      return builder
    },
  } as any
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createStubClient()

export interface Student {
  id: string
  student_id: string
  name: string
  email: string
  class_id: string
  registered: boolean
  attended: boolean
  check_in_time: string | null
  created_at: string
  class?: Class
}

export interface Class {
  id: string
  name: string
  grade: string
  form_teacher_id: string
  total_students: number
  form_teacher?: Teacher
}

export interface Teacher {
  id: string
  name: string
  email: string
  employee_id: string
  is_active: boolean
}

export interface Ticket {
  id: string
  student_id: string
  barcode: string
  ticket_data: any
  is_used: boolean
  created_at: string
  student?: Student
}

export interface Attendance {
  id: string
  student_id: string
  check_in_time: string
  check_in_method: string
  scanned_by: string | null
  student?: Student
}
