'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, Box, Torus, MeshDistortMaterial, Environment, ContactShadows, useCursor, useGLTF, useAnimations } from '@react-three/drei';
import { useTheme } from './ThemeProvider';
import * as THREE from 'three';

// --- Shared Elements ---

// Fallback Abstract Avatar
function AbstractAvatar({ theme }: { theme: 'male' | 'female' | 'default' }) {
    const groupRef = useRef<THREE.Group>(null);
    const { mouse, viewport } = useThree();
    const color = theme === 'female' ? '#ec4899' : theme === 'male' ? '#0ea5e9' : '#10b981';

    useFrame(() => {
        if (!groupRef.current) return;
        const targetX = (mouse.x * viewport.width) / 4;
        const targetY = (mouse.y * viewport.height) / 4;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.5, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.5, 0.1);
    });

    return (
        <group ref={groupRef} position={[0, -1, -5]} scale={1.5}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
                {/* Body */}
                <mesh position={[0, 0, 0]}>
                    <capsuleGeometry args={[0.5, 1.2, 32, 32]} />
                    <meshPhysicalMaterial color={color} roughness={0.2} metalness={0.5} clearcoat={1} transmission={0.3} thickness={2} />
                </mesh>

                {/* Head */}
                <mesh position={[0, 1.4, 0]}>
                    <sphereGeometry args={[0.4, 32, 32]} />
                    <meshPhysicalMaterial color={theme === 'default' ? '#a1a1aa' : '#ffffff'} roughness={0.1} metalness={0.8} clearcoat={1} />
                </mesh>

                {/* Eyes */}
                <group position={[0, 1.4, 0.35]}>
                    <mesh position={[-0.15, 0.05, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color={color} /></mesh>
                    <mesh position={[0.15, 0.05, 0]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color={color} /></mesh>
                </group>

                {theme === 'female' && (
                    <mesh position={[0, 1.8, -0.1]} rotation={[-0.2, 0, 0]}>
                        <torusGeometry args={[0.3, 0.05, 16, 32]} />
                        <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={0.5} />
                    </mesh>
                )}

                {theme === 'male' && (
                    <group position={[0, 1.4, 0]}>
                        <mesh position={[-0.45, 0, 0]} rotation={[0, Math.PI / 2, 0]}><cylinderGeometry args={[0.15, 0.15, 0.1, 16]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh position={[0.45, 0, 0]} rotation={[0, Math.PI / 2, 0]}><cylinderGeometry args={[0.15, 0.15, 0.1, 16]} /><meshStandardMaterial color="#333" /></mesh>
                        <mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.45, 0.03, 16, 32, Math.PI]} /><meshStandardMaterial color="#333" /></mesh>
                    </group>
                )}
            </Float>
            <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={5} blur={2} far={2} color={color} />
        </group>
    );
}

function GLTFAvatar({ url, scale = 2, position = [0, -3, -5] }: { url: string, scale?: number, position?: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { actions } = useAnimations(animations, groupRef);
    const { mouse, viewport } = useThree();

    // Play first animation if available (e.g. idle breathing)
    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const firstActionKey = Object.keys(actions)[0];
            actions[firstActionKey]?.play();
        }
    }, [actions]);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Mouse tracking logic applied to the entire imported model
        const targetX = (mouse.x * viewport.width) / 5;
        const targetY = (mouse.y * viewport.height) / 5;

        // Slight dampening for realistic turning weight
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.4, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.2, 0.05);

        // Bobbing effect to simulate idle floating/breathing if no animation exists
        if (!animations || animations.length === 0) {
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <primitive object={scene} />
        </group>
    );
}

// --- Theme Specific Elements ---

function FemaleElements() {
    return (
        <group>
            {/* Distorted large background sphere */}
            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[-5, 2, -15]} scale={5}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshDistortMaterial color="#ec4899" distort={0.5} speed={2} roughness={0.2} metalness={0.8} opacity={0.15} transparent />
                </mesh>
            </Float>

            {/* Glowing Orbs representing aesthetic beauty/magic */}
            <Float speed={2} rotationIntensity={2} floatIntensity={3}>
                <Sphere args={[0.5, 32, 32]} position={[6, 4, -8]}>
                    <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={1.5} toneMapped={false} />
                </Sphere>
            </Float>
            <Float speed={2.5} rotationIntensity={1} floatIntensity={4}>
                <Sphere args={[0.3, 32, 32]} position={[-7, -2, -6]}>
                    <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={1} toneMapped={false} />
                </Sphere>
            </Float>
            <Float speed={1.5} rotationIntensity={3} floatIntensity={2}>
                <Sphere args={[0.8, 32, 32]} position={[8, -5, -12]}>
                    <meshStandardMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={0.8} toneMapped={false} opacity={0.6} transparent />
                </Sphere>
            </Float>

            {/* Abstract curved shapes (Torus knots) for elegance */}
            <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
                <mesh position={[-6, 6, -10]} rotation={[0.5, 0.2, 0]}>
                    <torusKnotGeometry args={[1, 0.2, 64, 16]} />
                    <meshPhysicalMaterial color="#fce7f3" roughness={0} transmission={1} thickness={0.5} ior={1.5} />
                </mesh>
            </Float>
        </group>
    );
}

