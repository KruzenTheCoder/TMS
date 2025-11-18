alter table public.classes enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.tickets enable row level security;
alter table public.attendance enable row level security;

drop policy if exists classes_select_anon on public.classes;
create policy classes_select_anon on public.classes for select to anon using (true);

drop policy if exists teachers_select_anon on public.teachers;
create policy teachers_select_anon on public.teachers for select to anon using (true);

drop policy if exists students_select_anon on public.students;
create policy students_select_anon on public.students for select to anon using (true);

drop policy if exists tickets_select_anon on public.tickets;
create policy tickets_select_anon on public.tickets for select to anon using (true);

drop policy if exists students_insert_anon on public.students;
create policy students_insert_anon on public.students for insert to anon with check (true);

drop policy if exists students_update_anon on public.students;
create policy students_update_anon on public.students for update to anon using (true) with check (true);

drop policy if exists tickets_insert_anon on public.tickets;
create policy tickets_insert_anon on public.tickets for insert to anon with check (true);

drop policy if exists tickets_update_anon on public.tickets;
create policy tickets_update_anon on public.tickets for update to anon using (true) with check (true);

drop policy if exists attendance_select_anon on public.attendance;
create policy attendance_select_anon on public.attendance for select to anon using (true);

drop policy if exists attendance_insert_anon on public.attendance;
create policy attendance_insert_anon on public.attendance for insert to anon with check (true);
