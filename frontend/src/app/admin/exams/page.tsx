'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { FileText, Search } from 'lucide-react';
import api from '../../../lib/api';

export default function AdminExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        // Admin can view all exams via the dashboard's recent exams or a dedicated endpoint
        // For now, fetch dashboard and show recent exams
        api.get('/api/admin/dashboard')
            .then(res => setExams(res.data.recent_exams || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = exams.filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>All Exams</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Overview of all exams across the platform</p>
            </div>

            <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" placeholder="Search exams..." value={search}
                    onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 44 }} />
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No exams found</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Title</th><th>Subject</th><th>Duration</th><th>Marks</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map((exam) => (
                                <tr key={exam.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exam.title}</td>
                                    <td>{exam.subject}</td>
                                    <td>{exam.duration_minutes} min</td>
                                    <td>{exam.total_marks}</td>
                                    <td><span className={`badge badge-${exam.status}`}>{exam.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
