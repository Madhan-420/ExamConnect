'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function SpaceParticles() {
    const [particles, setParticles] = useState<any[]>([]);
    const [stars, setStars] = useState<any[]>([]);
    const { profile } = useAuth();

    // Determine color based on role
    const color = profile?.role === 'admin' ? 'var(--role-accent)' :
        profile?.role === 'teacher' ? 'var(--role-accent)' :
            profile?.role === 'student' ? 'var(--role-accent)' :
                'var(--accent-purple)';

    useEffect(() => {
        setParticles(Array.from({ length: 25 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 2,
            duration: Math.random() * 8 + 8,
            delay: Math.random() * 3,
        })));

        setStars(Array.from({ length: 75 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 1.5 + 0.5,
            duration: Math.random() * 4 + 4,
            delay: Math.random() * 5,
        })));
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: -5, pointerEvents: 'none', overflow: 'hidden'
        }}>
            {/* Background particles */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    animate={{ y: [0, -30, 0], opacity: [0.15, 0.4, 0.15] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                        width: p.size, height: p.size, borderRadius: '50%',
                        background: color, filter: 'blur(1px)', pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Stars */}
            {stars.map((s) => (
                <motion.div
                    key={`star-${s.id}`}
                    animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
                    transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                        width: s.size, height: s.size, borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.8)', filter: 'blur(0.5px)', pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Glows */}
            <div style={{
                position: 'absolute', top: '-20%', right: '-10%',
                width: '60vw', height: '60vw', borderRadius: '50%',
                background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
                opacity: 0.08,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-20%', left: '-10%',
                width: '50vw', height: '50vw', borderRadius: '50%',
                background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
                opacity: 0.06,
                pointerEvents: 'none',
            }} />
        </div>
    );
}
