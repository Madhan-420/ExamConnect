'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { Video, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../lib/api';

export default function StudentLiveClassesPage() {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClasses = async () => {
        try {
            const { data } = await api.get('/api/live-classes/active');
            setClasses(data || []);
        } catch {
            // silently ignore
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!profile) return;
        fetchClasses();
        // Poll every 5 seconds so students see new classes without realtime
        const interval = setInterval(fetchClasses, 5000);
        return () => clearInterval(interval);
    }, [profile]);

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Video size={28} color="#a78bfa" />
                    Live Classes
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Join your teacher's live class. The list refreshes automatically every 5 seconds.</p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
                </div>
            ) : classes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center', padding: '80px 40px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)', borderRadius: 20,
                    }}
                >
                    <Video size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>No Live Classes Right Now</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        When your teacher starts a class it will appear here automatically.
                    </p>
                </motion.div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
                    <AnimatePresence>
                        {classes.map((cls, i) => (
                            <motion.div
                                key={cls.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.06 }}
                                style={{
                                    padding: 24, borderRadius: 16,
                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06))',
                                    border: '1px solid rgba(139,92,246,0.25)',
                                    display: 'flex', flexDirection: 'column', gap: 16,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{cls.title}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {cls.profiles?.full_name && `By ${cls.profiles.full_name} • `}
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

                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => window.open(`https://meet.jit.si/${cls.room_id}`, '_blank')}
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                        color: 'white', border: 'none', borderRadius: 12,
                                        fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 20px rgba(139,92,246,0.4)',
                                    }}
                                >
                                    <ExternalLink size={16} /> Join Class Now
                                </motion.button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </DashboardLayout>
    );
}
