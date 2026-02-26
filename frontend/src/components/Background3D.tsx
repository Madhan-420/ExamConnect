'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, Box, Torus, MeshDistortMaterial, Environment, ContactShadows, useCursor, useGLTF, useFBX, useAnimations, Html } from '@react-three/drei';
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
                            Model Load Error: {this.state.errorMsg}
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

        // 1. Mouse Tracking (Looking at cursor)
        const targetX = (mouse.x * viewport.width) / 5;
        const targetY = (mouse.y * viewport.height) / 5;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.4, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.2, 0.05);

        // 2. Procedural Animation (Always active, simulating floating/breathing)
        const time = state.clock.elapsedTime;

        // Gentle up and down floating
        groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.15;

        // Very subtle side-to-side sway to feel more organic
        groupRef.current.position.x = position[0] + Math.sin(time * 0.8) * 0.05;

        // Slight tilting back and forth
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

    // Clone the FBX object to prevent crashes on remount
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
            // Find the first action and play it
            const firstActionKey = Object.keys(actions)[0];
            const action = actions[firstActionKey];
            if (action) {
                action.reset().fadeIn(0.5).play();
            }
        }
    }, [actions]);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Mouse tracking
        const targetX = (mouse.x * viewport.width) / 5;
        const targetY = (mouse.y * viewport.height) / 5;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetX * 0.4, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -targetY * 0.2, 0.05);

        // 2. Procedural Animation (Always active, simulating floating/breathing)
        const time = state.clock.elapsedTime;

        // Gentle up and down floating (Slightly faster/different rhythm than girl)
        groupRef.current.position.y = position[1] + Math.sin(time * 1.8) * 0.12;

        // Very subtle side-to-side sway
        groupRef.current.position.x = position[0] + Math.cos(time * 1.1) * 0.04;

        // Slight tilting back and forth
        groupRef.current.rotation.z = Math.sin(time * 0.9) * 0.02;

        // Fallback bobbing if no animations exist in the FBX file
        if (!fbx.animations || fbx.animations.length === 0) {
            // This block is now redundant as procedural animation is always active
            // groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            <primitive object={clonedFbx} dispose={null} />
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
    const url = theme === 'male' ? '/boy.fbx' : '/girl.glb';

    if (theme === 'default') {
        return <AbstractAvatar theme={theme} />;
    }

    return (
        <AvatarErrorBoundary theme={theme}>
            <Suspense fallback={<AbstractAvatar theme={theme} />}>
                {theme === 'male' ? (
                    // Play around with FBX scale depending on how the model was exported (0.01 or 0.02 is usually standard)
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

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10, pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <Environment preset="city" />

                {/* Conditional Rendering based on Theme */}
                {theme === 'female' && <FemaleElements />}
                {theme === 'male' && <MaleElements />}
                {theme === 'default' && <DefaultElements />}

                {/* Render the local GLB avatar or fallback for all themes to enable mouse tracking */}
                <AvatarWrapper theme={theme} />
            </Canvas>
        </div>
    );
}
