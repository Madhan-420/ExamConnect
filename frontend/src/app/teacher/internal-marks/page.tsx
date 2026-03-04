'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Award, Save, Book } from 'lucide-react';
import api from '../../../lib/api';

export default function InternalMarksPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [marksRecords, setMarksRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [subject, setSubject] = useState('Mathematics'); // Default or state
    const [saving, setSaving] = useState(false);

    // Map of student_id -> { marks, total_marks }
    const [marksMap, setMarksMap] = useState<Record<string, { marks: number | '', total_marks: number | '' }>>({});

    useEffect(() => {
        if (subject) {
            fetchData(subject);
        }
    }, [subject]);

    const fetchData = async (subj: string) => {
        setLoading(true);
        try {
            const [studentsRes, marksRes] = await Promise.all([
                api.get('/api/teacher/my-students'),
                api.get(`/api/teacher/internal-marks?subject=${subj}`)
            ]);

            setStudents(studentsRes.data);
            setMarksRecords(marksRes.data);

            // Map existing records
            const map: Record<string, { marks: number | '', total_marks: number | '' }> = {};

            // Initialize empty
            studentsRes.data.forEach((s: any) => {
                map[s.id] = { marks: '', total_marks: 100 };
            });

            // Override with actual existing database records
            marksRes.data.forEach((r: any) => {
                if (map[r.student_id]) {
                    map[r.student_id] = { marks: r.marks, total_marks: r.total_marks };
                }
            });

            setMarksMap(map);
        } catch (err) {
            console.error('Failed to fetch internal marks data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(marksMap)
                .filter(([_, data]) => data.marks !== '') // Only save those with marks entered
                .map(([studentId, data]) => ({
                    student_id: studentId,
                    subject: subject,
                    marks: Number(data.marks),
                    total_marks: Number(data.total_marks) || 100
                }));

            if (payload.length === 0) {
                alert('No marks entered to save.');
                setSaving(false);
                return;
            }

            await api.post('/api/teacher/internal-marks', payload);
            alert('Internal marks saved successfully');
            fetchData(subject); // Refresh records
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to save internal marks');
        }
        setSaving(false);
    };

    const updateMark = (studentId: string, field: 'marks' | 'total_marks', value: string) => {
        setMarksMap(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value === '' ? '' : Number(value)
            }
        }));
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Internal Marks</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage internal assessments for your students</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Book size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Subject Name"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            style={{ paddingLeft: 40, width: 200 }}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={saving || students.length === 0 || !subject}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Marks'}
                    </motion.button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 24, minHeight: 400 }}>
                {loading ? (
                    <div style={{ padding: 20 }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 48, marginBottom: 12, borderRadius: 8 }} />
                        ))}
                    </div>
                ) : students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Award size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No students assigned to you yet.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Reg Number</th>
                                    <th style={{ width: 120 }}>Marks Obtained</th>
                                    <th style={{ width: 120 }}>Total Marks</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const currentData = marksMap[student.id] || { marks: '', total_marks: 100 };
                                    const p = (currentData.marks !== '' && currentData.total_marks)
                                        ? ((Number(currentData.marks) / Number(currentData.total_marks)) * 100).toFixed(1)
                                        : '--';
                                    return (
                                        <tr key={student.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.full_name}</td>
                                            <td>{student.reg_number || '—'}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    placeholder="0"
                                                    value={currentData.marks}
                                                    onChange={e => updateMark(student.id, 'marks', e.target.value)}
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: '100%' }}
                                                    min={0}
                                                    max={currentData.total_marks || 100}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={currentData.total_marks}
                                                    onChange={e => updateMark(student.id, 'total_marks', e.target.value)}
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem', width: '100%' }}
                                                    min={1}
                                                />
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: p !== '--' && Number(p) >= 50 ? '#10b981' : (p === '--' ? 'var(--text-muted)' : '#ef4444')
                                                }}>
                                                    {p !== '--' ? `${p}%` : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
