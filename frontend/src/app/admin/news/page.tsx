'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Plus, X, Trash2, ToggleLeft, ToggleRight, Edit3, AlertTriangle, Bell, Megaphone, Calendar } from 'lucide-react';
import api from '../../../lib/api';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    priority: string;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

export default function AdminNewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
    const [form, setForm] = useState({
        title: '',
        content: '',
        priority: 'normal',
        is_active: true,
        expires_at: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchNews = async () => {
        try {
            const res = await api.get('/api/news');
            setNews(res.data);
        } catch (err) {
            console.error('Failed to fetch news', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const openCreate = () => {
        setEditingItem(null);
        setForm({ title: '', content: '', priority: 'normal', is_active: true, expires_at: '' });
        setShowModal(true);
    };

    const openEdit = (item: NewsItem) => {
        setEditingItem(item);
        setForm({
            title: item.title,
            content: item.content,
            priority: item.priority,
            is_active: item.is_active,
            expires_at: item.expires_at || '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                content: form.content,
                priority: form.priority,
                is_active: form.is_active,
                expires_at: form.expires_at || null,
            };

            if (editingItem) {
                await api.put(`/api/news/${editingItem.id}`, payload);
            } else {
                await api.post('/api/news', payload);
            }

            setShowModal(false);
            fetchNews();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to save');
        }
        setSubmitting(false);
    };

    const toggleActive = async (item: NewsItem) => {
        try {
            await api.put(`/api/news/${item.id}`, { is_active: !item.is_active });
            fetchNews();
        } catch (err) {
            alert('Failed to toggle');
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/api/news/${id}`);
            fetchNews();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const priorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent': return <AlertTriangle size={16} color="#ef4444" />;
            case 'important': return <Bell size={16} color="#f97316" />;
            default: return <Megaphone size={16} color="#8b5cf6" />;
        }
    };

    const priorityBadge = (priority: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            urgent: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
            important: { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
            normal: { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' },
        };
        const c = colors[priority] || colors.normal;
        return (
            <span style={{
                padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem',
                fontWeight: 600, textTransform: 'uppercase',
                background: c.bg, color: c.text,
            }}>
                {priority}
            </span>
        );
    };

    return (
        <DashboardLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>News & Announcements</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create and manage announcements that flash on all user dashboards</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary"
                    onClick={openCreate}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <Plus size={18} /> New Announcement
                </motion.button>
            </div>

            <div className="glass-card" style={{ padding: 24, minHeight: 400 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                        ))}
                    </div>
                ) : news.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <Newspaper size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                        <p>No announcements yet. Create your first one!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {news.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: item.is_active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: 12,
                                    padding: '16px 20px',
                                    opacity: item.is_active ? 1 : 0.5,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                            {priorityIcon(item.priority)}
                                            <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{item.title}</h3>
                                            {priorityBadge(item.priority)}
                                            {!item.is_active && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 8 }}>
                                                    INACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                            {item.content}
                                        </p>
                                        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                            <span><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />{new Date(item.created_at).toLocaleDateString()}</span>
                                            {item.expires_at && <span>Expires: {new Date(item.expires_at).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                        <button onClick={() => toggleActive(item)} title={item.is_active ? 'Deactivate' : 'Activate'}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                                                borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                                                color: item.is_active ? '#10b981' : 'var(--text-muted)', display: 'flex', alignItems: 'center',
                                            }}>
                                            {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        </button>
                                        <button onClick={() => openEdit(item)} title="Edit"
                                            style={{
                                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                                                borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center',
                                            }}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => deleteItem(item.id)} title="Delete"
                                            style={{
                                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center',
                                            }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="modal-overlay" onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="modal-content" onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: 520 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                                    {editingItem ? 'Edit Announcement' : 'New Announcement'}
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label className="form-label">Title</label>
                                        <input className="input-field" placeholder="Announcement title"
                                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="form-label">Content</label>
                                        <textarea className="input-field" placeholder="Announcement details..."
                                            value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={3} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div>
                                            <label className="form-label">Priority</label>
                                            <select className="input-field" value={form.priority}
                                                onChange={e => setForm({ ...form, priority: e.target.value })}>
                                                <option value="normal">Normal</option>
                                                <option value="important">Important</option>
                                                <option value="urgent">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="form-label">Expires At (optional)</label>
                                            <input type="datetime-local" className="input-field"
                                                value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" id="is_active" checked={form.is_active}
                                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                            style={{ width: 18, height: 18, accentColor: '#8b5cf6' }} />
                                        <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active (visible to all users)</label>
                                    </div>
                                    <motion.button type="submit" disabled={submitting}
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 8 }}>
                                        {submitting ? 'Saving...' : editingItem ? 'Update Announcement' : 'Create Announcement'}
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
