'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Clock, Award, Upload, CheckCircle, Download, FileText, Paperclip } from 'lucide-react';
import api from '../../../../lib/api';
import { supabase } from '../../../../lib/supabase';

export default function StudentExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;
    const [exam, setExam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Answers: { [questionId]: string }
    const [answers, setAnswers] = useState<Record<string, string>>({});
    // Optional overall PDF
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfUploading, setPdfUploading] = useState(false);
    const [pdfError, setPdfError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get(`/api/student/exams/${examId}`)
            .then(res => {
                setExam(res.data);
                setTimeLeft(res.data.duration_minutes * 60);
            })
            .catch(err => setError(err.response?.data?.detail || 'Failed to load exam'))
            .finally(() => setLoading(false));
    }, [examId]);

    // Countdown timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || submitted) return;
        const t = setInterval(() => setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [timeLeft, submitted]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!confirm('Submit your exam? This cannot be undone.')) return;
        setSubmitting(true);
        setPdfError('');

        let fileUrl: string | null = null;

        // Upload PDF if attached
        if (pdfFile) {
            setPdfUploading(true);
            try {
                const path = `answers/${examId}/${Date.now()}_${pdfFile.name}`;
                const { error: uploadErr } = await supabase.storage.from('answers').upload(path, pdfFile, { upsert: false });
                if (!uploadErr) {
                    const { data: urlData } = supabase.storage.from('answers').getPublicUrl(path);
                    fileUrl = urlData.publicUrl;
                } else {
                    // Fallback: try backend upload
                    const formData = new FormData();
                    formData.append('file', pdfFile);
                    try {
                        const token = localStorage.getItem('exam_connect_token');
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student/exams/${examId}/upload`, {
                            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
                        });
                        const data = await res.json();
                        fileUrl = data.file_url || null;
                    } catch { /* ignore */ }
                }
            } catch (e) { console.error(e); }
            setPdfUploading(false);
        }

        try {
            await api.post(`/api/student/exams/${examId}/submit`, {
                answers,
                file_url: fileUrl,
            });
            setSubmitted(true);
        } catch (err: any) {
            setPdfError(err.response?.data?.detail || 'Submission failed. Please try again.');
        }
        setSubmitting(false);
    };

    const handleDownloadQuestions = async () => {
        try {
            const token = localStorage.getItem('exam_connect_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/student/exams/${examId}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) { alert('Download not available'); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${exam?.title || 'exam'}_questions.txt`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed.'); }
    };

    if (loading) return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 48, height: 48, border: '3px solid var(--border-glass)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }} />
            </div>
        </DashboardLayout>
    );

    if (error) return (
        <DashboardLayout>
            <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                <p style={{ color: '#f87171', fontSize: '1.1rem' }}>{error}</p>
                <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => router.back()}>Go Back</button>
            </div>
        </DashboardLayout>
    );

    if (submitted) return (
        <DashboardLayout>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                <CheckCircle size={64} color="#4ade80" style={{ margin: '0 auto 20px' }} />
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>Submitted Successfully!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your exam has been submitted. Your teacher will evaluate it soon.</p>
                <button className="btn-primary" onClick={() => router.push('/student/exams')}>Back to Exams</button>
            </motion.div>
        </DashboardLayout>
    );

    const questions = exam?.questions || [];
    const answeredCount = Object.keys(answers).length;
    const timerColor = timeLeft !== null && timeLeft < 300 ? '#f87171' : timeLeft !== null && timeLeft < 600 ? '#fbbf24' : '#4ade80';

    return (
        <DashboardLayout>
            {/* Sticky header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(10,10,20,0.85)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid var(--border-glass)', padding: '14px 0 12px', marginBottom: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{exam?.title}</h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exam?.subject}</p>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Award size={15} /> {answeredCount}/{questions.length} answered
                    </span>
                    {timeLeft !== null && (
                        <span style={{
                            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '1.1rem',
                            color: timerColor, padding: '6px 14px', borderRadius: 8,
                            background: `${timerColor}15`, border: `1px solid ${timerColor}40`,
                        }}>
                            <Clock size={16} /> {formatTime(timeLeft)}
                        </span>
                    )}
                    <button onClick={handleDownloadQuestions}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem',
                        }}>
                        <Download size={15} /> Question Paper
                    </button>
                </div>
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
                {questions.map((q: any, idx: number) => {
                    const opts = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
                    const isAnswered = !!answers[q.id];
                    return (
                        <motion.div key={q.id}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                            style={{
                                padding: 24, borderRadius: 16,
                                background: isAnswered ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isAnswered ? 'rgba(74,222,128,0.25)' : 'var(--border-glass)'}`,
                                transition: 'all 0.2s ease',
                            }}>
                            {/* Question header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--accent-purple)', fontSize: '0.9rem' }}>Q{q.order_num}.</span>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                                            background: q.question_type === 'mcq' ? 'rgba(59,130,246,0.15)' : q.question_type === 'file_upload' ? 'rgba(139,92,246,0.15)' : 'rgba(249,115,22,0.15)',
                                            color: q.question_type === 'mcq' ? '#60a5fa' : q.question_type === 'file_upload' ? '#a78bfa' : '#f97316',
                                        }}>
                                            {q.question_type === 'mcq' ? 'MCQ' : q.question_type === 'file_upload' ? 'File Upload' : 'Written'}
                                        </span>
                                        {isAnswered && <CheckCircle size={15} color="#4ade80" />}
                                    </div>
                                    <p style={{ fontSize: '1rem', lineHeight: 1.6 }}>{q.question_text}</p>
                                    {q.file_url && (
                                        <a href={q.file_url} target="_blank" rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                                                padding: '7px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.12)',
                                                border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '0.85rem', textDecoration: 'none'
                                            }}>
                                            <Paperclip size={14} /> {q.file_name || 'View Attached File'}
                                        </a>
                                    )}
                                </div>
                                <span className="badge" style={{ flexShrink: 0, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', height: 'fit-content' }}>
                                    {q.marks}m
                                </span>
                            </div>

                            {/* MCQ options */}
                            {q.question_type === 'mcq' && opts.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {opts.map((opt: string, i: number) => {
                                        const isSelected = answers[q.id] === opt;
                                        return (
                                            <button key={i} type="button" onClick={() => handleAnswer(q.id, opt)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                                    borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                                                    background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                                                    border: `2px solid ${isSelected ? 'rgba(59,130,246,0.6)' : 'var(--border-glass)'}`,
                                                    color: 'white', transition: 'all 0.15s ease',
                                                }}>
                                                <div style={{
                                                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                                    background: isSelected ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                                                    border: `2px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border-glass)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                                                </div>
                                                <span style={{ fontWeight: 500 }}><strong style={{ color: 'var(--text-muted)' }}>{String.fromCharCode(65 + i)})</strong> {opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Text answer */}
                            {(q.question_type === 'text') && (
                                <textarea value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)}
                                    placeholder="Type your answer here…"
                                    rows={4}
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid var(--border-glass)', color: 'white',
                                        padding: '12px 16px', borderRadius: 10,
                                        outline: 'none', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical',
                                        boxSizing: 'border-box',
                                    }} />
                            )}

                            {/* File upload question — note */}
                            {q.question_type === 'file_upload' && (
                                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px dashed rgba(139,92,246,0.3)' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#a78bfa' }}>
                                        📎 Answer this question by uploading your answer sheet as a PDF using the upload section at the bottom of this page.
                                    </p>
                                    <input value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)}
                                        placeholder="Optional: add a text note / page reference…"
                                        style={{
                                            width: '100%', background: 'transparent', border: 'none',
                                            borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)',
                                            padding: '8px 0', marginTop: 10, outline: 'none', fontSize: '0.85rem',
                                            boxSizing: 'border-box',
                                        }} />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* PDF upload section */}
            <div style={{
                padding: 24, borderRadius: 16, marginBottom: 28,
                background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-glass)',
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Upload size={18} color="#a78bfa" /> Upload Answer Sheet (PDF — optional)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    If your teacher requires a handwritten or scanned answer sheet, upload it here as a PDF.
                </p>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => { setPdfFile(e.target.files?.[0] || null); setPdfError(''); }} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
                            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                            color: '#a78bfa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
                        }}>
                        <FileText size={16} /> {pdfFile ? pdfFile.name : 'Choose PDF…'}
                    </button>
                    {pdfFile && (
                        <button type="button" onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            ✕ Remove
                        </button>
                    )}
                </div>
                {pdfError && <p style={{ color: '#f87171', fontSize: '0.82rem', marginTop: 8 }}>{pdfError}</p>}
            </div>

            {/* Submit button */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={submitting || pdfUploading}
                style={{
                    width: '100%', padding: 16, borderRadius: 14,
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    color: 'white', border: 'none', fontWeight: 700, fontSize: '1.05rem',
                    cursor: submitting || pdfUploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 6px 24px rgba(139,92,246,0.4)', opacity: submitting || pdfUploading ? 0.7 : 1,
                }}>
                {submitting || pdfUploading ? (
                    <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                        {pdfUploading ? 'Uploading PDF…' : 'Submitting…'}
                    </>
                ) : (
                    <><CheckCircle size={20} /> Submit Exam</>
                )}
            </motion.button>
        </DashboardLayout>
    );
}
