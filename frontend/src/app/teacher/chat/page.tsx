'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { Send, Paperclip, MessageSquare, Users, X, FileText, Image, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TeacherChatPage() {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        if (!profile) return;

        const fetchMessages = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('group_messages')
                .select('*, profiles(full_name, role)')
                .order('created_at', { ascending: true })
                .limit(100);
            if (data) {
                setMessages(data);
                scrollToBottom();
            }
            setLoading(false);
        };

        fetchMessages();

        const subscription = supabase
            .channel('group_messages_teacher_channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
            }, async (payload) => {
                const newMessage = payload.new as any;
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', newMessage.sender_id)
                    .single();
                newMessage.profiles = profileData;
                setMessages(prev => [...prev, newMessage]);
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [profile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <Image size={16} />;
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return <FileText size={16} />;
        return <File size={16} />;
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || !profile) return;

        let fileUrl: string | null = null;
        let fileName: string | null = null;

        if (selectedFile) {
            setUploading(true);
            try {
                const fileExt = selectedFile.name.split('.').pop();
                const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, selectedFile, { upsert: false });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('chat-attachments')
                        .getPublicUrl(filePath);
                    fileUrl = urlData.publicUrl;
                    fileName = selectedFile.name;
                }
            } catch (err) {
                console.error('File upload error:', err);
            }
            setUploading(false);
        }

        const currentInput = input.trim();
        setInput('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        await supabase.from('group_messages').insert([{
            sender_id: profile.id,
            content: currentInput || (fileName ? `📎 Shared a file: ${fileName}` : ''),
            file_url: fileUrl,
            file_name: fileName,
        }]);
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <MessageSquare size={28} color="var(--accent-blue)" />
                    Group Chat
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Communicate with students. You can share question papers and any files.</p>
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
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Student Group Chat</h3>
                    <span style={{
                        marginLeft: 'auto', padding: '3px 10px', borderRadius: 12,
                        background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
                        fontSize: '0.75rem', fontWeight: 600,
                    }}>Teacher</span>
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
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id === profile?.id;
                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: isMe ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    {!isMe && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4, marginLeft: 4 }}>
                                            {msg.profiles?.full_name}
                                            {msg.profiles?.role === 'teacher' && (
                                                <span style={{ color: '#a78bfa', marginLeft: 4 }}>(Teacher)</span>
                                            )}
                                        </span>
                                    )}
                                    <div style={{
                                        padding: '10px 16px',
                                        borderRadius: 18,
                                        borderBottomRightRadius: isMe ? 4 : 18,
                                        borderBottomLeftRadius: !isMe ? 4 : 18,
                                        background: isMe ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.06)',
                                        color: 'white',
                                        fontSize: '0.92rem', lineHeight: 1.5,
                                        border: isMe ? 'none' : '1px solid var(--border-glass)',
                                        boxShadow: isMe ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
                                    }}>
                                        {msg.content}
                                        {msg.file_url && (
                                            <a
                                                href={msg.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    marginTop: msg.content ? 8 : 0,
                                                    padding: '8px 12px', borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: 'white', textDecoration: 'none',
                                                    fontSize: '0.85rem', fontWeight: 500,
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {getFileIcon(msg.file_name || '')}
                                                {msg.file_name || 'Download file'}
                                            </a>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, paddingLeft: 4, paddingRight: 4 }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </motion.div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* File preview */}
                <AnimatePresence>
                    {selectedFile && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                padding: '10px 24px',
                                borderTop: '1px solid var(--border-glass)',
                                background: 'rgba(139,92,246,0.08)',
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}
                        >
                            <FileText size={16} color="#a78bfa" />
                            <span style={{ fontSize: '0.85rem', color: '#a78bfa', flex: 1 }}>{selectedFile.name}</span>
                            <button
                                onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input — teachers CAN upload any file type */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* File upload button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="*/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            id="teacher-file-upload"
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload any file (question papers, docs, images…)"
                            style={{
                                width: 42, height: 42, borderRadius: '50%',
                                background: selectedFile ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${selectedFile ? 'rgba(139,92,246,0.5)' : 'var(--border-glass)'}`,
                                color: selectedFile ? '#a78bfa' : 'var(--text-muted)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Paperclip size={18} />
                        </motion.button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={selectedFile ? 'Add a message (optional)...' : 'Type a message or attach a file...'}
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
                            disabled={uploading || (!input.trim() && !selectedFile)}
                            style={{
                                width: 46, height: 46, borderRadius: '50%',
                                background: (input.trim() || selectedFile) && !uploading
                                    ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                                    : 'rgba(255,255,255,0.05)',
                                color: 'white', border: 'none',
                                cursor: (input.trim() || selectedFile) && !uploading ? 'pointer' : 'default',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: (input.trim() || selectedFile) && !uploading
                                    ? '0 4px 15px rgba(139,92,246,0.4)' : 'none',
                            }}
                        >
                            {uploading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                                />
                            ) : (
                                <Send size={18} style={{ marginLeft: 2 }} />
                            )}
                        </motion.button>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, paddingLeft: 52 }}>
                        📎 You can share question papers (PDF, Word, images, any format)
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
