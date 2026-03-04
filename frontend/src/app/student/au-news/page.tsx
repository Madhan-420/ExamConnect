'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { motion } from 'framer-motion';
import { Globe, ExternalLink, Search, Filter, BookOpen, GraduationCap, Newspaper, Calendar, FileText, Users, RefreshCw, Wifi } from 'lucide-react';
import api from '../../../lib/api';

interface AUNewsItem {
    title: string;
    link: string;
    category: string;
    date: string;
    source: string;
    is_new?: boolean;
}

const categoryIcons: Record<string, any> = {
    'Examinations': FileText,
    'Admissions': Users,
    'Research': BookOpen,
    'Events': Calendar,
    'Circulars': Newspaper,
    'Placements': GraduationCap,
    'Finance': FileText,
    'General': Globe,
};

const categoryColors: Record<string, string> = {
    'Examinations': '#ef4444',
    'Admissions': '#3b82f6',
    'Research': '#8b5cf6',
    'Events': '#f97316',
    'Circulars': '#14b8a6',
    'Placements': '#10b981',
    'Finance': '#eab308',
    'General': '#6b7280',
};

export default function AUNewsPage() {
    const [news, setNews] = useState<AUNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchNews = useCallback(async (showRefreshSpinner = false) => {
        if (showRefreshSpinner) setRefreshing(true);
        try {
            const res = await api.get('/api/au-news');
            setNews(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch AU news', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();

        // Auto-refresh every 5 minutes to keep news live
        const interval = setInterval(() => fetchNews(false), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchNews]);

    const categories = ['All', ...Array.from(new Set(news.map(n => n.category)))];

    const filtered = news.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <DashboardLayout>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(249, 115, 22, 0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                    }}>
                        <GraduationCap size={26} color="#dc2626" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Anna University Updates</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                            Live news and notifications from Anna University
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Live Indicator */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 20,
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}>
                        <Wifi size={14} color="#10b981" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#10b981' }}>LIVE</span>
                    </div>
                    {/* Refresh Button */}
                    <motion.button
                        onClick={() => fetchNews(true)}
                        disabled={refreshing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-glass)',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 500,
                        }}
                    >
                        <motion.div animate={refreshing ? { rotate: 360 } : {}}
                            transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
                            <RefreshCw size={16} />
                        </motion.div>
                        Refresh
                    </motion.button>
                </div>
            </div>

            {/* Last updated timestamp */}
            {lastUpdated && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 5 minutes
                </p>
            )}

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search news..."
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border-glass)', color: 'white',
                            padding: '11px 16px 11px 40px', borderRadius: 10,
                            outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Filter size={16} color="var(--text-muted)" />
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem',
                                fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: selectedCategory === cat
                                    ? 'var(--gradient-main)' : 'rgba(255,255,255,0.05)',
                                color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results count */}
            {!loading && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    Showing {filtered.length} of {news.length} updates
                </p>
            )}

            {/* News Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton" style={{ height: 160, borderRadius: 12 }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <Globe size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p>No news found {search && `matching "${search}"`}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {filtered.map((item, i) => {
                        const IconComp = categoryIcons[item.category] || Globe;
                        const color = categoryColors[item.category] || '#6b7280';
                        const isBreaking = item.source?.includes('Breaking');
                        return (
                            <motion.a
                                key={`${item.title.substring(0, 30)}-${i}`}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                                className="glass-card"
                                style={{
                                    padding: 20,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                    cursor: 'pointer',
                                    borderColor: isBreaking ? 'rgba(239, 68, 68, 0.3)' : undefined,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: `${color}18`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <IconComp size={18} color={color} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                        {isBreaking && (
                                            <span style={{
                                                padding: '2px 8px', borderRadius: 8, fontSize: '0.65rem',
                                                fontWeight: 700, background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                            }}>
                                                NEW
                                            </span>
                                        )}
                                        <span style={{
                                            padding: '3px 10px', borderRadius: 12, fontSize: '0.7rem',
                                            fontWeight: 600, background: `${color}18`, color: color,
                                            textTransform: 'uppercase',
                                        }}>
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                <h3 style={{
                                    fontSize: '0.92rem', fontWeight: 600,
                                    color: 'var(--text-primary)', lineHeight: 1.4,
                                    margin: 0, flex: 1,
                                    display: '-webkit-box', WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                    {item.title}
                                </h3>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        {item.source} • {item.date}
                                    </span>
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        fontSize: '0.78rem', color: '#60a5fa', fontWeight: 500,
                                    }}>
                                        Open <ExternalLink size={12} />
                                    </span>
                                </div>
                            </motion.a>
                        );
                    })}
                </div>
            )}

            {/* AU Website Link */}
            <div style={{
                marginTop: 32, textAlign: 'center', padding: 20,
                borderTop: '1px solid var(--border-glass)',
            }}>
                <a href="https://www.annauniv.edu/" target="_blank" rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 24px', borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(249,115,22,0.12))',
                        border: '1px solid rgba(220,38,38,0.25)',
                        color: '#dc2626', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600,
                    }}>
                    <GraduationCap size={18} />
                    Visit Anna University Official Website
                    <ExternalLink size={14} />
                </a>
            </div>
        </DashboardLayout>
    );
}
