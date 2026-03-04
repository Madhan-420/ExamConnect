'use client';

import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, Box, Torus, MeshDistortMaterial, Environment, ContactShadows, useGLTF, useFBX, useAnimations, Html, Stars, Sparkles, MeshTransmissionMaterial } from '@react-three/drei';
import { useTheme } from './ThemeProvider';
import * as THREE from 'three';

// --- Shared Elements ---

// Prevent 3D Model fetch failures from crashing the whole app
class AvatarErrorBoundary extends React.Component<{ children: React.ReactNode, theme: 'male' | 'female' | 'default' }, { hasError: boolean, errorMsg: string }> {
    constructor(props: any) { super(props); this.state = { hasError: false, errorMsg: '' }; }
    static getDerivedStateFromError(error: any) { return { hasError: true, errorMsg: error?.message || 'Unknown Error' }; }
    componentDidCatch(error: any) { console.error("3D Avatar Load Error:", error); }
    render() {
        if (this.state.hasError) {
            return (
                <group>
                    <Html position={[0, 2, 0]} center>
                        <div style={{ background: 'rgba(255,0,0,0.2)', color: '#ffaaaa', padding: '4px 8px', borderRadius: 4, fontSize: '10px', whiteSpace: 'nowrap' }}>
                            Model Load Error
                        </div>
                    </Html>
                    <AbstractAvatar theme={this.props.theme} />
                </group>
            );
        }
        return this.props.children;
    }
}

// Fallback Abstract Avatar
function AbstractAvatar({ theme }: { theme: 'male' | 'female' | 'default' }) {
    const groupRef = useRef<THREE.Group>(null);
    const { mouse, viewport } = useThree();
    const color = theme === 'female' ? '#ec4899' : theme === 'male' ? '#0ea5e9' : '#10b981';

    useFrame((state) => {
        if (!groupRef.current) return;
        const targetX = (mouse.x * viewport.width) / 4;
        const targetY = (mouse.y * viewport.height) / 4;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.5, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.5, 0.1);

        // Add gentle breathing
        groupRef.current.position.y = -1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    });

    return (
        <group ref={groupRef} position={[0, -1, -5]} scale={1.5}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                {/* Body */}
                <mesh position={[0, 0, 0]}>
                    <capsuleGeometry args={[0.5, 1.2, 32, 32]} />
                    <MeshTransmissionMaterial color={color} roughness={0.1} metalness={0.1} transmission={0.9} ior={1.5} thickness={2} />
                </mesh>

                {/* Head */}
                <mesh position={[0, 1.4, 0]}>
                    <sphereGeometry args={[0.4, 32, 32]} />
                    <MeshTransmissionMaterial color={theme === 'default' ? '#a1a1aa' : '#ffffff'} roughness={0} transmission={1} ior={1.5} thickness={1} />
                </mesh>
            </Float>
            <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={5} blur={2.5} far={2} color={color} />
        </group>
    );
}

function GLTFAvatar({ url, scale = 2, position = [0, -3, -5] }: { url: string, scale?: number, position?: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { actions } = useAnimations(animations, groupRef);
    const { mouse, viewport } = useThree();

    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const firstActionKey = Object.keys(actions)[0];
            actions[firstActionKey]?.play();
        }
    }, [actions]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const targetX = (mouse.x * viewport.width) / 5;
        const targetY = (mouse.y * viewport.height) / 5;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.4, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.2, 0.05);

        const time = state.clock.elapsedTime;
        groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.15;
        groupRef.current.position.x = position[0] + Math.sin(time * 0.8) * 0.05;
        groupRef.current.rotation.z = Math.sin(time * 1.2) * 0.03;
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <primitive object={scene} />
        </group>
    );
}

function FBXAvatar({ url, scale = 0.012, position = [0, -3.5, -4] }: { url: string, scale?: number, position?: [number, number, number] }) {
    const groupRef = useRef<THREE.Group>(null);
    const fbx = useFBX(url);
    const animations = fbx.animations || [];
    const { actions } = useAnimations(animations, groupRef);
    const { mouse, viewport } = useThree();

    const clonedFbx = React.useMemo(() => {
        const clone = fbx.clone();
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        return clone;
    }, [fbx]);

    useEffect(() => {
        if (actions && Object.keys(actions).length > 0) {
            const firstActionKey = Object.keys(actions)[0];
            const action = actions[firstActionKey];
            if (action) {
                action.reset().fadeIn(0.5).play();
            }
        }
    }, [actions]);

    useFrame((state) => {
        if (!groupRef.current) return;
        const targetX = (mouse.x * viewport.width) / 5;
        const targetY = (mouse.y * viewport.height) / 5;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.4, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.2, 0.05);

        const time = state.clock.elapsedTime;
        groupRef.current.position.y = position[1] + Math.sin(time * 1.8) * 0.12;
        groupRef.current.position.x = position[0] + Math.cos(time * 1.1) * 0.04;
        groupRef.current.rotation.z = Math.sin(time * 0.9) * 0.02;
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <primitive object={clonedFbx} dispose={null} />
        </group>
    );
}

