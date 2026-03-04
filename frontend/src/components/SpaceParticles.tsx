'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function SpaceParticles() {
    const [mounted, setMounted] = useState(false);
    const { profile } = useAuth();

    const color = profile?.role === 'admin' ? 'var(--role-accent)' :
        profile?.role === 'teacher' ? 'var(--role-accent)' :
            profile?.role === 'student' ? 'var(--role-accent)' :
                'var(--accent-purple)';

    useEffect(() => { setMounted(true); }, []);

    // Generate all particles deterministically using useMemo for performance
    const particles = useMemo(() => {
        const seed = (i: number) => ((i * 9301 + 49297) % 233280) / 233280;
        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            x: seed(i) * 100,
            y: seed(i + 100) * 100,
            size: seed(i + 200) * 3 + 2,
            duration: seed(i + 300) * 8 + 8,
            delay: seed(i + 400) * 3,
        }));
    }, []);

    const stars = useMemo(() => {
        const seed = (i: number) => ((i * 7621 + 12345) % 99991) / 99991;
        return Array.from({ length: 150 }, (_, i) => ({
            id: i,
            x: seed(i) * 100,
            y: seed(i + 500) * 100,
            size: seed(i + 1000) * 2 + 0.5,
            duration: seed(i + 1500) * 5 + 3,
            delay: seed(i + 2000) * 6,
            brightness: seed(i + 2500) * 0.6 + 0.4,
        }));
    }, []);

    // Shooting stars
    const shootingStars = useMemo(() => {
        return Array.from({ length: 3 }, (_, i) => ({
            id: i,
            startX: Math.random() * 60 + 10,
            startY: Math.random() * 40 + 5,
            duration: 2 + i * 1.5,
            delay: i * 8 + 3,
        }));
    }, []);

    if (!mounted) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: -5, pointerEvents: 'none', overflow: 'hidden'
        }}>
            {/* Dense Star Field */}
            {stars.map((s) => (
                <motion.div
                    key={`star-${s.id}`}
                    animate={{ opacity: [s.brightness * 0.3, s.brightness, s.brightness * 0.3], scale: [1, 1.3, 1] }}
                    transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                        width: s.size, height: s.size, borderRadius: '50%',
                        background: `rgba(255, 255, 255, ${s.brightness})`,
                        boxShadow: s.size > 1.5 ? `0 0 ${s.size * 2}px rgba(255,255,255,0.4)` : 'none',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Colored floating particles */}
            {particles.map((p) => (
                <motion.div
                    key={`p-${p.id}`}
                    animate={{ y: [0, -25, 0], opacity: [0.15, 0.5, 0.15] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                        width: p.size, height: p.size, borderRadius: '50%',
                        background: color, filter: 'blur(1px)', pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Shooting stars */}
            {shootingStars.map((ss) => (
                <motion.div
                    key={`ss-${ss.id}`}
                    animate={{
                        x: [0, 300],
                        y: [0, 120],
                        opacity: [0, 1, 0],
                    }}
                    transition={{ duration: ss.duration, delay: ss.delay, repeat: Infinity, repeatDelay: 12 + ss.id * 5, ease: 'easeIn' }}
                    style={{
                        position: 'absolute', left: `${ss.startX}%`, top: `${ss.startY}%`,
                        width: 60, height: 1.5,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                        borderRadius: 2,
                        transform: 'rotate(25deg)',
                        pointerEvents: 'none',
                    }}
                />
            ))}

            {/* Nebula Glows */}
            <div style={{
                position: 'absolute', top: '-15%', right: '-5%',
                width: '55vw', height: '55vw', borderRadius: '50%',
                background: `radial-gradient(circle, ${color} 0%, transparent 55%)`,
                opacity: 0.12,
                pointerEvents: 'none',
                filter: 'blur(40px)',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', left: '-5%',
                width: '45vw', height: '45vw', borderRadius: '50%',
                background: `radial-gradient(circle, ${color} 0%, transparent 55%)`,
                opacity: 0.08,
                pointerEvents: 'none',
                filter: 'blur(40px)',
            }} />
            <div style={{
                position: 'absolute', top: '30%', left: '50%',
                width: '30vw', height: '30vw', borderRadius: '50%',
                background: `radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)`,
                pointerEvents: 'none',
                filter: 'blur(60px)',
                transform: 'translateX(-50%)',
            }} />
        </div>
    );
}
