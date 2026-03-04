'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Users, Clock, Award, Download, ChevronDown, ChevronUp, Eye, Search } from 'lucide-react';
import api from '../../../lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedExam, setSelectedExam] = useState<any | null>(null);
    const [examDetail, setExamDetail] = useState<any | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [search, setSearch] = useState('');
    const [expandedSub, setExpandedSub] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.get('/api/admin/exams')
            .then(res => setExams(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const openDetail = async (exam: any) => {
        setSelectedExam(exam);
        setExamDetail(null);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/api/admin/exams/${exam.id}/detail`);
            setExamDetail(res.data);
        } catch (err) { console.error(err); }
        setLoadingDetail(false);
    };

    const toggleSub = (id: string) => {
        setExpandedSub(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const downloadAll = async () => {
        try {
            const token = localStorage.getItem('exam_connect_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/analytics/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'all_submissions.json'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
    };

    const downloadQuestionPaperPDF = () => {
        if (!examDetail || !examDetail.questions || examDetail.questions.length === 0) {
            alert('No questions found for this exam.');
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Question Paper - ${examDetail.title}`, 14, 20);

        doc.setFontSize(12);
        let y = 35;
        examDetail.questions.forEach((q: any, idx: number) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text(`Q${idx + 1} (${q.marks} marks):`, 14, y);
            doc.setFont('helvetica', 'normal');

            const splitText = doc.splitTextToSize(q.question_text, 170);
            doc.text(splitText, 14, y + 6);
            y += splitText.length * 6 + 8;

            if (q.question_type === 'mcq' && q.options) {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                opts.forEach((opt: string, optIdx: number) => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(`${String.fromCharCode(65 + optIdx)}) ${opt}`, 20, y);
                    y += 6;
                });
                y += 4;
            }
        });
        doc.save(`Exam_${examDetail.id}_QuestionPaper.pdf`);
    };

    const downloadSubmissionsPDF = () => {
        if (!examDetail || !examDetail.submissions || examDetail.submissions.length === 0) {
            alert('No submissions to download for this exam.');
            return;
        }
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Submissions - ${examDetail.title}`, 14, 20);

        const tableData = examDetail.submissions.map((sub: any) => [
            sub.student?.full_name || 'Unknown',
            sub.student?.reg_number || 'N/A',
            sub.status,
            sub.result?.marks_obtained !== undefined ? `${sub.result.marks_obtained}/${sub.result.total_marks}` : 'Not Graded',
            sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'N/A'
        ]);

        autoTable(doc, {
            head: [['Student Name', 'Reg Number', 'Status', 'Marks', 'Date']],
            body: tableData,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });
        doc.save(`Exam_${examDetail.id}_Submissions.pdf`);
    };

    const filtered = exams.filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.subject?.toLowerCase().includes(search.toLowerCase()) ||
        e.teacher_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Exam Monitor</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View all exams, questions, answers and submissions</p>
                </div>
                <button onClick={downloadAll}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))',
                        border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', cursor: 'pointer',
                        fontSize: '0.9rem', fontWeight: 700,
                    }}>
                    <Download size={16} /> Download All Submissions
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search exams by title, subject, teacher…"
                    style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
                        color: 'white', padding: '11px 16px 11px 40px', borderRadius: 10, outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box',
                    }} />
            </div>

            {loading ? (
                <div>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 12 }} />)}</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((exam, i) => (
                        <motion.div key={exam.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="glass-card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{exam.title}</h3>
                                        <span className={`badge badge-${exam.status}`}>{exam.status}</span>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        {exam.subject} • by {exam.teacher_name} •
                                        <span style={{ color: '#f97316', marginLeft: 4 }}>{exam.submission_count} submissions</span>
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{exam.duration_minutes}m
                                    </span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        <Award size={12} style={{ display: 'inline', marginRight: 4 }} />{exam.total_marks}m
                                    </span>
                                    <button onClick={() => openDetail(exam)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                                            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                                            color: '#60a5fa', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                        }}>
                                        <Eye size={14} /> View Detail
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filtered.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No exams found</p>}
                </div>
            )}

            {/* Exam Detail Drawer */}
            <AnimatePresence>
                {selectedExam && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
                        onClick={() => setSelectedExam(null)}>
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            style={{ width: '100%', maxWidth: 700, background: 'var(--bg-secondary)', overflowY: 'auto', padding: 28 }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                                <div>
                                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{selectedExam.title}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedExam.subject} • {selectedExam.teacher_name}</p>

                                    {/* Action Buttons for PDF Downloads */}
                                    {examDetail && (
                                        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                            <button onClick={downloadQuestionPaperPDF}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6,
                                                    background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)',
                                                    color: '#38bdf8', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                }}>
                                                <FileText size={14} /> Question Paper PDF
                                            </button>
                                            <button onClick={downloadSubmissionsPDF}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6,
                                                    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                                                    color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                }}>
                                                <FileText size={14} /> Submissions PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setSelectedExam(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}>✕</button>
                            </div>

                            {loadingDetail ? <div className="skeleton" style={{ height: 200, borderRadius: 12 }} /> : examDetail && (
                                <>
                                    {/* Questions */}
                                    <h3 style={{ fontWeight: 700, marginBottom: 12, color: '#a78bfa' }}>Questions ({examDetail.questions?.length})</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                                        {examDetail.questions?.map((q: any) => {
                                            const opts = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
                                            return (
                                                <div key={q.id} style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                        <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                                            <span style={{ color: '#a78bfa', marginRight: 6 }}>Q{q.order_num}.</span>
                                                            [{q.question_type?.toUpperCase()}] {q.question_text}
                                                        </p>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{q.marks}m</span>
                                                    </div>
                                                    {opts.length > 0 && (
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                                            {opts.map((o: string, i: number) => `${String.fromCharCode(65 + i)}) ${o}`).join(' | ')}
                                                            {q.correct_answer && <span style={{ color: '#4ade80', marginLeft: 8 }}>✓ {q.correct_answer}</span>}
                                                        </p>
                                                    )}
                                                    {q.file_url && (
                                                        <a href={q.file_url} target="_blank" rel="noopener noreferrer"
                                                            style={{ fontSize: '0.78rem', color: '#60a5fa', marginTop: 4, display: 'block' }}>
                                                            📎 {q.file_name || 'Attachment'}
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Submissions */}
                                    <h3 style={{ fontWeight: 700, marginBottom: 12, color: '#60a5fa' }}>Submissions ({examDetail.submissions?.length})</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {examDetail.submissions?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No submissions yet.</p>}
                                        {examDetail.submissions?.map((sub: any) => {
                                            const isOpen = expandedSub.has(sub.id);
                                            const answers: Record<string, string> = typeof sub.answers === 'object' ? sub.answers : {};
                                            const r = sub.result;
                                            return (
                                                <div key={sub.id} style={{ borderRadius: 10, border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                                                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                                        onClick={() => toggleSub(sub.id)}>
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.student?.full_name || 'Student'}</p>
                                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub.student?.email} {sub.student?.reg_number ? `• ${sub.student.reg_number}` : ''}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            {r && (
                                                                <span style={{ fontWeight: 800, color: r.percentage >= 50 ? '#4ade80' : '#ef4444', fontSize: '0.9rem' }}>
                                                                    {r.marks_obtained}/{r.total_marks} ({r.grade})
                                                                </span>
                                                            )}
                                                            <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                                                            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                        </div>
                                                    </div>
                                                    {isOpen && (
                                                        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-glass)' }}>
                                                            {examDetail.questions?.map((q: any) => (
                                                                <div key={q.id} style={{ marginBottom: 10 }}>
                                                                    <p style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>Q{q.order_num}. {q.question_text}</p>
                                                                    <p style={{ fontSize: '0.85rem', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, marginTop: 4 }}>
                                                                        <strong style={{ color: 'var(--text-muted)' }}>Answer: </strong>{answers[q.id] || '—'}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                            {sub.file_url && (
                                                                <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '7px 14px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>
                                                                    📎 Answer Sheet PDF
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DashboardLayout >
    );
}
