'use client';

import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, Box, Torus, MeshDistortMaterial, Environment, ContactShadows, useGLTF, useFBX, useAnimations, Html, Stars, Sparkles, MeshTransmissionMaterial, Ring } from '@react-three/drei';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../context/AuthContext';
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
function ParticleNetwork({ color, speedMult = 1, zIndex = -10, density = 200 }: { color: string, speedMult?: number, zIndex?: number, density?: number }) {
    const pointsRef = useRef<THREE.Points>(null);

    const positions = useMemo(() => {
        const p = new Float32Array(density * 3);
        for (let i = 0; i < density; i++) {
            p[i * 3 + 0] = (Math.random() - 0.5) * 45; // x
            p[i * 3 + 1] = (Math.random() - 0.5) * 45; // y
            p[i * 3 + 2] = (Math.random() - 0.5) * 20 + zIndex; // z
        }
        return p;
    }, [density, zIndex]);

    useFrame((state) => {
        if (!pointsRef.current) return;
        const time = state.clock.elapsedTime * 0.05 * speedMult;
        pointsRef.current.rotation.y = time;
        pointsRef.current.rotation.x = time * 0.5;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={density} array={positions} itemSize={3} args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.08} color={color} transparent opacity={0.6} sizeAttenuation={true} blending={THREE.AdditiveBlending} />
        </points>
    );
}

// --- ROLE SPECIFIC ENVIRONMENTS ---

function AdminEnvironment() {
    // Admin uses Crimson and Gold for a commanding, highly authoritative premium look
    return (
        <group>
            <Stars radius={60} depth={20} count={4000} factor={5} saturation={0.8} fade speed={0.5} />
            <Sparkles count={150} scale={15} size={3} speed={0.3} opacity={0.4} color="#fcd34d" />
            <ParticleNetwork color="#fda4af" density={300} speedMult={0.5} zIndex={-18} />

            {/* Authoritative Monoliths */}
            <Float speed={1} rotationIntensity={0.2} floatIntensity={1.5}>
                <mesh position={[8, 2, -18]} rotation={[0.2, -0.5, 0]}>
                    <cylinderGeometry args={[1, 1, 12, 6]} />
                    <MeshTransmissionMaterial color="#f43f5e" roughness={0.1} transmission={0.9} thickness={2.5} ior={1.5} opacity={0.7} transparent />
                </mesh>
            </Float>
            <Float speed={0.8} rotationIntensity={0.1} floatIntensity={1}>
                <mesh position={[-9, -3, -20]} rotation={[-0.2, 0.4, 0]}>
                    <cylinderGeometry args={[1.5, 1.5, 10, 6]} />
                    <MeshTransmissionMaterial color="#fbbf24" roughness={0.2} transmission={1} thickness={3} ior={1.3} opacity={0.5} transparent />
                </mesh>
            </Float>

            {/* Glowing Golden Rings of Control */}
            <Float speed={2} rotationIntensity={4} floatIntensity={2}>
                <mesh position={[-6, 5, -12]} rotation={[1, 0.5, 0]}>
                    <torusGeometry args={[2.5, 0.03, 32, 100]} />
                    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} toneMapped={false} />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={2} floatIntensity={3}>
                <mesh position={[6, -4, -10]} rotation={[0.5, -1, 0]}>
                    <torusGeometry args={[1.8, 0.05, 32, 100]} />
                    <meshStandardMaterial color="#f43f5e" emissive="#e11d48" emissiveIntensity={1.5} toneMapped={false} />
                </mesh>
            </Float>
        </group>
    );
}

function TeacherEnvironment() {
    // Teacher uses Indigo and Cyan for an intellectual, flowing, and structured aesthetic
    return (
        <group>
            <Stars radius={50} depth={20} count={3500} factor={4} saturation={0.5} fade speed={1.2} />
            <Sparkles count={200} scale={14} size={2} speed={0.6} opacity={0.5} color="#67e8f9" />
            <ParticleNetwork color="#818cf8" density={250} speedMult={1} zIndex={-15} />

            {/* Sophisticated Flowing Geometry (Torus Knots) */}
            <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
                <mesh position={[-7, 4, -14]} rotation={[0.5, 0.2, 0]}>
                    <torusKnotGeometry args={[2, 0.3, 128, 32]} />
                    <MeshTransmissionMaterial color="#6366f1" roughness={0.1} transmission={0.9} thickness={1.5} ior={1.4} opacity={0.6} transparent />
                </mesh>
            </Float>

            {/* Intellectual Floating Spheres */}
            <Float speed={2} rotationIntensity={2} floatIntensity={3}>
                <mesh position={[8, -2, -12]}>
                    <sphereGeometry args={[1.8, 64, 64]} />
                    <MeshDistortMaterial color="#06b6d4" distort={0.4} speed={2} roughness={0.1} metalness={0.8} opacity={0.4} transparent />
                </mesh>
            </Float>
            <Float speed={3} rotationIntensity={1} floatIntensity={4}>
                <Sphere args={[0.4, 32, 32]} position={[5, 5, -8]}>
                    <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={2} toneMapped={false} />
                </Sphere>
            </Float>
        </group>
    );
}

