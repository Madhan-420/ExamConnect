'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const { login, profile } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (profile) {
            router.push(`/${profile.role}/dashboard`);
        }
    }, [profile, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    // Floating particles
    const particles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 8 + 8,
        delay: Math.random() * 3,
    }));

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', padding: 20,
        }}>
            {/* Background particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    animate={{ y: [0, -25, 0], opacity: [0.15, 0.4, 0.15] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                        width: p.size, height: p.size, borderRadius: '50%',
                        background: 'var(--accent-purple)', filter: 'blur(1px)', pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Glow */}
            <div style={{
                position: 'absolute', top: '-30%', right: '-20%',
                width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ padding: 40, width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}
            >
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 16,
                            background: 'var(--gradient-main)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: 16,
                        }}>
                            EC
                        </div>
                    </Link>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Sign in to your ExamConnect account
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444', fontSize: '0.85rem', marginBottom: 20, textAlign: 'center',
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                            }} />
                            <input
                                type="email"
                                className="input-field"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: 44 }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                            }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingLeft: 44, paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary"
                        style={{
                            width: '100%', padding: '14px', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        }}
                    >
                        {loading ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white', borderRadius: '50%',
                                }}
                            />
                        ) : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </motion.button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>
                        Register
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