function MaleElements() {
    return (
        <group>
            {/* Sharp technical background structure */}
            <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh position={[5, 0, -20]} rotation={[0, -0.5, 0]}>
                    <icosahedronGeometry args={[8, 1]} />
                    <meshStandardMaterial color="#0ea5e9" wireframe opacity={0.15} transparent />
                </mesh>
            </Float>

            {/* Tech Cubes and geometric shapes */}
            <Float speed={2} rotationIntensity={2} floatIntensity={2}>
                <Box args={[1.5, 1.5, 1.5]} position={[-6, 4, -10]} rotation={[0.5, 0.5, 0]}>
                    <meshPhysicalMaterial color="#3b82f6" roughness={0.1} metalness={0.6} transmission={0.9} ior={1.5} thickness={1} opacity={0.4} transparent />
                </Box>
            </Float>
            <Float speed={1.5} rotationIntensity={1.5} floatIntensity={3}>
                <Box args={[2, 2, 2]} position={[7, -3, -12]} rotation={[1, 0.2, 0.5]}>
                    <meshPhysicalMaterial color="#8b5cf6" roughness={0.2} metalness={0.8} transmission={0.8} ior={1.5} thickness={1} opacity={0.4} transparent />
                </Box>
            </Float>

            {/* Glowing Tech Rings */}
            <Float speed={1} rotationIntensity={3} floatIntensity={1}>
                <mesh position={[-8, -5, -8]} rotation={[-0.5, 0.8, 0]}>
                    <torusGeometry args={[1.5, 0.05, 16, 64]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} toneMapped={false} />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
                <mesh position={[6, 6, -15]} rotation={[0.8, -0.4, 0]}>
                    <octahedronGeometry args={[1.5, 0]} />
                    <meshPhysicalMaterial color="#e0f2fe" roughness={0} transmission={1} thickness={0.5} ior={1.5} />
                </mesh>
            </Float>
        </group>
    );
}

function DefaultElements() {
    return (
        <group>
            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[-5, 2, -15]} scale={4}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshDistortMaterial color="#10b981" distort={0.3} speed={1.5} roughness={0.2} metalness={0.8} opacity={0.1} transparent />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
                <Box args={[1.5, 1.5, 1.5]} position={[8, 0, -12]} rotation={[0.5, 0.5, 0]}>
                    <meshPhysicalMaterial color="#14b8a6" roughness={0.1} metalness={0.1} transmission={0.9} ior={1.5} thickness={1} opacity={0.3} transparent />
                </Box>
            </Float>
        </group>
    );
}

function AvatarWrapper({ theme }: { theme: 'male' | 'female' | 'default' }) {
    const [modelExists, setModelExists] = useState<boolean | null>(null);
    const url = theme === 'male' ? '/toji.glb' : '/girl.glb';

    useEffect(() => {
        if (theme === 'default') {
            setModelExists(false);
            return;
        }

        // Check if the user has placed the custom GLB file in the public folder
        fetch(url)
            .then(res => {
                if (res.ok) setModelExists(true);
                else setModelExists(false);
            })
            .catch(() => setModelExists(false));
    }, [theme, url]);

    if (modelExists === null) return null; // Wait for check

    if (modelExists) {
        return (
            <Suspense fallback={<AbstractAvatar theme={theme} />}>
                {/* Adjust scale based on typical character proportions */}
                <GLTFAvatar url={url} scale={theme === 'male' ? 2 : 1.8} position={[0, -3, -5]} />
            </Suspense>
        );
    }

    // Fallback gracefully to the Abstract Avatar if file is missing
    return <AbstractAvatar theme={theme} />;
}

// --- Main Background Component ---

function SketchfabBackground() {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10 }}>
            <div className="sketchfab-embed-wrapper" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                <iframe
                    title="Gojo Curse Technique: RED"
                    frameBorder="0"
                    allowFullScreen
                    // @ts-ignore
                    mozallowfullscreen="true"
                    // @ts-ignore
                    webkitallowfullscreen="true"
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    xr-spatial-tracking="true"
                    execution-while-out-of-viewport="true"
                    execution-while-not-rendered="true"
                    web-share="true"
                    src="https://sketchfab.com/models/bb133bdbd15b4621a40dd9394fae83c2/embed?autostart=1&ui_theme=dark&dnt=1"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                ></iframe>
            </div>

            {/* Overlay to blend the iframe slightly into our dark theme and prevent it from stealing all clicks */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(9, 9, 11, 0.4)', pointerEvents: 'none' }} />
        </div>
    );
}

export default function Background3D() {
    const { theme } = useTheme();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10, pointerEvents: 'none' }}>
            {/* Render the Sketchfab embed underneath the Canvas if male, allowing pointer events so they can rotate it */}
            {theme === 'male' && <div style={{ pointerEvents: 'auto' }}><SketchfabBackground /></div>}

            <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <Environment preset="city" />

                {/* Conditional Rendering based on Theme */}
                {theme === 'female' && <FemaleElements />}
                {theme === 'male' && <MaleElements />}
                {theme === 'default' && <DefaultElements />}

                {/* We only render the central React Three Fiber avatar wrapper if it's NOT the male theme, since male uses Sketchfab now */}
                {theme !== 'male' && <AvatarWrapper theme={theme} />}

            </Canvas>
        </div>
    );
}
