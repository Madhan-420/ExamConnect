'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { GraduationCap, Search, TrendingUp, FileText, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../../lib/api';

const gradeColor = (g: string) => {
    if (['A+', 'A'].includes(g)) return '#4ade80';
    if (['B+', 'B'].includes(g)) return '#60a5fa';
    if (g === 'C') return '#fbbf24';
    if (g === 'D') return '#f97316';
    return '#ef4444';
};

const perfColor = (p: number | null) => {
    if (p === null) return '#6b7280';
    if (p >= 75) return '#4ade80';
    if (p >= 50) return '#fbbf24';
    return '#ef4444';
};

export default function AdminStudentPerformancePage() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<any | null>(null);

    useEffect(() => {
        api.get('/api/admin/analytics/students')
            .then(res => setStudents(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = students.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.reg_number?.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.toLowerCase().includes(search.toLowerCase())
    );

    const topPerformers = [...students]
        .filter(s => s.average_percentage !== null)
        .sort((a, b) => (b.average_percentage || 0) - (a.average_percentage || 0))
        .slice(0, 5);

    const chartData = topPerformers.map(s => ({
        name: s.full_name?.split(' ')[0] || 'Student',
        avg: s.average_percentage,
    }));

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Student Performance</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View grades, scores, and performance across all students</p>
            </div>

            {/* Summary stats */}
            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Total Students', value: students.length, color: '#8b5cf6' },
                        { label: 'With Results', value: students.filter(s => s.total_results > 0).length, color: '#3b82f6' },
                        { label: 'Avg Score', value: students.filter(s => s.average_percentage).length > 0 ? `${Math.round(students.filter(s => s.average_percentage).reduce((acc, s) => acc + s.average_percentage, 0) / students.filter(s => s.average_percentage).length)}%` : '—', color: '#14b8a6' },
                        { label: 'Total Submissions', value: students.reduce((acc, s) => acc + (s.total_submissions || 0), 0), color: '#f97316' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="stat-card" style={{ padding: 18 }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{stat.label}</p>
                            <p style={{ fontSize: '1.7rem', fontWeight: 800, color: stat.color }}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Top Performers chart */}
            {!loading && chartData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={18} color="#a78bfa" /> Top Performers (Avg %)
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                            <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff' }} />
                            <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                                {chartData.map((_, i) => (
                                    <Cell key={i} fill={['#8b5cf6', '#3b82f6', '#14b8a6', '#f97316', '#ec4899'][i % 5]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email, reg number, department…"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)', color: 'white', padding: '11px 16px 11px 40px', borderRadius: 10, outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>

            {loading ? (
                <div>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 12 }} />)}</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            className="glass-card" style={{ padding: 18, cursor: 'pointer' }}
                            onClick={() => setSelected(selected?.id === s.id ? null : s)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>{s.full_name}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {s.email}{s.reg_number ? ` • ${s.reg_number}` : ''}{s.department ? ` • ${s.department}` : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <FileText size={13} /> {s.total_submissions} submissions
                                    </span>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{
                                            fontSize: '1.4rem', fontWeight: 800, lineHeight: 1,
                                            color: perfColor(s.average_percentage),
                                        }}>{s.average_percentage !== null ? `${s.average_percentage}%` : '—'}</p>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>avg score</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {(s.grades || []).map((g: string, j: number) => (
                                            <span key={j} style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${gradeColor(g)}18`, color: gradeColor(g), border: `1px solid ${gradeColor(g)}35` }}>{g}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded result breakdown */}
                            {selected?.id === s.id && s.results?.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-glass)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                        {s.results.map((r: any, j: number) => (
                                            <div key={j} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Exam result #{j + 1}</p>
                                                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: perfColor(r.percentage) }}>
                                                    {r.percentage}% <span style={{ fontSize: '0.9rem', color: gradeColor(r.grade) }}>({r.grade})</span>
                                                </p>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.marks_obtained}/{r.total_marks} marks</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                    {filtered.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No students found</p>}
                </div>
            )}
        </DashboardLayout>
    );
}
