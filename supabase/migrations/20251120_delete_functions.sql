-- Functions to perform server-side deletions with SECURITY DEFINER
-- Ensures entries are removed from the database even with RLS enabled

create or replace function public.delete_student_registration(p_student_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.attendance where student_id = p_student_id;
  delete from public.tickets where student_id = p_student_id;
  delete from public.students where id = p_student_id;
$$;

create or replace function public.delete_staff_registration(p_staff_id integer)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.staff_attendance where staff_id = p_staff_id;
  delete from public.staff_tickets where staff_id = p_staff_id;
$$;

grant execute on function public.delete_student_registration(uuid) to anon, authenticated;
grant execute on function public.delete_staff_registration(integer) to anon, authenticated;
