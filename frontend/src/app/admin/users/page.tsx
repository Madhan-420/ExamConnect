'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Edit3, Search, X } from 'lucide-react';
import api from '../../../lib/api';

export default function ManageUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState<any>(null);
    const [form, setForm] = useState({
        email: '', password: '', full_name: '', role: 'student', department: '', reg_number: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = () => {
        const url = filter ? `/api/admin/users?role=${filter}` : '/api/admin/users';
        api.get(url)
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [filter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/api/admin/users', form);
            setShowModal(false);
            setForm({ email: '', password: '', full_name: '', role: 'student', department: '', reg_number: '' });
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to create user');
        }
        setSubmitting(false);
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            await api.put(`/api/admin/users/${userId}`, { role: newRole });
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to update user');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/api/admin/users/${userId}`);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Manage Users</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Add, edit, and manage all platform users</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={18} /> Add User
                </motion.button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input-field" placeholder="Search users..." value={search}
                        onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 44 }} />
                </div>
                {['', 'admin', 'teacher', 'student'].map(role => (
                    <button key={role} onClick={() => setFilter(role)}
                        style={{
                            padding: '10px 18px', borderRadius: 'var(--radius-sm)',
                            background: filter === role ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${filter === role ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                            color: filter === role ? '#a78bfa' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {role || 'All'}
                    </button>
                ))}
            </div>

            {/* Users Table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40 }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 8 }} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No users found</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user) => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`badge badge-${user.role}`}>{user.role}</span></td>
                                    <td>{user.department || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                style={{
                                                    padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem',
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                                                    color: 'var(--text-primary)', cursor: 'pointer',
                                                }}
                                            >
                                                <option value="student">Student</option>
                                                <option value="teacher">Teacher</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                            <button onClick={() => handleDelete(user.id)} className="btn-danger"
                                                style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="modal-overlay" onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content" onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Add New User</h2>
                                <button onClick={() => setShowModal(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label className="form-label">Full Name</label>
                                        <input className="input-field" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Email</label>
                                        <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Password</label>
                                        <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Role</label>
                                        <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                            <option value="student">Student</option>
                                            <option value="teacher">Teacher</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Department</label>
                                        <input className="input-field" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                                    </div>
                                    <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 8 }}>
                                        {submitting ? 'Creating...' : 'Create User'}
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
