'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { FileText, Clock, ClipboardList, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../lib/api';

export default function TeacherDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/teacher/dashboard')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const stats = data ? [
        { label: 'Total Exams', value: data.total_exams, icon: FileText, color: '#8b5cf6' },
        { label: 'Active Exams', value: data.active_exams, icon: Clock, color: '#3b82f6' },
        { label: 'Submissions', value: data.total_submissions, icon: ClipboardList, color: '#14b8a6' },
        { label: 'Pending Review', value: data.pending_evaluations, icon: AlertCircle, color: '#f97316' },
    ] : [];

    const chartData = (data?.recent_exams || []).map((e: any) => ({
        name: e.title?.substring(0, 12) || 'Exam',
        marks: e.total_marks,
    }));

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Teacher Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Your exams and evaluation overview</p>
            </div>

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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                        {/* Bar Chart */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="glass-card" style={{ padding: 28 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Exam Marks Overview</h3>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff' }} />
                                        <Bar dataKey="marks" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                        <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" />
                                                <stop offset="100%" stopColor="#3b82f6" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No exams yet</p>
                            )}
                        </motion.div>

                        {/* Recent Exams */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="glass-card" style={{ padding: 28 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Recent Exams</h3>
                            {(data?.recent_exams || []).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No exams created yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data.recent_exams.map((exam: any) => (
                                        <div key={exam.id} style={{
                                            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exam.title}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exam.subject} • {exam.duration_minutes}min • {exam.total_marks} marks</p>
                                            </div>
                                            <span className={`badge badge-${exam.status}`}>{exam.status}</span>
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
