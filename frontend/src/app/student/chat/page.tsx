'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../context/AuthContext';
import { Send, Users, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../lib/api';

export default function StudentChatPage() {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastFetchTimeRef = useRef<string>(new Date(0).toISOString());

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const mergeMessages = (prev: any[], newMsgs: any[]) => {
        const existingIds = new Set(prev.map(m => String(m.id)));
        const toAdd = newMsgs.filter(m => !existingIds.has(String(m.id)));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
    };

    useEffect(() => {
        if (!profile) return;

        // Initial load
        const fetchAll = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/api/chat/messages');
                setMessages(data || []);
                if (data && data.length > 0) {
                    lastFetchTimeRef.current = data[data.length - 1].created_at;
                    scrollToBottom();
                }
                setConnected(true);
            } catch (e) {
                setConnected(false);
            }
            setLoading(false);
        };
        fetchAll();

        // Poll every 4 seconds for new messages
        const pollInterval = setInterval(async () => {
            try {
                const since = encodeURIComponent(lastFetchTimeRef.current);
                const { data } = await api.get(`/api/chat/messages/since?since=${since}`);
                if (data && data.length > 0) {
                    lastFetchTimeRef.current = data[data.length - 1].created_at;
                    setMessages(prev => {
                        const merged = mergeMessages(prev, data);
                        if (merged !== prev) scrollToBottom();
                        return merged;
                    });
                }
                setConnected(true);
            } catch {
                setConnected(false);
            }
        }, 4000);

        return () => clearInterval(pollInterval);
    }, [profile]);

    const handleSend = async () => {
        if (!input.trim() || !profile) return;
        const currentInput = input.trim();
        setInput('');

        // Optimistic update — message appears immediately
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            sender_id: profile.id,
            content: currentInput,
            created_at: new Date().toISOString(),
            profiles: { full_name: profile.full_name, role: profile.role },
        }]);
        scrollToBottom();

        try {
            const { data: sent } = await api.post('/api/chat/messages', { content: currentInput });
            // Replace temp with real message
            if (sent?.id) {
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...sent, profiles: { full_name: profile.full_name, role: profile.role } } : m
                ));
            }
        } catch (e) {
            // Keep optimistic message but mark as failed
            console.error('Failed to send message:', e);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <MessageSquare size={28} color="var(--accent-blue)" />
                    Group Chat
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Chat with your classmates and teachers in real-time</p>
            </div>

            <div style={{
                background: 'rgba(20, 20, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-glass)',
                borderRadius: 20,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 220px)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border-glass)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <Users size={20} color="#60a5fa" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Global Student Chat</h3>
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        {connected
                            ? <><Wifi size={13} color="#4ade80" /><span style={{ color: '#4ade80' }}>Connected</span></>
                            : <><WifiOff size={13} color="#f97316" /><span style={{ color: '#f97316' }}>Connecting…</span></>
                        }
                    </span>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ width: 36, height: 36, border: '3px solid var(--border-glass)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}
                            />
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                            <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>No messages yet. Say hello! 👋</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === profile?.id;
                            const isTemp = String(msg.id).startsWith('temp-');
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: isMe ? 'flex-end' : 'flex-start',
                                        opacity: isTemp ? 0.7 : 1,
                                    }}
                                >
                                    {!isMe && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, marginLeft: 4 }}>
                                            {msg.profiles?.full_name}
                                            {msg.profiles?.role === 'teacher' && <span style={{ color: '#a78bfa', marginLeft: 4 }}>(Teacher)</span>}
                                        </span>
                                    )}
                                    <div style={{
                                        padding: '10px 16px',
                                        borderRadius: 18,
                                        borderBottomRightRadius: isMe ? 4 : 18,
                                        borderBottomLeftRadius: !isMe ? 4 : 18,
                                        background: isMe ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                                        color: 'white', fontSize: '0.92rem', lineHeight: 1.5,
                                        border: isMe ? 'none' : '1px solid var(--border-glass)',
                                        boxShadow: isMe ? '0 4px 15px rgba(59,130,246,0.3)' : 'none',
                                    }}>
                                        {msg.content}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                                        {isTemp ? 'Sending…' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message…"
                            style={{
                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-glass)',
                                color: 'white', padding: '12px 18px', borderRadius: 25,
                                outline: 'none', fontSize: '0.9rem',
                            }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={!input.trim()}
                            style={{
                                width: 46, height: 46, borderRadius: '50%',
                                background: input.trim() ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                                color: 'white', border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: input.trim() ? '0 4px 15px rgba(59,130,246,0.4)' : 'none',
                            }}
                        >
                            <Send size={18} style={{ marginLeft: 2 }} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
