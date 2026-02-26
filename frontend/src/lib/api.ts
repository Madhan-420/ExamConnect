import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Main API client with JWT interceptor (for authenticated routes)
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15s timeout to prevent hanging requests
});

// Plain API client WITHOUT JWT interceptor (for login/register)
// This avoids calling supabase.auth.getSession() which may hang
// if the Supabase domain is unreachable on the network.
export const authApi = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Attach JWT to every request (only for the main api instance)
api.interceptors.request.use(async (config) => {
    try {
        // Race getSession against a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Session check timed out')), 3000)
        );
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
        if (result?.data?.session?.access_token) {
            config.headers.Authorization = `Bearer ${result.data.session.access_token}`;
        } else {
            // Supabase returned null session, fallback to localStorage
            const storedToken = typeof window !== 'undefined'
                ? localStorage.getItem('exam_connect_token')
                : null;
            if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`;
            }
        }
    } catch {
        // If getSession throws or times out, fallback to localStorage
        const storedToken = typeof window !== 'undefined'
            ? localStorage.getItem('exam_connect_token')
            : null;
        if (storedToken) {
            config.headers.Authorization = `Bearer ${storedToken}`;
        }
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired, redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('exam_connect_token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
