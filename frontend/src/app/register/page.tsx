'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building, Hash, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
    const { register, profile } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        email: '', password: '', full_name: '',
        role: 'student', department: '', reg_number: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (profile) router.push(`/${profile.role}/dashboard`);
    }, [profile, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await register(form);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        }
    };

    const update = (field: string, value: string) => setForm({ ...form, [field]: value });

    const roles = [
        { value: 'student', label: 'Student', color: '#14b8a6', icon: '🎓' },
        { value: 'teacher', label: 'Teacher', color: '#3b82f6', icon: '📚' },
    ];

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', padding: 20,
        }}>
            {/* Glow orbs */}
            <div style={{
                position: 'absolute', top: '-20%', left: '-15%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-20%', right: '-15%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ padding: 40, width: '100%', maxWidth: 480, position: 'relative', zIndex: 10 }}
            >
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 16,
                            background: 'var(--gradient-main)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '1.2rem', color: 'white', marginBottom: 16,
                        }}>EC</div>
                    </Link>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Create Account</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Join ExamConnect today
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444', fontSize: '0.85rem', marginBottom: 20, textAlign: 'center',
                        }}
                    >{error}</motion.div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Role Selector */}
                    <div style={{ marginBottom: 20 }}>
                        <label className="form-label">I am a</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            {roles.map((r) => (
                                <button
                                    key={r.value} type="button"
                                    onClick={() => update('role', r.value)}
                                    style={{
                                        padding: '14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                        background: form.role === r.value ? `${r.color}18` : 'rgba(255,255,255,0.03)',
                                        border: `2px solid ${form.role === r.value ? r.color : 'var(--border-glass)'}`,
                                        color: form.role === r.value ? r.color : 'var(--text-secondary)',
                                        fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s ease',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    <span>{r.icon}</span> {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Full Name */}
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" className="input-field" placeholder="John Doe" value={form.full_name}
                                onChange={(e) => update('full_name', e.target.value)} required style={{ paddingLeft: 44 }} />
                        </div>
                    </div>

                    {/* Email */}
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="email" className="input-field" placeholder="your@email.com" value={form.email}
                                onChange={(e) => update('email', e.target.value)} required style={{ paddingLeft: 44 }} />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type={showPassword ? 'text' : 'password'} className="input-field" placeholder="Min 6 characters"
                                value={form.password} onChange={(e) => update('password', e.target.value)} required
                                style={{ paddingLeft: 44, paddingRight: 44 }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Department */}
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">Department</label>
                        <div style={{ position: 'relative' }}>
                            <Building size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input type="text" className="input-field" placeholder="e.g. Computer Science" value={form.department}
                                onChange={(e) => update('department', e.target.value)} style={{ paddingLeft: 44 }} />
                        </div>
                    </div>

                    {/* Reg Number (students only) */}
                    {form.role === 'student' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: 16 }}>
                            <label className="form-label">Registration Number</label>
                            <div style={{ position: 'relative' }}>
                                <Hash size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="input-field" placeholder="e.g. 2024CSE001" value={form.reg_number}
                                    onChange={(e) => update('reg_number', e.target.value)} style={{ paddingLeft: 44 }} />
                            </div>
                        </motion.div>
                    )}

                    <motion.button
                        type="submit" disabled={loading}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="btn-primary"
                        style={{
                            width: '100%', padding: '14px', fontSize: '1rem', marginTop: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                        }}
                    >
                        {loading ? (
                            <motion.div animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                        ) : (
                            <>Create Account <ArrowRight size={18} /></>
                        )}
                    </motion.button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 600 }}>
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
