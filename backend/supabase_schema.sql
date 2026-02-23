-- ====================================================
-- Exam Connect — Supabase Database Schema
-- MNSK College of Engineering
-- Run this in Supabase SQL Editor
-- ====================================================

-- Profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    department TEXT,
    reg_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    total_marks INT NOT NULL CHECK (total_marks > 0),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'results_published')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'text' CHECK (question_type IN ('mcq', 'text', 'file_upload')),
    options JSONB,
    correct_answer TEXT,
    marks INT NOT NULL CHECK (marks > 0),
    order_num INT NOT NULL
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'evaluated')),
    UNIQUE(exam_id, student_id)
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    marks_obtained INT NOT NULL DEFAULT 0,
    total_marks INT NOT NULL,
    percentage DECIMAL(5,2),
    grade TEXT,
    remarks TEXT,
    evaluated_by UUID REFERENCES profiles(id),
    published BOOLEAN DEFAULT FALSE,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- Indexes for performance
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_exam ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam ON results(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_published ON results(published);

-- ====================================================
-- Row Level Security (RLS) Policies
-- ====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role full access to profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Exams: teachers can manage their own, students can view scheduled/active
CREATE POLICY "Teachers manage own exams" ON exams FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students view available exams" ON exams FOR SELECT USING (status IN ('scheduled', 'active', 'results_published'));
CREATE POLICY "Service role full access to exams" ON exams FOR ALL USING (auth.role() = 'service_role');

-- Questions: teachers manage, students read during exam
CREATE POLICY "Teachers manage questions" ON questions FOR ALL USING (
    exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid())
);
CREATE POLICY "Students view questions" ON questions FOR SELECT USING (
    exam_id IN (SELECT id FROM exams WHERE status IN ('scheduled', 'active'))
);
CREATE POLICY "Service role full access to questions" ON questions FOR ALL USING (auth.role() = 'service_role');

-- Submissions: students manage own, teachers view for their exams
CREATE POLICY "Students manage own submissions" ON submissions FOR ALL USING (student_id = auth.uid());
CREATE POLICY "Teachers view submissions for their exams" ON submissions FOR SELECT USING (
    exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid())
);
CREATE POLICY "Service role full access to submissions" ON submissions FOR ALL USING (auth.role() = 'service_role');

-- Results: students view own published, teachers manage for their exams
CREATE POLICY "Students view own published results" ON results FOR SELECT USING (student_id = auth.uid() AND published = TRUE);
CREATE POLICY "Teachers manage results for their exams" ON results FOR ALL USING (
    exam_id IN (SELECT id FROM exams WHERE teacher_id = auth.uid())
);
CREATE POLICY "Service role full access to results" ON results FOR ALL USING (auth.role() = 'service_role');
