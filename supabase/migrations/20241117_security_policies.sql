-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Students table policies
CREATE POLICY "Allow registration" ON students FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Students view own data" ON students FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admin full access students" ON students FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Tickets table policies
CREATE POLICY "Students view own tickets" ON tickets FOR SELECT TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Admin manage tickets" ON tickets FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Classes table policies
CREATE POLICY "Public view classes" ON classes FOR SELECT TO anon
USING (true);

CREATE POLICY "Admin manage classes" ON classes FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Teachers table policies
CREATE POLICY "Public view teachers" ON teachers FOR SELECT TO anon
USING (true);

CREATE POLICY "Admin manage teachers" ON teachers FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Attendance table policies
CREATE POLICY "Admin manage attendance" ON attendance FOR ALL TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON classes TO anon;
GRANT SELECT ON teachers TO anon;
GRANT INSERT ON students TO anon;
GRANT SELECT ON students TO authenticated;
GRANT ALL ON students TO authenticated;
GRANT SELECT ON tickets TO authenticated;
GRANT ALL ON tickets TO authenticated;
GRANT SELECT ON attendance TO authenticated;
GRANT ALL ON attendance TO authenticated;