// --- Dynamics Particles Network ---
function ParticleNetwork({ color }: { color: string }) {
    const pointsRef = useRef<THREE.Points>(null);

    // Create random points for a beautiful constellation effect
    const particlesCount = 200;
    const positions = useMemo(() => {
        const p = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount; i++) {
            p[i * 3 + 0] = (Math.random() - 0.5) * 30; // x
            p[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
            p[i * 3 + 2] = (Math.random() - 0.5) * 15 - 10; // z (push back)
        }
        return p;
    }, [particlesCount]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime * 0.05;
        pointsRef.current.rotation.y = time;
        pointsRef.current.rotation.x = time * 0.5;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.08} color={color} transparent opacity={0.6} sizeAttenuation={true} blending={THREE.AdditiveBlending} />
        </points>
    );
}

// --- Theme Specific Elements ---

function FemaleElements() {
    return (
        <group>
            {/* Stars & Particles */}
            <Stars radius={50} depth={20} count={3000} factor={4} saturation={0.5} fade speed={1} />
            <Sparkles count={150} scale={12} size={2} speed={0.4} opacity={0.5} color="#ec4899" />
            <ParticleNetwork color="#f472b6" />

            {/* Distorted large background sphere - Glassmorphic */}
            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[8, 4, -15]} scale={4}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshDistortMaterial color="#ec4899" distort={0.6} speed={2} roughness={0.1} metalness={0.9} opacity={0.3} transparent />
                </mesh>
            </Float>

            <Float speed={2} rotationIntensity={2} floatIntensity={3}>
                <mesh position={[-6, 5, -8]}>
                    <octahedronGeometry args={[1.5, 2]} />
                    <MeshTransmissionMaterial color="#f472b6" roughness={0.1} transmission={1} ior={1.3} thickness={2} opacity={0.8} transparent />
                </mesh>
            </Float>
            <Float speed={2.5} rotationIntensity={3} floatIntensity={4}>
                <Sphere args={[0.5, 32, 32]} position={[6, -4, -6]}>
                    <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={2} toneMapped={false} />
                </Sphere>
            </Float>
        </group>
    );
}

function MaleElements() {
    return (
        <group>
            {/* Stars & Particles */}
            <Stars radius={50} depth={20} count={3000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={150} scale={15} size={2} speed={0.5} opacity={0.5} color="#38bdf8" />
            <ParticleNetwork color="#0ea5e9" />

            {/* Geometric Glass Shapes */}
            <Float speed={1} rotationIntensity={1} floatIntensity={2}>
                <mesh position={[8, 3, -12]} rotation={[0.5, 0.5, 0]}>
                    <icosahedronGeometry args={[2.5, 0]} />
                    <MeshTransmissionMaterial color="#0ea5e9" roughness={0.1} transmission={0.9} thickness={1.5} ior={1.5} opacity={0.5} transparent />
                </mesh>
            </Float>

            <Float speed={2} rotationIntensity={2} floatIntensity={2}>
                <Box args={[1.5, 1.5, 1.5]} position={[-7, -2, -10]} rotation={[0.4, 0.2, 0]}>
                    <MeshTransmissionMaterial color="#8b5cf6" roughness={0.2} transmission={1} thickness={2} ior={1.2} />
                </Box>
            </Float>

            {/* Glowing Tech Rings */}
            <Float speed={1.5} rotationIntensity={3} floatIntensity={1}>
                <mesh position={[5, -5, -8]} rotation={[-0.5, 0.8, 0]}>
                    <torusGeometry args={[2, 0.02, 16, 64]} />
                    <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} toneMapped={false} />
                </mesh>
            </Float>
        </group>
    );
}

function DefaultElements() {
    return (
        <group>
            <Stars radius={50} depth={20} count={4000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={200} scale={12} size={1} speed={0.4} opacity={0.3} color="#10b981" />
            <ParticleNetwork color="#10b981" />

            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[-6, 3, -15]} scale={3}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshTransmissionMaterial color="#14b8a6" roughness={0.1} transmission={0.9} thickness={2} ior={1.4} opacity={0.4} transparent />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
                <Box args={[1.5, 1.5, 1.5]} position={[8, -2, -12]} rotation={[0.5, 0.5, 0]}>
                    <MeshTransmissionMaterial color="#8b5cf6" roughness={0.1} transmission={1} thickness={1} ior={1.5} opacity={0.5} transparent />
                </Box>
            </Float>
        </group>
    );
}

function AvatarWrapper({ theme }: { theme: 'male' | 'female' | 'default' }) {
    const url = theme === 'male' ? '/boy.fbx' : '/girl.glb';

    if (theme === 'default') {
        return <AbstractAvatar theme={theme} />;
    }

    return (
        <AvatarErrorBoundary theme={theme}>
            <Suspense fallback={<AbstractAvatar theme={theme} />}>
                {theme === 'male' ? (
                    <FBXAvatar url={url} scale={0.015} position={[0, -3.5, -4]} />
                ) : (
                    <GLTFAvatar url={url} scale={1.8} position={[0, -3, -5]} />
                )}
            </Suspense>
        </AvatarErrorBoundary>
    );
}

export default function Background3D() {
    const { theme } = useTheme();
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!mounted || isMobile) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10, pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />
                <spotLight position={[-10, 10, 10]} intensity={3} color="var(--role-accent)" angle={0.3} penumbra={1} />

                <Environment preset="city" />

                <Suspense fallback={null}>
                    {theme === 'female' && <FemaleElements />}
                    {theme === 'male' && <MaleElements />}
                    {theme === 'default' && <DefaultElements />}
                    <AvatarWrapper theme={theme} />
                </Suspense>
            </Canvas>
        </div>
    );
}
