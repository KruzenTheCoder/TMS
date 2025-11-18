create extension if not exists pgcrypto;
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  employee_id text,
  is_active boolean default true
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  grade text,
  form_teacher_id uuid references public.teachers(id),
  total_students integer default 0
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_id text unique not null,
  name text not null,
  email text,
  class_id uuid references public.classes(id) on delete set null,
  registered boolean default false,
  attended boolean default false,
  check_in_time timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  barcode text unique not null,
  ticket_data jsonb,
  is_used boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  check_in_time timestamptz default now(),
  check_in_method text,
  scanned_by text
);

create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_tickets_student on public.tickets(student_id);
create index if not exists idx_attendance_student on public.attendance(student_id);
