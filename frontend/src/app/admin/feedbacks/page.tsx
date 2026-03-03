'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { MessageSquare, Calendar } from 'lucide-react';
import api from '../../../lib/api';

export default function AdminFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFeedbacks = async () => {
        try {
            const res = await api.get('/api/admin/feedbacks');
            setFeedbacks(res.data);
        } catch (err) {
            console.error('Failed to fetch feedbacks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Complaints & Feedbacks</h1>
                <p style={{ color: 'var(--text-secondary)' }}>View all feedback and complaints submitted by users</p>
            </div>

            <div className="glass-card" style={{ padding: 24, minHeight: 400 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No feedback or complaints found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                        {feedbacks.map((fb) => (
                            <motion.div
                                key={fb.id}
                                whileHover={{ y: -4 }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: 16,
                                    padding: 20,
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        {fb.subject}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: 10 }}>
                                        {fb.status}
                                    </span>
                                </div>

                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                                    {fb.message}
                                </p>

                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderTop: '1px solid var(--border-glass)', paddingTop: 12, marginTop: 'auto'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                        From: <span style={{ color: 'var(--text-primary)' }}>{fb.user_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <Calendar size={12} />
                                        {new Date(fb.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
