'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Fix for Next.js SSR hydration crashing with 3D Canvas / FBX loaders
const Background3D = dynamic(() => import('./Background3D'), {
    ssr: false,
    loading: () => <div style={{ position: 'fixed', inset: 0, background: '#0f0f13', zIndex: -10 }} />
});

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Background3D />
            {children}
        </>
    );
}
