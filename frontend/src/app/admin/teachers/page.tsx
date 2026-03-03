'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { BarChart2, Search, FileText, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../../lib/api';

export default function AdminTeacherActivityPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.get('/api/admin/analytics/teachers')
            .then(res => setTeachers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const filtered = teachers.filter(t =>
        t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.email?.toLowerCase().includes(search.toLowerCase()) ||
        t.department?.toLowerCase().includes(search.toLowerCase())
    );

    const chartData = [...teachers]
        .sort((a, b) => (b.total_exams || 0) - (a.total_exams || 0))
        .slice(0, 6)
        .map(t => ({
            name: t.full_name?.split(' ')[0] || 'Teacher',
            exams: t.total_exams,
            submissions: t.total_submissions_received,
            evaluated: t.evaluated_count,
        }));

    const STAT_COLORS = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f97316'];

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Teacher Activity</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Monitor teacher engagement, exam creation, and evaluation progress</p>
            </div>

            {/* Summary stats */}
            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Total Teachers', value: teachers.length, color: '#8b5cf6' },
                        { label: 'Total Exams Created', value: teachers.reduce((a, t) => a + (t.total_exams || 0), 0), color: '#3b82f6' },
                        { label: 'Submissions Received', value: teachers.reduce((a, t) => a + (t.total_submissions_received || 0), 0), color: '#14b8a6' },
                        { label: 'Evaluated', value: teachers.reduce((a, t) => a + (t.evaluated_count || 0), 0), color: '#4ade80' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="stat-card" style={{ padding: 18 }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{stat.label}</p>
                            <p style={{ fontSize: '1.7rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Activity Chart */}
            {!loading && chartData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart2 size={18} color="#a78bfa" /> Exam Activity by Teacher
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barGap={4}>
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff' }} />
                            <Bar dataKey="exams" name="Exams" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="submissions" name="Submissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="evaluated" name="Evaluated" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                        {[['#8b5cf6', 'Exams'], ['#3b82f6', 'Submissions'], ['#4ade80', 'Evaluated']].map(([c, l]) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search teachers by name, email, department…"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', color: 'white', padding: '11px 16px 11px 40px', borderRadius: 10, outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            {loading ? (
                <div>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 90, marginBottom: 12, borderRadius: 12 }} />)}</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((t, i) => {
                        const isOpen = expanded.has(t.id);
                        const evalRate = t.total_submissions_received > 0 ? Math.round((t.evaluated_count / t.total_submissions_received) * 100) : null;
                        return (
                            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className="glass-card" style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 3 }}>{t.full_name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {t.email}{t.department ? ` • ${t.department}` : ''}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#8b5cf6' }}>{t.total_exams}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Exams</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#3b82f6' }}>{t.total_submissions_received}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: 800, fontSize: '1.3rem', color: '#4ade80' }}>{t.evaluated_count}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evaluated</p>
                                        </div>
                                        {evalRate !== null && (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontWeight: 800, fontSize: '1.3rem', color: evalRate === 100 ? '#4ade80' : evalRate >= 50 ? '#fbbf24' : '#f87171' }}>{evalRate}%</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eval Rate</p>
                                            </div>
                                        )}
                                        {t.exams?.length > 0 && (
                                            <button onClick={() => toggleExpand(t.id)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>
                                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                {isOpen ? 'Hide' : 'Exams'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {isOpen && t.exams?.length > 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {t.exams.map((ex: any) => (
                                            <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ex.title}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.subject}</p>
                                                </div>
                                                <span className={`badge badge-${ex.status}`}>{ex.status}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                    {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No teachers found</p>}
                </div>
            )}
        </DashboardLayout>
    );
}
