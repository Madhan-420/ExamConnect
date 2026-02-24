'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Attempt to log to console, though Netlify may suppress it
        console.error('Captured by error.tsx:', error);
    }, [error]);

    return (
        <div style={{ padding: 40, background: '#111', color: '#ff6b6b', fontFamily: 'monospace', minHeight: '100vh', zIndex: 9999, position: 'relative' }}>
            <h2>🚨 FATAL CLIENT RENDER ERROR CAUGHT 🚨</h2>
            <p style={{ fontSize: '1.2rem', margin: '20px 0' }}><strong>Message:</strong> {error.message}</p>
            <p><strong>Digest ID:</strong> {error.digest || 'None provided'}</p>

            <div style={{ background: '#000', padding: 20, borderRadius: 8, overflowX: 'auto', marginTop: 20 }}>
                <p style={{ color: '#888', marginBottom: 10 }}>Raw Stack Trace:</p>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5 }}>{error.stack}</pre>
            </div>

            <button
                onClick={() => reset()}
                style={{ padding: '12px 24px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 6, marginTop: 30, cursor: 'pointer', fontWeight: 'bold' }}>
                Attempt Component Recovery Reload
            </button>

            <p style={{ marginTop: 20, color: '#ffeb3b', fontSize: '0.85rem' }}>
                *Please send a screenshot of this exact page to the AI Developer.*
            </p>
        </div>
    );
}
