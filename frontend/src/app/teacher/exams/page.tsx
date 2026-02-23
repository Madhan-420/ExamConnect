'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, Eye, Send, ChevronRight, X, FileText, Clock, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

export default function TeacherExamsPage() {
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showQuestions, setShowQuestions] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [examForm, setExamForm] = useState({
        title: '', subject: '', description: '', scheduled_at: '',
        duration_minutes: 60, total_marks: 100,
    });

    const [questionForm, setQuestionForm] = useState({
        question_text: '', question_type: 'text', options: ['', '', '', ''],
        correct_answer: '', marks: 10, order_num: 1,
    });

    const fetchExams = () => {
        api.get('/api/teacher/exams')
            .then(res => setExams(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchExams(); }, []);

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/teacher/exams', examForm);
            setShowCreate(false);
            setExamForm({ title: '', subject: '', description: '', scheduled_at: '', duration_minutes: 60, total_marks: 100 });
            fetchExams();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to create exam');
        }
        setSubmitting(false);
    };

    const handleDeleteExam = async (id: string) => {
        if (!confirm('Delete this exam?')) return;
        try {
            await api.delete(`/api/teacher/exams/${id}`);
            fetchExams();
        } catch (err: any) { alert(err.response?.data?.detail || 'Failed'); }
    };

    const handlePublish = async (id: string) => {
        try {
            await api.post(`/api/teacher/exams/${id}/publish`);
            fetchExams();
        } catch (err: any) { alert(err.response?.data?.detail || 'Failed'); }
    };

    const handlePublishResults = async (id: string) => {
        try {
            await api.post(`/api/teacher/exams/${id}/publish-results`);
            fetchExams();
        } catch (err: any) { alert(err.response?.data?.detail || 'Failed'); }
    };

    const openQuestions = async (examId: string) => {
        setShowQuestions(examId);
        try {
            const res = await api.get(`/api/teacher/exams/${examId}/questions`);
            setQuestions(res.data);
            setQuestionForm(prev => ({ ...prev, order_num: (res.data.length || 0) + 1 }));
        } catch { setQuestions([]); }
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showQuestions) return;
        setSubmitting(true);
        try {
            const payload = { ...questionForm };
            if (payload.question_type !== 'mcq') {
                (payload as any).options = null;
            } else {
                (payload as any).options = payload.options.filter((o: string) => o.trim());
            }
            await api.post(`/api/teacher/exams/${showQuestions}/questions`, [payload]);
            const res = await api.get(`/api/teacher/exams/${showQuestions}/questions`);
            setQuestions(res.data);
            setQuestionForm({
                question_text: '', question_type: 'text', options: ['', '', '', ''],
                correct_answer: '', marks: 10, order_num: (res.data.length || 0) + 1,
            });
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed');
        }
        setSubmitting(false);
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>My Exams</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create, manage, and publish exams</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="btn-primary" onClick={() => setShowCreate(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={18} /> Create Exam
                </motion.button>
            </div>

            {/* Exams Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            ) : exams.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No exams yet. Create your first exam!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {exams.map((exam, i) => (
                        <motion.div key={exam.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{exam.title}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exam.subject}</p>
                                </div>
                                <span className={`badge badge-${exam.status}`}>{exam.status}</span>
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginBottom: 18, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {exam.duration_minutes}min</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Award size={14} /> {exam.total_marks} marks</span>
                            </div>

                            {exam.description && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                                    {exam.description.substring(0, 100)}{exam.description.length > 100 ? '...' : ''}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button onClick={() => openQuestions(exam.id)} className="btn-secondary"
                                    style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Eye size={14} /> Questions
                                </button>
                                <button onClick={() => router.push(`/teacher/exams/${exam.id}/evaluate`)} className="btn-secondary"
                                    style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Edit3 size={14} /> Evaluate
                                </button>
                                {exam.status === 'draft' && (
                                    <button onClick={() => handlePublish(exam.id)} className="btn-primary"
                                        style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Send size={14} /> Publish
                                    </button>
                                )}
                                {exam.status === 'completed' && (
                                    <button onClick={() => handlePublishResults(exam.id)} className="btn-primary"
                                        style={{ padding: '8px 14px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #f97316, #ec4899)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Award size={14} /> Publish Results
                                    </button>
                                )}
                                <button onClick={() => handleDeleteExam(exam.id)} className="btn-danger"
                                    style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Exam Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowCreate(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="modal-content" onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Create New Exam</h2>
                                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div><label className="form-label">Title</label><input className="input-field" value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} required /></div>
                                <div><label className="form-label">Subject</label><input className="input-field" value={examForm.subject} onChange={e => setExamForm({ ...examForm, subject: e.target.value })} required /></div>
                                <div><label className="form-label">Description</label><textarea className="input-field" value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} /></div>
                                <div><label className="form-label">Scheduled Date & Time</label><input type="datetime-local" className="input-field" value={examForm.scheduled_at} onChange={e => setExamForm({ ...examForm, scheduled_at: e.target.value })} required /></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div><label className="form-label">Duration (min)</label><input type="number" className="input-field" value={examForm.duration_minutes} onChange={e => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })} required /></div>
                                    <div><label className="form-label">Total Marks</label><input type="number" className="input-field" value={examForm.total_marks} onChange={e => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) })} required /></div>
                                </div>
                                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 8 }}>
                                    {submitting ? 'Creating...' : 'Create Exam'}
                                </motion.button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Questions Modal */}
            <AnimatePresence>
                {showQuestions && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setShowQuestions(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="modal-content" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Questions</h2>
                                <button onClick={() => setShowQuestions(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Existing Questions */}
                            {questions.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    {questions.map((q, i) => (
                                        <div key={q.id} style={{
                                            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                                            marginBottom: 8,
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Q{q.order_num}. {q.question_text}</p>
                                                <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{q.marks}m</span>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Type: {q.question_type}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Question Form */}
                            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 20 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Add Question</h3>
                                <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div><label className="form-label">Question Text</label><textarea className="input-field" value={questionForm.question_text} onChange={e => setQuestionForm({ ...questionForm, question_text: e.target.value })} required /></div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label className="form-label">Type</label>
                                            <select className="input-field" value={questionForm.question_type} onChange={e => setQuestionForm({ ...questionForm, question_type: e.target.value })}>
                                                <option value="text">Text</option><option value="mcq">MCQ</option><option value="file_upload">File Upload</option>
                                            </select>
                                        </div>
                                        <div><label className="form-label">Marks</label><input type="number" className="input-field" value={questionForm.marks} onChange={e => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })} /></div>
                                        <div><label className="form-label">Order</label><input type="number" className="input-field" value={questionForm.order_num} onChange={e => setQuestionForm({ ...questionForm, order_num: parseInt(e.target.value) })} /></div>
                                    </div>
                                    {questionForm.question_type === 'mcq' && (
                                        <div>
                                            <label className="form-label">Options</label>
                                            {questionForm.options.map((opt, i) => (
                                                <input key={i} className="input-field" placeholder={`Option ${i + 1}`} value={opt}
                                                    onChange={e => { const o = [...questionForm.options]; o[i] = e.target.value; setQuestionForm({ ...questionForm, options: o }); }}
                                                    style={{ marginBottom: 6 }} />
                                            ))}
                                        </div>
                                    )}
                                    <div><label className="form-label">Correct Answer</label><input className="input-field" value={questionForm.correct_answer} onChange={e => setQuestionForm({ ...questionForm, correct_answer: e.target.value })} /></div>
                                    <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} className="btn-primary" style={{ padding: 12 }}>
                                        {submitting ? 'Adding...' : 'Add Question'}
                                    </motion.button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
