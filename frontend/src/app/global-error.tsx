'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Captured by global-error.tsx:', error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div style={{ padding: 40, background: '#111', color: '#ff6b6b', fontFamily: 'monospace', minHeight: '100vh', zIndex: 9999, position: 'relative' }}>
                    <h2>🚨 FATAL GLOBAL ERROR CAUGHT 🚨</h2>
                    <p style={{ fontSize: '1.2rem', margin: '20px 0' }}><strong>Message:</strong> {error.message}</p>
                    <p><strong>Digest ID:</strong> {error.digest}</p>
                    <div style={{ background: '#000', padding: 20, borderRadius: 8, overflowX: 'auto', marginTop: 20 }}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.5 }}>{error.stack}</pre>
                    </div>
                    <button onClick={() => reset()} style={{ padding: '12px 24px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: 6, marginTop: 30, cursor: 'pointer', fontWeight: 'bold' }}>
                        Attempt Recovery Reload
                    </button>
                </div>
            </body>
        </html>
    );
}
