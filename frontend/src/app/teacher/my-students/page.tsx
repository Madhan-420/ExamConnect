'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Users, Search, Clock, ShieldCheck, Mail } from 'lucide-react';
import api from '../../../lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function MyStudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchStudents = async () => {
        try {
            const res = await api.get('/api/teacher/my-students');
            setStudents(res.data);
        } catch (err) {
            console.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const filtered = students.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const isOnline = (lastSeen?: string) => {
        if (!lastSeen) return false;
        const diffMs = new Date().getTime() - new Date(lastSeen).getTime();
        return diffMs < 3 * 60 * 1000; // Online if seen within the last 3 minutes
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>My Assigned Students</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View your mentees and their current online status</p>
                </div>
            </div>

            <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    className="input-field"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: 44, width: '100%' }}
                />
            </div>

            <div className="glass-card" style={{ padding: 24, minHeight: 400 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No students assigned or matching search.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Reg Number</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(student => (
                                <tr key={student.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.full_name}</td>
                                    <td>{student.reg_number || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                                            {student.email}
                                        </div>
                                    </td>
                                    <td>
                                        {isOnline(student.last_seen) ? (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                                padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600
                                            }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                                Online
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                background: 'rgba(107, 114, 128, 0.1)', color: 'var(--text-secondary)',
                                                padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600
                                            }}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
                                                Offline
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {student.last_seen ? formatDistanceToNow(new Date(student.last_seen), { addSuffix: true }) : 'Never'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
