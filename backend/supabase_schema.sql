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
    gender TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female')),
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
-- Realtime & Communication Tables
-- ====================================================

-- Group Messages
CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Classes
CREATE TABLE IF NOT EXISTS live_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    room_id TEXT NOT NULL UNIQUE, -- For Jitsi/WebRTC room
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
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

-- Group Messages: Everyone can read and write
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all group messages" ON group_messages FOR SELECT USING (true);
CREATE POLICY "Users can insert group messages" ON group_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Live Classes: Teachers manage, everyone reads active classes
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers manage own live classes" ON live_classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Everyone reads active live classes" ON live_classes FOR SELECT USING (is_active = TRUE);

-- ====================================================
-- News & Announcements
-- ====================================================
CREATE TABLE IF NOT EXISTS news_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_news_active ON news_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_news_created ON news_announcements(created_at DESC);

ALTER TABLE news_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access to news" ON news_announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Everyone reads active news" ON news_announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Service role full access to news" ON news_announcements FOR ALL USING (auth.role() = 'service_role');
