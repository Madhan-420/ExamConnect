'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../../../lib/api';

export default function StudentExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/student/exams')
            .then(res => setExams(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Available Exams</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View and take your scheduled exams</p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            ) : exams.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No exams available right now</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    {exams.map((exam, i) => {
                        const examDate = new Date(exam.scheduled_at);
                        const now = new Date();
                        const diff = examDate.getTime() - now.getTime();
                        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

                        return (
                            <motion.div key={exam.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{exam.title}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exam.subject}</p>
                                        {exam.teacher_name && (
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>by {exam.teacher_name}</p>
                                        )}
                                    </div>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                        background: daysLeft <= 1 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                        color: daysLeft <= 1 ? '#ef4444' : '#60a5fa',
                                    }}>
                                        {daysLeft <= 0 ? 'Today!' : `${daysLeft}d left`}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 16, marginBottom: 18, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {exam.duration_minutes}min</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Award size={14} /> {exam.total_marks} marks</span>
                                </div>

                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                                    {examDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                                    {examDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>

                                {exam.already_submitted ? (
                                    <div style={{
                                        marginTop: 16, padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                                        color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600,
                                    }}>
                                        <CheckCircle size={16} /> Already Submitted
                                    </div>
                                ) : (
                                    <Link href={`/student/exams/${exam.id}`}>
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            className="btn-primary" style={{ marginTop: 16, width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            Take Exam <ArrowRight size={16} />
                                        </motion.button>
                                    </Link>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
