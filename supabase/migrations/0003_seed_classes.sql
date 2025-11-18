insert into public.classes (name, grade)
values ('12A','12'),('12B','12'),('12C','12'),('12D','12'),('12E','12'),('12F','12')
on conflict (name) do nothing;
