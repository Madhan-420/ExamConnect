import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

export const supabase = (() => {
    // Return a proxy that lazily creates the client only when actually used at runtime
    // This prevents build-time errors when env vars are placeholders
    if (typeof window === 'undefined' && (!supabaseUrl || !supabaseUrl.startsWith('http'))) {
        // During SSR/build with invalid URL, return a mock-like object
        return new Proxy({} as SupabaseClient, {
            get: (_target, prop) => {
                if (prop === 'auth') {
                    return {
                        getSession: async () => ({ data: { session: null } }),
                        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                        getUser: async () => ({ data: { user: null } }),
                        signInWithPassword: async () => ({ data: null, error: { message: 'Not configured' } }),
                        signOut: async () => { },
                        setSession: async () => ({ error: null }),
                    };
                }
                return () => { };
            },
        });
    }

    if (!_supabase && supabaseUrl && supabaseAnonKey) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    return _supabase as SupabaseClient;
})();
