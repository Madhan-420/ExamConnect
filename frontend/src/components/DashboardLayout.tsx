'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !profile) {
            router.push('/login');
        }
    }, [loading, profile, router]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: 48, height: 48,
                        border: '3px solid var(--border-glass)',
                        borderTopColor: 'var(--accent-purple)',
                        borderRadius: '50%',
                    }}
                />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
