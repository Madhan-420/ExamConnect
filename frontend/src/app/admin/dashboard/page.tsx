'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Users, GraduationCap, FileText, ClipboardList, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../lib/api';

interface DashboardData {
    total_users: number;
    total_teachers: number;
    total_students: number;
    total_exams: number;
    total_submissions: number;
    recent_exams: any[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/admin/dashboard')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const stats = data ? [
        { label: 'Total Users', value: data.total_users, icon: Users, color: '#8b5cf6' },
        { label: 'Teachers', value: data.total_teachers, icon: GraduationCap, color: '#3b82f6' },
        { label: 'Students', value: data.total_students, icon: Users, color: '#14b8a6' },
        { label: 'Exams', value: data.total_exams, icon: FileText, color: '#f97316' },
        { label: 'Submissions', value: data.total_submissions, icon: ClipboardList, color: '#ec4899' },
    ] : [];

    const pieData = data ? [
        { name: 'Teachers', value: data.total_teachers, color: '#3b82f6' },
        { name: 'Students', value: data.total_students, color: '#14b8a6' },
        { name: 'Admin', value: 1, color: '#ec4899' },
    ] : [];

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)' }}>System overview and analytics</p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
                    ))}
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="stat-card"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                            {stat.label}
                                        </p>
                                        <p style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</p>
                                    </div>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <stat.icon size={22} color={stat.color} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                        {/* Pie Chart - User Distribution */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="glass-card" style={{ padding: 28 }}
                        >
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Users size={18} color="var(--accent-purple)" /> User Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={5}>
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                                {pieData.map(entry => (
                                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color }} />
                                        {entry.name}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Exams */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="glass-card" style={{ padding: 28 }}
                        >
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <FileText size={18} color="var(--accent-blue)" /> Recent Exams
                            </h3>
                            {(data?.recent_exams || []).length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No exams yet</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {data?.recent_exams.map((exam: any) => (
                                        <div key={exam.id} style={{
                                            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exam.title}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exam.subject}</p>
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
