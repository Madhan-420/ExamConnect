'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, X, Calendar } from 'lucide-react';
import api from '../../../lib/api';

export default function TeacherFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ subject: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchFeedbacks = async () => {
        try {
            const res = await api.get('/api/teacher/feedbacks');
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/teacher/feedbacks', form);
            setShowModal(false);
            setForm({ subject: '', message: '' });
            fetchFeedbacks();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to submit feedback');
        }
        setSubmitting(false);
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>My Complaints & Feedbacks</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View your submitted feedback and create new ones</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <Plus size={18} /> Submit Feedback
                </motion.button>
            </div>

            <div className="glass-card" style={{ padding: 24, minHeight: 400 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : feedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>You haven't submitted any feedback yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        {feedbacks.map((fb) => (
                            <motion.div
                                key={fb.id}
                                whileHover={{ x: 4 }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: 12,
                                    padding: 20,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                        {fb.subject}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                                        {fb.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                    {fb.message}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                    <Calendar size={14} />
                                    Submitted on: {new Date(fb.created_at).toLocaleString()}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="modal-overlay" onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content" onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: 500 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Submit Feedback</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label className="form-label">Subject</label>
                                        <input
                                            className="input-field"
                                            placeholder="Brief subject of your feedback"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Message details</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Explain your complaint or feedback precisely"
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            required
                                            rows={5}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>
                                    <motion.button
                                        type="submit"
                                        disabled={submitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: 14, marginTop: 8 }}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout>
    );
}
