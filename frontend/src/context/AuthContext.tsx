'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import api from '../lib/api';

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'teacher' | 'student';
    gender?: 'male' | 'female';
    department?: string;
    reg_number?: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    register: (data: {
        email: string;
        password: string;
        full_name: string;
        role: string;
        gender: string;
        department?: string;
        reg_number?: string;
    }) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (token?: string) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const { data } = await api.get('/api/auth/me', { headers });
            setProfile(data);
        } catch {
            setProfile(null);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.access_token) {
                await fetchProfile(currentSession.access_token);
            }
            setLoading(false);
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.access_token) {
                    await fetchProfile(newSession.access_token);
                } else {
                    setProfile(null);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post('/api/auth/login', { email, password });
            if (data.access_token) {
                // Set session in Supabase client
                const { error } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.access_token,
                });
                if (error) return { error: error.message };

                setProfile(data.user);
                return {};
            }
            return { error: 'Login failed' };
        } catch (err: any) {
            if (err.response?.data?.detail) {
                return { error: err.response.data.detail };
            }
            // Network error - request never reached the server
            if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                return { error: 'Cannot reach the server. Please check your internet connection.' };
            }
            return { error: err.message || 'Login failed' };
        }
    };

    const register = async (regData: {
        email: string;
        password: string;
        full_name: string;
        role: string;
        gender: string;
        department?: string;
        reg_number?: string;
    }) => {
        try {
            await api.post('/api/auth/register', regData);
            // Auto-login after registration
            return await login(regData.email, regData.password);
        } catch (err: any) {
            return { error: err.response?.data?.detail || 'Registration failed' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, session, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
