'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle, TrendingUp, Trophy } from 'lucide-react';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

export default function StudentDashboard() {
    const { profile } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    useEffect(() => {
        api.get('/api/student/dashboard')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const stats = data ? [
        { label: 'Upcoming Exams', value: (data.upcoming_exams || []).length, icon: Clock, color: '#3b82f6' },
        { label: 'Completed', value: data.completed_exams, icon: CheckCircle, color: '#14b8a6' },
        { label: 'Submissions', value: data.total_submissions, icon: BookOpen, color: '#8b5cf6' },
        { label: 'Avg Score', value: data.average_percentage ? `${data.average_percentage}%` : 'N/A', icon: TrendingUp, color: '#f97316' },
    ] : [];

    return (
        <DashboardLayout>
            {/* Premium Welcome Header */}
            <motion.div className="welcome-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14,
                            background: 'var(--role-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(var(--role-accent-rgb), 0.3)',
                        }}>
                            <BookOpen size={26} color="white" />
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>{getGreeting()}</p>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                                <span className="shimmer-text">{profile?.full_name || 'Student'}</span>
                            </h1>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>Student — Academic Dashboard</p>
                        </div>
                    </div>
                    <div style={{
                        padding: '8px 16px', borderRadius: 12,
                        background: 'rgba(var(--role-accent-rgb), 0.08)',
                        border: '1px solid rgba(var(--role-accent-rgb), 0.15)',
                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                    }}>
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {stats.map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }} className="stat-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{stat.label}</p>
                                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</p>
                                    </div>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <stat.icon size={22} color={stat.color} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                        {/* Upcoming Exams */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="glass-card" style={{ padding: 28 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clock size={18} color="var(--accent-blue)" /> Upcoming Exams
                            </h3>
                            {(data?.upcoming_exams || []).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No upcoming exams</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data.upcoming_exams.slice(0, 5).map((exam: any) => {
                                        const examDate = new Date(exam.scheduled_at);
                                        const now = new Date();
                                        const diff = examDate.getTime() - now.getTime();
                                        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                        return (
                                            <div key={exam.id} style={{
                                                padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{exam.title}</p>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                            {exam.subject} • {exam.duration_minutes}min • {exam.total_marks} marks
                                                        </p>
                                                    </div>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                                        background: daysLeft <= 1 ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                                        color: daysLeft <= 1 ? '#ef4444' : '#60a5fa',
                                                    }}>
                                                        {daysLeft <= 0 ? 'Today!' : `${daysLeft}d left`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* Recent Results */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="glass-card" style={{ padding: 28 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Trophy size={18} color="var(--accent-orange)" /> Recent Results
                            </h3>
                            {(data?.recent_results || []).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No results yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data.recent_results.map((r: any) => (
                                        <div key={r.id} style={{
                                            padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.exam?.title || 'Exam'}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.exam?.subject}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: r.percentage >= 50 ? '#4ade80' : '#ef4444' }}>
                                                        {r.percentage}%
                                                    </p>
                                                    <span className="badge" style={{
                                                        background: r.grade === 'F' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                                        color: r.grade === 'F' ? '#ef4444' : '#4ade80',
                                                    }}>Grade: {r.grade}</span>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${r.percentage}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    style={{
                                                        height: '100%', borderRadius: 3,
                                                        background: r.percentage >= 50 ? 'linear-gradient(90deg, #14b8a6, #3b82f6)' : 'linear-gradient(90deg, #ef4444, #f97316)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
