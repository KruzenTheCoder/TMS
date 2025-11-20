-- Ensure single ticket per student and per staff
do $$
begin
  begin
    create unique index if not exists tickets_unique_student on public.tickets(student_id);
  exception when others then null; end;
  begin
    create unique index if not exists staff_tickets_unique_staff on public.staff_tickets(staff_id);
  exception when others then null; end;
end $$;
