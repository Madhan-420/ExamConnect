'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, X, AlertTriangle, Bell } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    priority: string; // normal, important, urgent
    created_at: string;
}

export default function NewsFlashBanner() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/news/active`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setNews(data);
                }
            } catch (err) {
                // Silently fail — banner just won't show
            } finally {
                setLoading(false);
            }
        };

        // Check session dismissal
        const sessionDismissed = sessionStorage.getItem('news_banner_dismissed');
        if (sessionDismissed) {
            setDismissed(true);
            setLoading(false);
            return;
        }

        fetchNews();
    }, []);

    if (loading || dismissed || news.length === 0) return null;

    const hasUrgent = news.some(n => n.priority === 'urgent');
    const hasImportant = news.some(n => n.priority === 'important' || n.priority === 'urgent');

    const bgColor = hasUrgent
        ? 'linear-gradient(90deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))'
        : hasImportant
            ? 'linear-gradient(90deg, rgba(249,115,22,0.12), rgba(234,179,8,0.12))'
            : 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))';

    const borderColor = hasUrgent
        ? 'rgba(239,68,68,0.3)'
        : hasImportant
            ? 'rgba(249,115,22,0.3)'
            : 'rgba(139,92,246,0.2)';

    const iconColor = hasUrgent ? '#ef4444' : hasImportant ? '#f97316' : '#8b5cf6';

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('news_banner_dismissed', 'true');
    };

    // Duplicate content for seamless loop
    const tickerItems = [...news, ...news];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={hasUrgent ? 'news-urgent' : ''}
                style={{
                    background: bgColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20,
                    overflow: 'hidden',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                }}>
                    {/* Icon */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        {hasUrgent ? (
                            <AlertTriangle size={18} color={iconColor} />
                        ) : hasImportant ? (
                            <Bell size={18} color={iconColor} />
                        ) : (
                            <Megaphone size={18} color={iconColor} />
                        )}
                    </div>

                    {/* Scrolling ticker */}
                    <div className="news-ticker" style={{ flex: 1 }}>
                        <div className="news-ticker-content">
                            {tickerItems.map((item, i) => (
                                <span key={`${item.id}-${i}`} style={{
                                    fontSize: '0.85rem',
                                    fontWeight: item.priority === 'urgent' ? 700 : item.priority === 'important' ? 600 : 400,
                                    color: item.priority === 'urgent' ? '#ef4444' :
                                        item.priority === 'important' ? '#f97316' : 'var(--text-secondary)',
                                }}>
                                    {item.priority === 'urgent' && '🔴 '}
                                    {item.priority === 'important' && '🟡 '}
                                    <strong>{item.title}</strong>
                                    {item.content && ` — ${item.content}`}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        style={{
                            background: 'none', border: 'none',
                            color: 'var(--text-muted)', cursor: 'pointer',
                            padding: 4, flexShrink: 0, display: 'flex',
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
