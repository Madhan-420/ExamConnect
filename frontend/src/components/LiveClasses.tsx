'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Video, Plus, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveClasses() {
    const { profile } = useAuth();
    const [classes, setClasses] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [titleInput, setTitleInput] = useState('');

    // Fetch active classes
    useEffect(() => {
        if (!isOpen) return;

        const fetchClasses = async () => {
            const { data } = await supabase
                .from('live_classes')
                .select('*, profiles(full_name)')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (data) setClasses(data);
        };

        fetchClasses();

        // Subscribe to changes in live classes
        const subscription = supabase
            .channel('public:live_classes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes' }, async () => {
                fetchClasses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [isOpen]);

    const handleStartClass = async () => {
        if (!titleInput.trim() || !profile || profile.role !== 'teacher') return;

        const roomId = `examconnect-${profile.id}-${Date.now()}`;

        await supabase.from('live_classes').insert([{
            teacher_id: profile.id,
            title: titleInput,
            room_id: roomId,
            is_active: true
        }]);

        setTitleInput('');

        // Open Jitsi Meet in new tab
        window.open(`https://meet.jit.si/${roomId}`, '_blank');
    };

    const handleEndClass = async (classId: string) => {
        await supabase.from('live_classes').update({
            is_active: false,
            ended_at: new Date().toISOString()
        }).eq('id', classId);
    };

    const handleJoinClass = (roomId: string) => {
        window.open(`https://meet.jit.si/${roomId}`, '_blank');
    };

    if (!profile) return null;

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: 30, right: 20, zIndex: 40,
                    padding: '12px 20px', borderRadius: 30,
                    background: profile.role === 'teacher' ? 'var(--gradient-main)' : 'rgba(255,255,255,0.05)',
                    border: profile.role === 'teacher' ? 'none' : '1px solid var(--border-glass)',
                    backdropFilter: 'blur(10px)',
                    color: 'white', display: 'flex', alignItems: 'center', gap: 10,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    cursor: 'pointer', fontWeight: 600
                }}
            >
                <Video size={20} color={profile.role === 'teacher' ? 'white' : 'var(--accent-purple)'} />
                Live Classes
                {classes.length > 0 && profile.role === 'student' && (
                    <span style={{
                        background: '#ef4444', color: 'white',
                        padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', marginLeft: 4
                    }}>
                        {classes.length}
                    </span>
                )}
            </motion.button>

            {/* Modal Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        style={{
                            position: 'fixed', bottom: 90, right: 16, zIndex: 40,
                            width: 'min(380px, calc(100vw - 32px))', maxHeight: 500, borderRadius: 20,
                            background: 'rgba(20, 20, 30, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--border-glass)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border-glass)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(139, 92, 246, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Video size={20} color="#a78bfa" />
                                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Live Classes</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {profile.role === 'teacher' && (
                                <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start a new class</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            value={titleInput}
                                            onChange={e => setTitleInput(e.target.value)}
                                            placeholder="Class Title (e.g. Physics 101)"
                                            style={{
                                                flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                                                color: 'white', padding: '10px 14px', borderRadius: 'var(--radius-sm)', outline: 'none'
                                            }}
                                        />
                                        <button onClick={handleStartClass} className="btn-primary" style={{ padding: '0 16px', borderRadius: 'var(--radius-sm)' }}>
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: 8 }}>Active Classes</h4>
                            {classes.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: 20 }}>
                                    No live classes at the moment.
                                </p>
                            ) : (
                                classes.map((cls) => (
                                    <div key={cls.id} style={{
                                        padding: 16, background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)',
                                        display: 'flex', flexDirection: 'column', gap: 10
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h5 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'white' }}>{cls.title}</h5>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {cls.profiles?.full_name}</p>
                                            </div>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                fontSize: '0.75rem', color: '#ef4444', fontWeight: 600,
                                                background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 10
                                            }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
                                                LIVE
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                            <button
                                                onClick={() => handleJoinClass(cls.room_id)}
                                                style={{
                                                    flex: 1, padding: '8px', background: 'var(--accent-blue)', color: 'white',
                                                    border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                                }}
                                            >
                                                <ExternalLink size={16} /> Join Class
                                            </button>

                                            {profile.role === 'teacher' && profile.id === cls.teacher_id && (
                                                <button
                                                    onClick={() => handleEndClass(cls.id)}
                                                    style={{
                                                        padding: '0 16px', background: 'transparent', color: '#ef4444',
                                                        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)',
                                                        fontWeight: 600, cursor: 'pointer'
                                                    }}
                                                >
                                                    End
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
