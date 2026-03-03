'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { Video, Plus, ExternalLink, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';

export default function TeacherLiveClassesPage() {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [titleInput, setTitleInput] = useState('');
    const [starting, setStarting] = useState(false);

    const fetchClasses = async () => {
        try {
            const { data } = await api.get('/api/live-classes/active');
            setClasses(data || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => {
        if (!profile) return;
        fetchClasses();
        const interval = setInterval(fetchClasses, 5000);
        return () => clearInterval(interval);
    }, [profile]);

    const handleStartClass = async () => {
        if (!titleInput.trim() || !profile) return;
        setStarting(true);
        const roomId = `examconnect-${profile.id}-${Date.now()}`;
        try {
            await api.post('/api/live-classes/start', {
                title: titleInput.trim(),
                room_id: roomId,
            });
            setTitleInput('');
            await fetchClasses();
            window.open(`https://meet.jit.si/${roomId}`, '_blank');
        } catch (e: any) {
            alert(e.response?.data?.detail || 'Failed to start class. Please try again.');
        }
        setStarting(false);
    };

    const handleEndClass = async (classId: string) => {
        try {
            await api.patch(`/api/live-classes/end/${classId}`);
            await fetchClasses();
        } catch (e: any) {
            alert(e.response?.data?.detail || 'Failed to end class.');
        }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Video size={28} color="#a78bfa" />
                    Live Classes
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Start and manage your live classes. Students will see them within seconds.</p>
            </div>

            {/* Start new class */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: 28,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 20, marginBottom: 28,
                }}
            >
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={18} color="#a78bfa" /> Start a New Class
                </h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <input
                        value={titleInput}
                        onChange={e => setTitleInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleStartClass()}
                        placeholder="Class title (e.g. Physics — Chapter 5: Waves)"
                        style={{
                            flex: 1, background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-glass)',
                            color: 'white', padding: '12px 18px', borderRadius: 12,
                            outline: 'none', fontSize: '0.95rem',
                        }}
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleStartClass}
                        disabled={!titleInput.trim() || starting}
                        style={{
                            padding: '12px 24px',
                            background: titleInput.trim() && !starting ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.05)',
                            color: 'white', border: 'none', borderRadius: 12,
                            fontWeight: 600, fontSize: '0.95rem', cursor: titleInput.trim() && !starting ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: titleInput.trim() ? '0 4px 15px rgba(139,92,246,0.35)' : 'none',
                            whiteSpace: 'nowrap', transition: 'all 0.2s ease',
                        }}
                    >
                        <Video size={16} />
                        {starting ? 'Starting…' : 'Start Class'}
                    </motion.button>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
                    Classes open in Jitsi Meet. Students will see your class listed within seconds.
                </p>
            </motion.div>

            {/* Active classes */}
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Active Classes
                {classes.length > 0 && (
                    <span style={{
                        padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem',
                        background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600,
                    }}>{classes.length} LIVE</span>
                )}
            </h2>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
                </div>
            ) : classes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center', padding: '60px 40px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)', borderRadius: 16,
                    }}
                >
                    <Video size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No active classes. Start one above!</p>
                </motion.div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    <AnimatePresence>
                        {classes.map((cls, i) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    padding: 24, borderRadius: 16,
                                    background: 'rgba(139, 92, 246, 0.07)',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    display: 'flex', flexDirection: 'column', gap: 16,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{cls.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Started {new Date(cls.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '4px 10px', borderRadius: 20,
                                        background: 'rgba(239,68,68,0.12)', color: '#f87171',
                                        fontSize: '0.75rem', fontWeight: 700,
                                    }}>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: '#ef4444', boxShadow: '0 0 6px #ef4444',
                                            display: 'inline-block',
                                        }} />
                                        LIVE
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 10 }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => window.open(`https://meet.jit.si/${cls.room_id}`, '_blank')}
                                        style={{
                                            flex: 1, padding: '10px',
                                            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                            color: 'white', border: 'none', borderRadius: 10,
                                            fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        }}
                                    >
                                        <ExternalLink size={15} /> Rejoin
                                    </motion.button>

                                    {profile?.id === cls.teacher_id && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => handleEndClass(cls.id)}
                                            style={{
                                                padding: '10px 16px',
                                                background: 'rgba(239,68,68,0.1)',
                                                color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                                                borderRadius: 10, fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                            }}
                                        >
                                            <Square size={14} /> End
                                        </motion.button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </DashboardLayout>
    );
}
