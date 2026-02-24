'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    ClipboardList,
    BookOpen,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
} from 'lucide-react';

const roleNavItems = {
    admin: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Manage Users', icon: Users },
        { href: '/admin/exams', label: 'All Exams', icon: FileText },
    ],
    teacher: [
        { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/teacher/exams', label: 'My Exams', icon: ClipboardList },
    ],
    student: [
        { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/student/exams', label: 'Exams', icon: BookOpen },
        { href: '/student/results', label: 'Results', icon: Trophy },
    ],
};

export default function Sidebar() {
    const { profile, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    // Close mobile nav on route change
    React.useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    if (!profile) return null;

    const navItems = roleNavItems[profile.role as keyof typeof roleNavItems] || [];

    const roleBadgeColor = {
        admin: '#ec4899',
        teacher: '#3b82f6',
        student: '#14b8a6',
    }[profile.role] || '#8b5cf6';

    const sidebarContent = (isMobile: boolean) => (
        <>
            {/* Brand */}
            <div style={{
                padding: (!isMobile && collapsed) ? '20px 12px' : '24px 20px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'var(--gradient-main)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem', color: 'white', flexShrink: 0,
                    }}>
                        EC
                    </div>
                    {(isMobile || !collapsed) && (
                        <span className="gradient-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            ExamConnect
                        </span>
                    )}
                </Link>
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: 4,
                        }}
                    >
                        <X size={22} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '16px 10px' }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ x: 4 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: (!isMobile && collapsed) ? '12px' : '12px 16px',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '4px',
                                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                    color: isActive ? '#a78bfa' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
                                    position: 'relative',
                                    cursor: 'pointer',
                                }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId={isMobile ? 'mobileActiveNav' : 'activeNavIndicator'}
                                        style={{
                                            position: 'absolute',
                                            left: 0, top: 0, bottom: 0,
                                            width: 3,
                                            borderRadius: '0 4px 4px 0',
                                            background: 'var(--gradient-main)',
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <Icon size={20} style={{ flexShrink: 0 }} />
                                {(isMobile || !collapsed) && item.label}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div style={{ padding: '16px 10px', borderTop: '1px solid var(--border-glass)' }}>
                {/* User Info */}
                {(isMobile || !collapsed) && (
                    <div style={{ padding: '12px 16px', marginBottom: 8 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {profile.full_name}
                        </p>
                        <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor: `${roleBadgeColor}22`,
                            color: roleBadgeColor,
                            marginTop: 4,
                        }}>
                            {profile.role}
                        </span>
                    </div>
                )}

                {/* Collapse Toggle (desktop only) */}
                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            width: '100%', padding: '10px', background: 'transparent',
                            border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 8, borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                        }}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse</>}
                    </button>
                )}

                {/* Logout */}
                <button
                    onClick={logout}
                    style={{
                        width: '100%', padding: '12px 16px', marginTop: 8,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 8, fontSize: '0.85rem', fontWeight: 500,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                >
                    <LogOut size={18} />
                    {(isMobile || !collapsed) && 'Sign Out'}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* ─── Mobile Hamburger Button ─── */}
            <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                className="mobile-nav-toggle"
                style={{
                    position: 'fixed',
                    top: 16, left: 16,
                    zIndex: 60,
                    width: 44, height: 44,
                    borderRadius: 12,
                    background: 'rgba(15, 15, 40, 0.9)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'none', /* hidden on desktop, shown via CSS */
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
            >
                <Menu size={22} />
            </button>

            {/* ─── Mobile Overlay + Drawer ─── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="mobile-nav-overlay"
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 70,
                            }}
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="mobile-nav-drawer"
                            style={{
                                position: 'fixed',
                                top: 0, left: 0, bottom: 0,
                                width: 280,
                                background: 'rgba(15, 15, 40, 0.98)',
                                borderRight: '1px solid var(--border-glass)',
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 80,
                                overflowY: 'auto',
                            }}
                        >
                            {sidebarContent(true)}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Desktop Sidebar ─── */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="desktop-sidebar"
                style={{
                    width: collapsed ? '76px' : '260px',
                    minHeight: '100vh',
                    background: 'rgba(15, 15, 40, 0.15)', // Highly transparent for glass effect
                    backdropFilter: 'blur(20px)', // Glassmorphism blur
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRight: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                }}
            >
                {sidebarContent(false)}
            </motion.aside>
        </>
    );
}
