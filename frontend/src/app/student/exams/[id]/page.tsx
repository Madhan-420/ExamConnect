'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Clock, Send, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../../lib/api';

export default function TakeExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        api.get(`/api/student/exams/${examId}`)
            .then(res => {
                setExam(res.data);
                setTimeLeft(res.data.duration_minutes * 60);
            })
            .catch(err => setError(err.response?.data?.detail || 'Failed to load exam'))
            .finally(() => setLoading(false));
    }, [examId]);

    // Countdown timer
    useEffect(() => {
        if (!exam || submitted || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [exam, submitted]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await api.post(`/api/student/exams/${examId}/submit`, { answers });
            setSubmitted(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to submit');
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 40, height: 40, border: '3px solid var(--border-glass)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%' }} />
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>{error}</p>
                    <button className="btn-secondary" onClick={() => router.push('/student/exams')} style={{ marginTop: 20 }}>
                        Back to Exams
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    if (submitted) {
        return (
            <DashboardLayout>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass-card" style={{ padding: 60, textAlign: 'center', maxWidth: 500, margin: '60px auto' }}>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                        <CheckCircle size={64} color="#4ade80" style={{ margin: '0 auto 20px' }} />
                    </motion.div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Exam Submitted!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Your answers have been recorded successfully.</p>
                    <button className="btn-primary" onClick={() => router.push('/student/dashboard')}>
                        Back to Dashboard
                    </button>
                </motion.div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header with timer */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 28, flexWrap: 'wrap', gap: 16,
                position: 'sticky', top: 0, zIndex: 20,
                background: 'var(--bg-primary)', padding: '16px 0',
            }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>{exam.title}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{exam.subject} • {exam.total_marks} marks</p>
                </div>
                <div style={{
                    padding: '12px 24px', borderRadius: 'var(--radius-md)',
                    background: timeLeft < 300 ? 'rgba(239,68,68,0.15)' : 'rgba(139,92,246,0.12)',
                    border: `1px solid ${timeLeft < 300 ? 'rgba(239,68,68,0.3)' : 'rgba(139,92,246,0.25)'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <Clock size={18} color={timeLeft < 300 ? '#ef4444' : '#a78bfa'} />
                    <span style={{
                        fontSize: '1.3rem', fontWeight: 700, fontFamily: 'monospace',
                        color: timeLeft < 300 ? '#ef4444' : 'var(--text-primary)',
                    }}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(exam.questions || []).map((q: any, i: number) => (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                                <span style={{ color: 'var(--accent-purple)', marginRight: 8 }}>Q{q.order_num}.</span>
                                {q.question_text}
                            </h3>
                            <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', flexShrink: 0 }}>{q.marks}m</span>
                        </div>

                        {q.question_type === 'mcq' && q.options ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt: string, oi: number) => (
                                    <label key={oi} style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                        background: answers[q.id] === opt ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${answers[q.id] === opt ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                    }}>
                                        <input type="radio" name={q.id} value={opt}
                                            checked={answers[q.id] === opt}
                                            onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                                            style={{ accentColor: 'var(--accent-purple)' }} />
                                        <span style={{ fontSize: '0.9rem' }}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                className="input-field"
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                style={{ minHeight: 100 }}
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Submit */}
            <div style={{ marginTop: 32, textAlign: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="btn-primary" onClick={handleSubmit} disabled={submitting}
                    style={{ padding: '16px 48px', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    {submitting ? 'Submitting...' : <><Send size={18} /> Submit Exam</>}
                </motion.button>
            </div>
        </DashboardLayout>
    );
}
