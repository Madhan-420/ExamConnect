'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Shield, BookOpen, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { profile } = useAuth();

  // Floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  const dashboardLink = profile
    ? `/${profile.role}/dashboard`
    : '/login';

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'var(--accent-purple)',
            filter: 'blur(1px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Glow Orbs */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', position: 'relative', zIndex: 10,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--gradient-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1rem', color: 'white',
          }}>
            EC
          </div>
          <span className="gradient-text" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
            ExamConnect
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 12 }}>
          {profile ? (
            <Link href={dashboardLink}>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Dashboard <ArrowRight size={16} />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <button className="btn-secondary">Sign In</button>
              </Link>
              <Link href="/register">
                <button className="btn-primary">Get Started</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '80px 20px 60px', position: 'relative', zIndex: 10,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#a78bfa', fontSize: '0.85rem', fontWeight: 500,
            marginBottom: 28,
          }}>
            <Sparkles size={14} /> MNSK College of Engineering
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 20,
            maxWidth: 700,
          }}>
            Smart{' '}
            <span className="gradient-text">Examination</span>
            <br />Management System
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            maxWidth: 530,
            lineHeight: 1.6,
            marginBottom: 40,
          }}>
            Streamline exam creation, scheduling, evaluation, and result
            publishing with our modern, role-based platform.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={profile ? dashboardLink : '/register'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary"
                style={{ padding: '16px 36px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                {profile ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight size={18} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{
        padding: '60px 40px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24,
        maxWidth: 1100,
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      }}>
        {[
          {
            icon: Shield, color: '#ec4899', title: 'Admin Control',
            desc: 'Full oversight of teachers, students, and system analytics.',
          },
          {
            icon: GraduationCap, color: '#3b82f6', title: 'Teacher Portal',
            desc: 'Create exams, add questions, evaluate answers, publish results.',
          },
          {
            icon: BookOpen, color: '#14b8a6', title: 'Student Hub',
            desc: 'View schedules, take exams, submit answers, track results.',
          },
          {
            icon: BarChart3, color: '#f97316', title: 'Analytics',
            desc: 'Interactive dashboards with real-time stats and visualizations.',
          },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            className="glass-card"
            style={{ padding: 28 }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${feature.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <feature.icon size={24} color={feature.color} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
              {feature.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '30px 20px',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--text-muted)', fontSize: '0.85rem',
        position: 'relative', zIndex: 10,
      }}>
        <p>© 2026 ExamConnect — MNSK College of Engineering</p>
        <p style={{ marginTop: 4 }}>Created by Neelakandan M</p>
      </footer>
    </div>
  );
}
