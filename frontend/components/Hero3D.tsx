'use client'

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Вращающийся пятиугольник
function RotatingPentagon() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });
  
  return (
    <mesh ref={meshRef} scale={1.5}>
      <cylinderGeometry args={[2, 2, 0.3, 5]} />
      <meshStandardMaterial 
        color="#8b5cf6" 
        emissive="#6d28d9"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// 3D Сцена
function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ec4899" />
      <RotatingPentagon />
    </>
  );
}

// Основной Hero компонент
export default function Hero3D() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
      {/* 3D Canvas */}
      <div className="absolute inset-0 opacity-70">
        <Suspense fallback={<div className="w-full h-full bg-transparent" />}>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 50 }}
            gl={{ 
              antialias: false,
              powerPreference: "low-power",
              alpha: true
            }}
            dpr={[1, 1.5]}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </div>
      
      {/* Контент Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in">
          NeymaryShop
        </h1>
        
        <p className="text-xl md:text-3xl text-gray-200 mb-8 max-w-3xl animate-slide-up">
          Пополнение игровых счетов и подписок<br />
          <span className="text-purple-400">через криптовалюту и карты РФ</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up-delay">
          <a 
            href="#catalog" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-2xl"
          >
            Смотреть каталог
          </a>
          
          <a 
            href="#how-it-works" 
            className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
          >
            Как это работает
          </a>
        </div>
        
        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>TON Network</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Карты РФ</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Моментально</span>
          </div>
        </div>
      </div>
      
      {/* Градиент снизу */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 1s ease-out 0.4s both;
        }
        
        .animate-slide-up-delay {
          animation: slide-up 1s ease-out 0.8s both;
        }
      `}</style>
    </div>
  );
}
