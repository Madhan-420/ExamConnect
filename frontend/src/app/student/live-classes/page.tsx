'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Video, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentLiveClassesPage() {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;

        const fetchClasses = async () => {
            const { data } = await supabase
                .from('live_classes')
                .select('*, profiles(full_name)')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (data) setClasses(data);
            setLoading(false);
        };

        fetchClasses();

        // Always subscribe to real-time changes — no gating on "isOpen"
        const subscription = supabase
            .channel('live_classes_student_channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'live_classes',
            }, () => {
                fetchClasses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [profile]);

    const handleJoin = (roomId: string) => {
        window.open(`https://meet.jit.si/${roomId}`, '_blank');
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Video size={28} color="#a78bfa" />
                    Live Classes
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Join live classes started by your teachers. Updates in real-time.</p>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
                    ))}
                </div>
            ) : classes.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        textAlign: 'center', padding: '80px 40px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 20,
                    }}
                >
                    <WifiOff size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.4 }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>No Live Classes Right Now</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        This page updates automatically when a teacher starts a new class.
                    </p>
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
                                transition={{ delay: i * 0.06 }}
                                style={{
                                    padding: 24,
                                    background: 'rgba(139, 92, 246, 0.07)',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    borderRadius: 16,
                                    display: 'flex', flexDirection: 'column', gap: 16,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: 'rgba(139, 92, 246, 0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Video size={22} color="#a78bfa" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{cls.title}</h3>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                by {cls.profiles?.full_name}
                                            </p>
                                        </div>
                                    </div>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        padding: '4px 10px', borderRadius: 20,
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#f87171', fontSize: '0.75rem', fontWeight: 700,
                                    }}>
                                        <span style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: '#ef4444',
                                            boxShadow: '0 0 6px #ef4444',
                                            animation: 'pulse 2s infinite',
                                        }} />
                                        LIVE
                                    </span>
                                </div>

                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Started {new Date(cls.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleJoin(cls.room_id)}
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                        color: 'white', border: 'none', borderRadius: 10,
                                        fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                                    }}
                                >
                                    <ExternalLink size={16} />
                                    Join Class
                                </motion.button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Live indicator */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Wifi size={14} color="#4ade80" />
                <span style={{ color: '#4ade80', fontWeight: 500 }}>Connected</span>
                — page updates automatically when teachers start or end classes
            </div>
        </DashboardLayout>
    );
}
