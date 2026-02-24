'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, Sphere, MeshDistortMaterial, useGLTF, useAnimations } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, X, Sparkles } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as THREE from 'three'; // Import THREE for MathUtils

// Initialize Gemini API (Uses an environment variable if available, otherwise it will fallback to a hardcoded demo response if the variable is missing to prevent crashing)
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "dummy_key");

// 3D Globe Visualizer that reacts to the AI's processing state
function GlobeVisualizer({ gender, isLoading }: { gender: 'male' | 'female', isLoading: boolean }) {
    const color = gender === 'female' ? '#ec4899' : '#8b5cf6';
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current || !ringRef.current) return;
        // Slowly rotate the globe
        meshRef.current.rotation.x = state.clock.elapsedTime * (isLoading ? 0.5 : 0.2);
        meshRef.current.rotation.y = state.clock.elapsedTime * (isLoading ? 0.8 : 0.3);

        // Spin the orbital ring
        ringRef.current.rotation.z = state.clock.elapsedTime * (isLoading ? 2 : 0.5);
    });

    return (
        <group position={[0, -0.5, 0]}>
            <Float speed={isLoading ? 5 : 2} rotationIntensity={isLoading ? 3 : 1} floatIntensity={isLoading ? 3 : 1}>
                {/* Outer Distorted Energy Mesh */}
                <mesh ref={meshRef}>
                    <sphereGeometry args={[1.6, 64, 64]} />
                    <MeshDistortMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={isLoading ? 1.5 : 0.4}
                        distort={isLoading ? 0.7 : 0.3}
                        speed={isLoading ? 5 : 2}
                        roughness={0.2}
                        metalness={0.8}
                        wireframe={isLoading}
                        transparent
                        opacity={0.8}
                    />
                </mesh>

                {/* Inner Solid Core */}
                <mesh scale={0.85}>
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.4} metalness={0.9} />
                </mesh>

                {/* Orbital Tech Ring */}
                <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
                    <torusGeometry args={[2.4, 0.015, 16, 100]} />
                    <meshBasicMaterial color="white" transparent opacity={isLoading ? 0.8 : 0.3} />
                </mesh>
                <mesh rotation={[-Math.PI / 2.5, 0, 0]}>
                    <torusGeometry args={[2.4, 0.015, 16, 100]} />
                    <meshBasicMaterial color={color} transparent opacity={isLoading ? 0.8 : 0.3} />
                </mesh>
            </Float>
        </group>
    );
}
export default function AIAssistant({ gender }: { gender: 'male' | 'female' }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([
        { role: 'ai', content: `Hello! I'm your ${gender === 'female' ? 'girl' : 'boy'} AI Assistant powered by Gemini. How can I help you study today?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            // Only try calling the real API if the project has an API key set
            if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        role: 'ai',
                        content: `You asked: "${userMessage}". Because you haven't set up the NEXT_PUBLIC_GEMINI_API_KEY in your frontend/.env.local file yet, I cannot connect to the real AI. Please add it so I can assist you properly!`
                    }]);
                    setIsLoading(false);
                }, 1000);
                return;
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(
                `You are a helpful, extremely concise, and encouraging ${gender === 'female' ? 'female' : 'male'} student study assistant for Exam Connect platform. Answer the student's question in 1 or 2 short paragraphs max: ${userMessage}`
            );
            const response = await result.response;
            const text = response.text();

            setMessages(prev => [...prev, { role: 'ai', content: text }]);
        } catch (error: any) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: `I'm having trouble connecting to my brain. Error Details: ${error?.message || 'Unknown network error. Is your API key correct in Netlify?'}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const themeColor = gender === 'female' ? 'rgba(236, 72, 153, 0.4)' : 'rgba(139, 92, 246, 0.4)';
    const glowColor = gender === 'female' ? '#ec4899' : '#8b5cf6';

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1, boxShadow: `0 0 20px ${glowColor}` }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: 30, right: 30, zIndex: 100, // Increased z-index
                    width: 65, height: 65, borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${themeColor}`,
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    cursor: 'pointer'
                }}
            >
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: "linear" }} style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: `2px dashed ${themeColor}`, opacity: 0.5 }} />
                <Sparkles size={28} color={gender === 'female' ? '#f472b6' : '#a78bfa'} />
            </motion.button>

            {/* AI Assistant Modal - Glassmorphic */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            position: 'fixed', bottom: 110, right: 30, zIndex: 100, // Increased z-index
                            width: 380, height: 650, borderRadius: 24,
                            background: 'rgba(15, 15, 25, 0.85)', // Stronger background to prevent canvas elements from overriding text readability
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px ${themeColor}`,
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.05), transparent)',
                            position: 'relative', zIndex: 20
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 12, height: 12, borderRadius: '50%',
                                    background: glowColor, boxShadow: `0 0 15px ${glowColor}`
                                }} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>3D Study AI</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* 3D Canvas Area */}
                        {/* Gave this a lower zIndex and placed it absolute so it acts as a true background without messing up chat flow */}
                        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, height: 280, zIndex: 1, pointerEvents: 'none' }}>

                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, background: glowColor, filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%', zIndex: -1 }} />

                            <Canvas camera={{ position: [0, 0, 7], fov: 45 }} style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
                                <ambientLight intensity={0.8} />
                                <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} castShadow color={glowColor} />
                                <Environment preset="city" />

                                <GlobeVisualizer gender={gender} isLoading={isLoading} />

                                <ContactShadows position={[0, -2.5, 0]} opacity={0.7} scale={15} blur={2.5} far={4} color={glowColor} />
                            </Canvas>

                            {/* Gradient fade to integrate canvas with chat area */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top, rgba(15,15,25,0.95), transparent)', zIndex: 3 }} />
                        </div>

                        {/* Spacer for absolute Canvas */}
                        <div style={{ height: 180, flexShrink: 0 }} />

                        {/* Chat History */}
                        <div ref={scrollRef} style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10, position: 'relative' }}>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '85%', padding: '12px 16px',
                                        borderRadius: 20,
                                        borderBottomRightRadius: m.role === 'user' ? 4 : 20,
                                        borderBottomLeftRadius: m.role === 'ai' ? 4 : 20,
                                        background: m.role === 'user'
                                            ? `linear-gradient(135deg, ${gender === 'female' ? '#f472b6, #db2777' : '#a78bfa, #7c3aed'})`
                                            : 'rgba(30,30,40,0.85)',
                                        border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                        boxShadow: m.role === 'user' ? `0 4px 15px ${themeColor}` : '0 4px 15px rgba(0,0,0,0.2)',
                                        color: 'white',
                                        fontSize: '0.95rem', lineHeight: 1.5,
                                        backdropFilter: 'blur(20px)'
                                    }}
                                >
                                    {m.content}
                                </motion.div>
                            ))}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{
                                        alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 20,
                                        background: 'rgba(30,30,40,0.85)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem'
                                    }}
                                >
                                    Thinking...
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,15,25,0.95)', zIndex: 10, position: 'relative' }}>
                            <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: '6px 6px 6px 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Message Study AI..."
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', color: 'white',
                                        outline: 'none', fontSize: '0.95rem'
                                    }}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading}
                                    style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        background: isLoading ? 'transparent' : glowColor,
                                        boxShadow: isLoading ? 'none' : `0 0 15px ${glowColor}`,
                                        color: 'white', border: isLoading ? '1px solid rgba(255,255,255,0.2)' : 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'transform 0.2s', opacity: isLoading ? 0.5 : 1
                                    }}
                                >
                                    <Send size={18} style={{ marginLeft: -2 }} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
