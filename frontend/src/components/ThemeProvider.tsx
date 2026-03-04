'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface ThemeContextType {
    theme: 'male' | 'female' | 'default';
    role: 'admin' | 'teacher' | 'student' | null;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'default', role: null });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { profile } = useAuth();
    const [theme, setTheme] = useState<'male' | 'female' | 'default'>('default');
    const [role, setRole] = useState<'admin' | 'teacher' | 'student' | null>(null);

    useEffect(() => {
        // Gender themes for students
        if (profile?.role === 'student' && profile.gender) {
            setTheme(profile.gender as 'male' | 'female');
        } else {
            setTheme('default');
        }

        // Role theming for all users
        if (profile?.role) {
            setRole(profile.role as 'admin' | 'teacher' | 'student');
        } else {
            setRole(null);
        }
    }, [profile]);

    // Apply data attributes for CSS cascading
    useEffect(() => {
        const html = document.documentElement;

        // Gender theme
        if (theme === 'male') {
            html.setAttribute('data-theme', 'male');
        } else if (theme === 'female') {
            html.setAttribute('data-theme', 'female');
        } else {
            html.removeAttribute('data-theme');
        }

        // Role theme
        if (role) {
            html.setAttribute('data-role', role);
        } else {
            html.removeAttribute('data-role');
        }
    }, [theme, role]);

    return (
        <ThemeContext.Provider value={{ theme, role }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
