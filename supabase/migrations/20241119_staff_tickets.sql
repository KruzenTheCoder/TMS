create table if not exists public.staff_tickets (
  id uuid primary key default gen_random_uuid(),
  staff_id bigint references public.authorized_staff(id) on delete cascade,
  barcode text unique not null,
  ticket_data jsonb,
  is_used boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id bigint references public.authorized_staff(id) on delete cascade,
  check_in_time timestamptz default now(),
  check_in_method text,
  scanned_by text
);

create index if not exists idx_staff_tickets_staff on public.staff_tickets(staff_id);
create index if not exists idx_staff_tickets_barcode on public.staff_tickets(barcode);
create index if not exists idx_staff_attendance_staff on public.staff_attendance(staff_id);

alter table public.staff_tickets enable row level security;
alter table public.staff_attendance enable row level security;

drop policy if exists staff_tickets_read_all on public.staff_tickets;
create policy staff_tickets_read_all on public.staff_tickets for select to anon using (true);
drop policy if exists staff_attendance_read_all on public.staff_attendance;
create policy staff_attendance_read_all on public.staff_attendance for select to anon using (true);

drop policy if exists staff_tickets_allow_insert on public.staff_tickets;
create policy staff_tickets_allow_insert on public.staff_tickets for insert to anon
with check (
  exists (
    select 1 from public.authorized_staff a where a.id = staff_id
  )
);

drop policy if exists staff_attendance_allow_insert on public.staff_attendance;
create policy staff_attendance_allow_insert on public.staff_attendance for insert to anon
with check (
  exists (
    select 1 from public.authorized_staff a where a.id = staff_id
  )
);
