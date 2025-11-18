-- Insert sample classes
INSERT INTO classes (name, grade, total_students) VALUES
('12A', 'Grade 12', 0),
('12B', 'Grade 12', 0),
('12C', 'Grade 12', 0),
('12D', 'Grade 12', 0),
('12E', 'Grade 12', 0),
('12F', 'Grade 12', 0),
('12G', 'Grade 12', 0),
('12H', 'Grade 12', 0);

-- Insert sample teachers
INSERT INTO teachers (name, email, employee_id) VALUES
('Mrs. Smith', 'smith@tmss.edu.za', 'T001'),
('Mr. Johnson', 'johnson@tmss.edu.za', 'T002'),
('Ms. Williams', 'williams@tmss.edu.za', 'T003'),
('Mr. Brown', 'brown@tmss.edu.za', 'T004'),
('Mrs. Davis', 'davis@tmss.edu.za', 'T005'),
('Mr. Wilson', 'wilson@tmss.edu.za', 'T006'),
('Ms. Taylor', 'taylor@tmss.edu.za', 'T007'),
('Mr. Anderson', 'anderson@tmss.edu.za', 'T008');

-- Update classes with form teachers
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'smith@tmss.edu.za') WHERE name = '12A';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'johnson@tmss.edu.za') WHERE name = '12B';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'williams@tmss.edu.za') WHERE name = '12C';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'brown@tmss.edu.za') WHERE name = '12D';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'davis@tmss.edu.za') WHERE name = '12E';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'wilson@tmss.edu.za') WHERE name = '12F';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'taylor@tmss.edu.za') WHERE name = '12G';
UPDATE classes SET form_teacher_id = (SELECT id FROM teachers WHERE email = 'anderson@tmss.edu.za') WHERE name = '12H';