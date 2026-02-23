'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { User, Award, MessageSquare, Check } from 'lucide-react';
import api from '../../../../../lib/api';

export default function EvaluatePage() {
    const params = useParams();
    const examId = params.id as string;
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState<string | null>(null);
    const [marks, setMarks] = useState(0);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get(`/api/teacher/exams/${examId}/submissions`)
            .then(res => setSubmissions(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [examId]);

    const handleEvaluate = async (submissionId: string) => {
        setSubmitting(true);
        try {
            await api.post(`/api/teacher/submissions/${submissionId}/evaluate`, {
                marks_obtained: marks,
                remarks: remarks,
            });
            // Refresh
            const res = await api.get(`/api/teacher/exams/${examId}/submissions`);
            setSubmissions(res.data);
            setEvaluating(null);
            setMarks(0);
            setRemarks('');
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to evaluate');
        }
        setSubmitting(false);
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Evaluate Submissions</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Review and grade student submissions</p>
            </div>

            {loading ? (
                <div>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 16, borderRadius: 'var(--radius-lg)' }} />)}</div>
            ) : submissions.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No submissions yet</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {submissions.map((sub, i) => (
                        <motion.div key={sub.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <User size={20} color="#a78bfa" />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{sub.student?.full_name || 'Student'}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.student?.email} {sub.student?.reg_number ? `• ${sub.student.reg_number}` : ''}</p>
                                    </div>
                                </div>
                                <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                            </div>

                            {/* Answers preview */}
                            <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Answers:</p>
                                {typeof sub.answers === 'object' && Object.entries(sub.answers).map(([qId, answer]) => (
                                    <p key={qId} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        <strong>Q:</strong> {String(answer)}
                                    </p>
                                ))}
                                {sub.file_url && (
                                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                        style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', textDecoration: 'none' }}>
                                        📎 View submitted file
                                    </a>
                                )}
                            </div>

                            {/* Evaluation */}
                            {evaluating === sub.id ? (
                                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
                                        <div>
                                            <label className="form-label">Marks</label>
                                            <input type="number" className="input-field" value={marks} onChange={e => setMarks(parseInt(e.target.value) || 0)} />
                                        </div>
                                        <div>
                                            <label className="form-label">Remarks</label>
                                            <input className="input-field" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional remarks..." />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <motion.button whileHover={{ scale: 1.02 }} className="btn-primary"
                                            onClick={() => handleEvaluate(sub.id)} disabled={submitting}
                                            style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Check size={16} /> {submitting ? 'Saving...' : 'Submit Grade'}
                                        </motion.button>
                                        <button className="btn-secondary" onClick={() => setEvaluating(null)}
                                            style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Cancel</button>
                                    </div>
                                </div>
                            ) : sub.status !== 'evaluated' ? (
                                <motion.button whileHover={{ scale: 1.02 }} className="btn-primary"
                                    onClick={() => { setEvaluating(sub.id); setMarks(0); setRemarks(''); }}
                                    style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Award size={16} /> Grade Submission
                                </motion.button>
                            ) : (
                                <p style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}>✓ Evaluated</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
