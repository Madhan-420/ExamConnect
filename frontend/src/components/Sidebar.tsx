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
    Sparkles,
    MessageSquare,
    Video,
    BarChart2,
    GraduationCap,
    Award,
    Newspaper,
    Globe
} from 'lucide-react';

const roleNavItems = {
    admin: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Manage Users', icon: Users },
        { href: '/admin/attendance', label: 'Attendance', icon: FileText },
        { href: '/admin/feedbacks', label: 'Complaints', icon: MessageSquare },
        { href: '/admin/exams', label: 'Exam Monitor', icon: FileText },
        { href: '/admin/students', label: 'Student Performance', icon: GraduationCap },
        { href: '/admin/teachers', label: 'Teacher Activity', icon: BarChart2 },
        { href: '/admin/news', label: 'News Manager', icon: Newspaper },
        { href: '/admin/au-news', label: 'AU Updates', icon: Globe },
    ],
    teacher: [
        { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/teacher/my-students', label: 'My Students', icon: Users },
        { href: '/teacher/attendance', label: 'Attendance', icon: FileText },
        { href: '/teacher/internal-marks', label: 'Internal Marks', icon: Award },
        { href: '/teacher/exams', label: 'My Exams', icon: ClipboardList },
        { href: '/teacher/feedbacks', label: 'Complaints', icon: MessageSquare },
        { href: '/teacher/chat', label: 'Group Chat', icon: MessageSquare },
        { href: '/teacher/live-classes', label: 'Live Classes', icon: Video },
        { href: '/teacher/au-news', label: 'AU Updates', icon: Globe },
    ],
    student: [
        { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/student/exams', label: 'Exams', icon: BookOpen },
        { href: '/student/results', label: 'Results', icon: Trophy },
        { href: '/student/feedbacks', label: 'Complaints', icon: MessageSquare },
        { href: '/student/ai-assistant', label: 'AI Study Assistant', icon: Sparkles },
        { href: '/student/chat', label: 'Group Chat', icon: MessageSquare },
        { href: '/student/live-classes', label: 'Live Classes', icon: Video },
        { href: '/student/au-news', label: 'AU Updates', icon: Globe },
    ],
};

export default function Sidebar() {
    const { profile, logout } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    React.useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    if (!profile) return null;

    const navItems = roleNavItems[profile.role as keyof typeof roleNavItems] || [];
    const roleBadgeColor = 'var(--role-accent)';

    // --- Sidebar Content ---
    const sidebarContent = (isMobile: boolean) => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Brand Area */}
            <div style={{
                padding: (!isMobile && collapsed) ? '24px 12px' : '28px 24px',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(180deg, rgba(var(--role-accent-rgb), 0.05), transparent)'
            }}>
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'var(--role-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1.2rem', color: 'white', flexShrink: 0,
                        boxShadow: '0 4px 15px rgba(var(--role-accent-rgb), 0.3)'
                    }}>
                        EC
                    </div>
                    {(isMobile || !collapsed) && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="role-gradient-text"
                            style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}
                        >
                            ExamConnect
                        </motion.span>
                    )}
                </Link>
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                            color: 'var(--text-muted)', cursor: 'pointer', padding: 8, borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Navigation Links */}
            <nav className="hide-scrollbar" style={{ flex: 1, padding: '24px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <motion.div
                                whileHover={{ x: 4, background: isActive ? 'var(--role-badge-bg)' : 'rgba(255,255,255,0.03)' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: (!isMobile && collapsed) ? '14px' : '14px 18px',
                                    borderRadius: '14px',
                                    background: isActive ? 'var(--role-badge-bg)' : 'transparent',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    border: isActive ? '1px solid rgba(var(--role-accent-rgb), 0.2)' : '1px solid transparent',
                                    boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.1), var(--role-glow)' : 'none'
                                }}
                            >
                                <Icon size={22} color={isActive ? "var(--role-accent)" : "currentColor"} style={{ flexShrink: 0 }} />
                                {(isMobile || !collapsed) && item.label}

                                {isActive && (
                                    <motion.div
                                        layoutId={isMobile ? 'mobileActiveIndicator' : 'activeIndicator'}
                                        style={{
                                            position: 'absolute', left: 0, top: '20%', bottom: '20%',
                                            width: 4, borderRadius: '0 4px 4px 0',
                                            background: 'var(--role-gradient)',
                                            boxShadow: '0 0 10px rgba(var(--role-accent-rgb), 0.5)'
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div style={{ padding: '24px 16px', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                {(isMobile || !collapsed) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 8px' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--role-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} color="var(--role-accent)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {profile.full_name}
                            </p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--role-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {profile.role}
                            </p>
                        </div>
                    </div>
                )}

                {!isMobile && (
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10, borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
                            marginBottom: 8, transition: 'all 0.2s ease'
                        }}
                    >
                        {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse Menu</>}
                    </button>
                )}

                <button
                    onClick={logout}
                    style={{
                        width: '100%', padding: '14px',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
                        border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 10, fontSize: '0.9rem', fontWeight: 600,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <LogOut size={20} />
                    {(isMobile || !collapsed) && 'Sign Out'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* ─── Premium Mobile Top Header ─── */}
            <div className="mobile-only-header" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
                height: '72px', background: 'rgba(5, 5, 8, 0.75)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-glass)',
                display: 'none', /* Display managed by CSS media query */
                alignItems: 'center', justifyContent: 'space-between',
                padding: '0 20px', boxShadow: '0 4px 30px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, background: 'var(--role-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1rem', color: 'white',
                    }}>EC</div>
                    <span className="role-gradient-text" style={{ fontWeight: 800, fontSize: '1.2rem' }}>ExamConnect</span>
                </div>

                <button
                    onClick={() => setMobileOpen(true)}
                    style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* ─── Mobile Slide-out Drawer ─── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(8px)', zIndex: 70,
                            }}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, bottom: 0, width: '85%', maxWidth: '320px',
                                background: 'rgba(10, 10, 14, 0.95)', borderRight: '1px solid var(--border-glass)',
                                zIndex: 80, overflow: 'hidden', boxShadow: '10px 0 50px rgba(0,0,0,0.8)'
                            }}
                        >
                            {sidebarContent(true)}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Desktop Floating Rail Sidebar ─── */}
            <motion.aside
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="desktop-sidebar"
                style={{
                    width: collapsed ? '88px' : '280px',
                    height: 'calc(100vh - 32px)',
                    margin: '16px 0 16px 16px',
                    borderRadius: '24px',
                    background: 'rgba(20, 20, 25, 0.4)',
                    backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex', flexDirection: 'column',
                    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'sticky', top: 16, zIndex: 50,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    overflow: 'hidden'
                }}
            >
                {sidebarContent(false)}
            </motion.aside>

            {/* Inject mobile header display logic directly into head so it works independently */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 768px) {
                    .desktop-sidebar { display: none !important; }
                    .mobile-only-header { display: flex !important; }
                }
            `}} />
        </>
    );
}
