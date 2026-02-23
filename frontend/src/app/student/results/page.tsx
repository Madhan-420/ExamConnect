'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../lib/api';

export default function StudentResultsPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/student/results')
            .then(res => setResults(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const chartData = results.map((r: any) => ({
        name: r.exam?.title?.substring(0, 10) || 'Exam',
        percentage: r.percentage,
        marks: r.marks_obtained,
    }));

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>My Results</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View your exam scores and performance</p>
            </div>

            {loading ? (
                <div>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 16, borderRadius: 'var(--radius-lg)' }} />)}</div>
            ) : results.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <Trophy size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No results published yet</p>
                </div>
            ) : (
                <>
                    {/* Performance Chart */}
                    {chartData.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <TrendingUp size={18} color="var(--accent-purple)" /> Performance Overview
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff' }} />
                                    <Bar dataKey="percentage" fill="url(#resultsGradient)" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="resultsGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#14b8a6" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </motion.div>
                    )}

                    {/* Results List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {results.map((r: any, i: number) => (
                            <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{r.exam?.title || 'Exam'}</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.exam?.subject}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: r.percentage >= 50 ? '#4ade80' : '#ef4444' }}>
                                            {r.percentage}%
                                        </p>
                                        <span className="badge" style={{
                                            background: r.grade === 'F' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                            color: r.grade === 'F' ? '#ef4444' : '#4ade80',
                                        }}>Grade {r.grade}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>
                                    <span>Marks: <strong style={{ color: 'var(--text-primary)' }}>{r.marks_obtained} / {r.total_marks}</strong></span>
                                    {r.remarks && <span>Remarks: {r.remarks}</span>}
                                </div>

                                {/* Progress bar */}
                                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${r.percentage}%` }}
                                        transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                                        style={{
                                            height: '100%', borderRadius: 4,
                                            background: r.percentage >= 50
                                                ? 'linear-gradient(90deg, #14b8a6, #3b82f6, #8b5cf6)'
                                                : 'linear-gradient(90deg, #ef4444, #f97316)',
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
