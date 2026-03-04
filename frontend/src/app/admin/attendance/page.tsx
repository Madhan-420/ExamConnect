'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { FileDown, Calendar as CalendarIcon, Loader2, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../lib/api';
import * as XLSX from 'xlsx';

export default function AdminAttendancePage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const url = dateFilter ? `/api/admin/attendance?date=${dateFilter}` : '/api/admin/attendance';
            const res = await api.get(url);
            setAttendance(res.data);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [dateFilter]);

    const handleDownload = () => {
        if (attendance.length === 0) {
            alert("No attendance records to download.");
            return;
        }

        // Prepare data for Excel
        const exportData = attendance.map(record => ({
            'Date': record.date,
            'Student Name': record.student_name,
            'Registration Number': record.reg_number,
            'Status': record.status,
            'Remarks': record.remarks || ''
        }));

        // Create virtual workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

        // Generate and download Excel file
        const fileName = dateFilter ? `Attendance_${dateFilter}.xlsx` : 'All_Attendance_Records.xlsx';
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Attendance Records</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View and download student attendance data</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
                        <CalendarIcon size={16} color="var(--text-muted)" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', padding: '8px 0', fontSize: '0.9rem' }}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-primary"
                        onClick={handleDownload}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <FileDown size={18} /> Download Excel
                    </motion.button>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 24, minHeight: 400 }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200, color: 'var(--text-muted)' }}>
                        <Loader2 size={32} className="animate-spin" />
                    </div>
                ) : attendance.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No attendance records found {dateFilter && `for ${dateFilter}`}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Student</th>
                                    <th>Reg Number</th>
                                    <th>Status</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.map((record) => (
                                    <tr key={record.id}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{record.date}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.student_name}</td>
                                        <td>{record.reg_number}</td>
                                        <td>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                color: record.status === 'present' ? '#10b981' : '#f43f5e',
                                                fontWeight: 500, textTransform: 'capitalize'
                                            }}>
                                                {record.status === 'present' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{record.remarks || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
