'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Calendar, Save, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../../lib/api';

export default function AttendancePage() {
    const [students, setStudents] = useState<any[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    // Derived state for the table
    const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string, remarks: string }>>({});

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    const fetchData = async (date: string) => {
        setLoading(true);
        try {
            const [studentsRes, attendanceRes] = await Promise.all([
                api.get('/api/teacher/my-students'),
                api.get(`/api/teacher/attendance?date=${date}`)
            ]);

            setStudents(studentsRes.data);
            setAttendanceRecords(attendanceRes.data);

            // Map existing records
            const map: Record<string, { status: string, remarks: string }> = {};

            // Initialize with default 'present' for all assigned students
            studentsRes.data.forEach((s: any) => {
                map[s.id] = { status: 'present', remarks: '' };
            });

            // Override with actual existing database records
            attendanceRes.data.forEach((r: any) => {
                if (map[r.student_id]) {
                    map[r.student_id] = { status: r.status, remarks: r.remarks || '' };
                }
            });

            setAttendanceMap(map);
        } catch (err) {
            console.error('Failed to fetch attendance data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.entries(attendanceMap).map(([studentId, data]) => ({
                student_id: studentId,
                date: selectedDate,
                status: data.status,
                remarks: data.remarks
            }));

            await api.post('/api/teacher/attendance', payload);
            alert('Attendance saved successfully');
            fetchData(selectedDate); // Refresh records to confirm
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to save attendance');
        }
        setSaving(false);
    };

    const updateStudentAttendance = (studentId: string, field: 'status' | 'remarks', value: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Student Attendance</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Mark daily attendance for your assigned students</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="date"
                            className="input-field"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            style={{ paddingLeft: 40 }}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={saving || students.length === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
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
                        <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No students assigned to you yet.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Reg Number</th>
                                    <th>Status</th>
                                    <th>Remarks (Optional)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const currentData = attendanceMap[student.id] || { status: 'present', remarks: '' };
                                    return (
                                        <tr key={student.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.full_name}</td>
                                            <td>{student.reg_number || '—'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {[
                                                        { id: 'present', label: 'Present', icon: CheckCircle, color: '#10b981' },
                                                        { id: 'absent', label: 'Absent', icon: XCircle, color: '#ef4444' },
                                                        { id: 'late', label: 'Late', icon: Clock, color: '#f59e0b' }
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => updateStudentAttendance(student.id, 'status', opt.id)}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 4,
                                                                padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                                                                cursor: 'pointer', border: '1px solid transparent',
                                                                background: currentData.status === opt.id ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                                                                color: currentData.status === opt.id ? opt.color : 'var(--text-secondary)',
                                                                borderColor: currentData.status === opt.id ? `${opt.color}55` : 'transparent',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <opt.icon size={14} /> {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    className="input-field"
                                                    placeholder="Add remarks..."
                                                    value={currentData.remarks}
                                                    onChange={e => updateStudentAttendance(student.id, 'remarks', e.target.value)}
                                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                />
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
