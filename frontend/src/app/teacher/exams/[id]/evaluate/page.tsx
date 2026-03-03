'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { User, Award, Check, Download, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../../../../lib/api';

export default function EvaluatePage() {
    const params = useParams();
    const examId = params.id as string;
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState<string | null>(null);
    const [marks, setMarks] = useState(0);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [subRes, qRes] = await Promise.all([
                    api.get(`/api/teacher/exams/${examId}/submissions`),
                    api.get(`/api/teacher/exams/${examId}/questions`),
                ]);
                setSubmissions(subRes.data);
                setQuestions(qRes.data);
            } catch (err: any) {
                setErrorMsg(err.response?.data?.detail || 'Failed to load submissions');
            }
            setLoading(false);
        };
        load();
    }, [examId]);

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const handleEvaluate = async (submissionId: string) => {
        setSubmitting(true);
        setErrorMsg('');
        try {
            await api.post(`/api/teacher/submissions/${submissionId}/evaluate`, {
                marks_obtained: marks,
                remarks,
            });
            const res = await api.get(`/api/teacher/exams/${examId}/submissions`);
            setSubmissions(res.data);
            setEvaluating(null);
            setMarks(0);
            setRemarks('');
        } catch (err: any) {
            const detail = err.response?.data?.detail || 'Failed to evaluate';
            setErrorMsg(detail);
            alert(detail);
        }
        setSubmitting(false);
    };

    const handleDownloadSubmissions = async () => {
        try {
            const token = localStorage.getItem('exam_connect_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/teacher/exams/${examId}/submissions/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `exam_${examId}_submissions.json`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed.'); }
    };

    // Map question id → question data
    const qMap = Object.fromEntries(questions.map(q => [q.id, q]));

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Evaluate Submissions</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Review and grade student answers</p>
                </div>
                <button onClick={handleDownloadSubmissions}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10,
                        background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                        color: '#a78bfa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                    }}>
                    <Download size={16} /> Download All Submissions
                </button>
            </div>

            {loading ? (
                <div>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 16, borderRadius: 'var(--radius-lg)' }} />)}</div>
            ) : submissions.length === 0 ? (
                <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No submissions yet</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {submissions.map((sub, i) => {
                        const isExpanded = expanded.has(sub.id);
                        const answers: Record<string, string> = typeof sub.answers === 'object' ? sub.answers : {};
                        return (
                            <motion.div key={sub.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }} className="glass-card" style={{ padding: 24 }}>
                                {/* Header row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} color="#a78bfa" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{sub.student?.full_name || 'Student'}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {sub.student?.email}{sub.student?.reg_number ? ` • ${sub.student.reg_number}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                                        <button onClick={() => toggleExpand(sub.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}>
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            {isExpanded ? 'Hide' : 'View'} Answers
                                        </button>
                                    </div>
                                </div>

                                {/* Answers — shown when expanded */}
                                {isExpanded && (
                                    <div style={{ margin: '16px 0', padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {questions.length > 0 ? (
                                            questions.map(q => {
                                                const opts = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
                                                const studentAnswer = answers[q.id] || '—';
                                                return (
                                                    <div key={q.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border-glass)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                            <p style={{ fontWeight: 600, fontSize: '0.88rem', flex: 1 }}>
                                                                <span style={{ color: '#a78bfa' }}>Q{q.order_num}.</span> {q.question_text}
                                                            </p>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8, flexShrink: 0 }}>{q.marks}m</span>
                                                        </div>
                                                        {q.question_type === 'mcq' && opts.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                                                {opts.map((opt: string, i: number) => (
                                                                    <span key={i} style={{
                                                                        padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem',
                                                                        background: studentAnswer === opt ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                                                                        border: `1px solid ${studentAnswer === opt ? 'rgba(59,130,246,0.5)' : 'var(--border-glass)'}`,
                                                                        color: studentAnswer === opt ? '#60a5fa' : 'var(--text-muted)',
                                                                        fontWeight: studentAnswer === opt ? 700 : 400,
                                                                    }}>{String.fromCharCode(65 + i)}) {opt}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <p style={{ fontSize: '0.85rem', color: 'white', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 8 }}>
                                                            <strong style={{ color: 'var(--text-muted)', marginRight: 6 }}>Answer:</strong>
                                                            {studentAnswer}
                                                        </p>
                                                        {q.correct_answer && (
                                                            <p style={{ fontSize: '0.78rem', color: '#4ade80', marginTop: 4 }}>
                                                                Correct: {q.correct_answer}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            Object.entries(answers).map(([qId, answer]) => (
                                                <p key={qId} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <strong>Answer:</strong> {String(answer)}
                                                </p>
                                            ))
                                        )}

                                        {/* PDF link */}
                                        {sub.file_url && (
                                            <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                                                    borderRadius: 10, background: 'rgba(139,92,246,0.12)',
                                                    border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa',
                                                    textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600, marginTop: 4,
                                                }}>
                                                <FileText size={16} /> View / Download Answer Sheet
                                                <ExternalLink size={13} />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Grading section */}
                                {evaluating === sub.id ? (
                                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, marginBottom: 12 }}>
                                            <div>
                                                <label className="form-label">Marks Awarded</label>
                                                <input type="number" className="input-field" value={marks}
                                                    min={0} onChange={e => setMarks(parseInt(e.target.value) || 0)} />
                                            </div>
                                            <div>
                                                <label className="form-label">Remarks (optional)</label>
                                                <input className="input-field" value={remarks}
                                                    onChange={e => setRemarks(e.target.value)} placeholder="Good work, needs improvement…" />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <motion.button whileHover={{ scale: 1.02 }} className="btn-primary"
                                                onClick={() => handleEvaluate(sub.id)} disabled={submitting}
                                                style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Check size={16} /> {submitting ? 'Saving…' : 'Submit Grade'}
                                            </motion.button>
                                            <button className="btn-secondary" onClick={() => { setEvaluating(null); setErrorMsg(''); }}
                                                style={{ padding: '10px 20px', fontSize: '0.85rem' }}>Cancel</button>
                                        </div>
                                        {errorMsg && (
                                            <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: 10, wordBreak: 'break-all' }}>
                                                ❌ {errorMsg}
                                            </p>
                                        )}
                                    </div>
                                ) : sub.status === 'evaluated' ? (
                                    <p style={{ color: '#4ade80', fontSize: '0.85rem', fontWeight: 600, marginTop: 12 }}>✓ Evaluated</p>
                                ) : (
                                    <motion.button whileHover={{ scale: 1.02 }} className="btn-primary"
                                        onClick={() => { setEvaluating(sub.id); setMarks(0); setRemarks(''); setExpanded(prev => { const n = new Set(prev); n.add(sub.id); return n; }); }}
                                        style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                                        <Award size={16} /> Grade Submission
                                    </motion.button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