function StudentEnvironment() {
    // Student uses Emerald and Teal for dynamic, ascending, tech-forward progression
    return (
        <group>
            <Stars radius={50} depth={20} count={5000} factor={3} saturation={1} fade speed={2} />
            <Sparkles count={300} scale={16} size={1.5} speed={1} opacity={0.4} color="#34d399" />
            <ParticleNetwork color="#14b8a6" density={400} speedMult={1.5} zIndex={-12} />

            {/* Ascending Data Blocks & Tech Cubes */}
            <Float speed={2} rotationIntensity={3} floatIntensity={2}>
                <Box args={[1.5, 1.5, 1.5]} position={[-6, -3, -10]} rotation={[0.4, 0.2, 0]}>
                    <MeshTransmissionMaterial color="#10b981" roughness={0.2} transmission={1} thickness={2} ior={1.2} opacity={0.6} transparent />
                </Box>
            </Float>
            <Float speed={2.5} rotationIntensity={2} floatIntensity={3}>
                <Box args={[1, 1, 1]} position={[-8, 4, -15]} rotation={[0.8, -0.4, 0]}>
                    <MeshTransmissionMaterial color="#14b8a6" roughness={0.1} transmission={0.8} thickness={1} ior={1.5} opacity={0.7} transparent />
                </Box>
            </Float>
            <Float speed={1.5} rotationIntensity={2.5} floatIntensity={1.5}>
                <Box args={[2, 2, 2]} position={[7, 2, -14]} rotation={[0.1, 0.5, 0.8]}>
                    <MeshTransmissionMaterial color="#059669" roughness={0.3} transmission={0.9} thickness={1.5} ior={1.3} opacity={0.5} transparent />
                </Box>
            </Float>

            {/* High Tech Emerald Ring */}
            <Float speed={3} rotationIntensity={5} floatIntensity={1}>
                <mesh position={[5, -5, -8]} rotation={[-0.5, 0.8, 0]}>
                    <torusGeometry args={[1.5, 0.04, 16, 64]} />
                    <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={2.5} toneMapped={false} />
                </mesh>
            </Float>
        </group>
    );
}

function GuestEnvironment() {
    // Default fallback environment
    return (
        <group>
            <Stars radius={50} depth={20} count={3000} factor={4} saturation={0} fade speed={1} />
            <Sparkles count={150} scale={12} size={1} speed={0.4} opacity={0.2} color="#a1a1aa" />
            <ParticleNetwork color="#71717a" density={150} speedMult={0.5} zIndex={-15} />

            <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
                <mesh position={[-6, 3, -15]} scale={3}>
                    <sphereGeometry args={[1, 64, 64]} />
                    <MeshTransmissionMaterial color="#a1a1aa" roughness={0.2} transmission={0.8} thickness={2} ior={1.4} opacity={0.3} transparent />
                </mesh>
            </Float>
            <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
                <Box args={[1.5, 1.5, 1.5]} position={[8, -2, -12]} rotation={[0.5, 0.5, 0]}>
                    <MeshTransmissionMaterial color="#71717a" roughness={0.1} transmission={1} thickness={1} ior={1.5} opacity={0.4} transparent />
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

function LunarMoon({ color }: { color: string }) {
    const moonRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!moonRef.current) return;
        moonRef.current.rotation.y = state.clock.elapsedTime * 0.05;
        moonRef.current.rotation.z = state.clock.elapsedTime * 0.02;
    });

    return (
        <group>
            <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.5}>
                {/* The Moon */}
                <mesh ref={moonRef} position={[12, 8, -25]}>
                    <sphereGeometry args={[8, 64, 64]} />
                    <meshStandardMaterial
                        color="#2a2a35"
                        emissive={color}
                        emissiveIntensity={0.15}
                        roughness={0.8}
                        metalness={0.2}
                    />
                </mesh>

                {/* Moon Glow Aura */}
                <mesh position={[12, 8, -26]}>
                    <sphereGeometry args={[9.5, 32, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
                </mesh>
            </Float>
        </group>
    );
}

export default function Background3D() {
    // Theme determines the gender/model chosen
    const { theme } = useTheme();
    // Auth dictates the ambient aesthetic and 3D environment geometry
    const { profile } = useAuth();

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

    const role = profile?.role || 'guest';

    // Role-based lighting hues
    const spotLightColor =
        role === 'admin' ? '#f43f5e' :
            role === 'teacher' ? '#6366f1' :
                role === 'student' ? '#10b981' : '#a1a1aa';

    const ambientLightIntensity = role === 'student' ? 0.6 : 0.5;
    const dirLightIntensity = role === 'admin' ? 2.5 : 2.0;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -10, pointerEvents: 'none' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <ambientLight intensity={ambientLightIntensity} />
                <directionalLight position={[10, 10, 5]} intensity={dirLightIntensity} color="#ffffff" />

                {/* Dynamic Role-Based Spotlight to illuminate the avatar in the theme color */}
                <spotLight position={[-10, 10, 10]} intensity={4} color={spotLightColor} angle={0.4} penumbra={1} castShadow />

                <Environment preset="city" />

                <Suspense fallback={null}>
                    {role === 'admin' && <AdminEnvironment />}
                    {role === 'teacher' && <TeacherEnvironment />}
                    {role === 'student' && <StudentEnvironment />}
                    {role === 'guest' && <GuestEnvironment />}

                    <AvatarWrapper theme={theme} />
                    <LunarMoon color={spotLightColor} />
                </Suspense>
            </Canvas>
        </div>
    );
}
