'use client';

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';

export type ShowcaseSceneKind = 'qr' | 'pos' | 'fleet' | 'agents' | 'dish';

export interface Showcase3DProps {
  scene: ShowcaseSceneKind;
  className?: string;
  transparent?: boolean;
}

function QrCubeAssembly() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });

  return (
    <Float speed={2} rotationIntensity={0.35} floatIntensity={0.75}>
      <group ref={ref}>
        <RoundedBox args={[2.1, 2.1, 0.28]} radius={0.14} smoothness={4}>
          <meshPhysicalMaterial
            color="#442c61"
            metalness={0.35}
            roughness={0.22}
            clearcoat={0.8}
          />
        </RoundedBox>
        {[-0.55, 0.55].map((x) =>
          [-0.55, 0.55].map((y) => (
            <RoundedBox
              key={`${x}-${y}`}
              args={[0.52, 0.52, 0.34]}
              radius={0.08}
              smoothness={3}
              position={[x, y, 0.04]}
            >
              <meshStandardMaterial color="#bc8ae1" metalness={0.3} roughness={0.25} />
            </RoundedBox>
          ))
        )}
        <RoundedBox args={[0.42, 0.42, 0.36]} radius={0.06} position={[0, 0, 0.06]}>
          <meshStandardMaterial color="#9c44dc" emissive="#543b6c" emissiveIntensity={0.3} />
        </RoundedBox>
      </group>
    </Float>
  );
}

function PosTerminalAssembly() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.35;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.7}>
      <group ref={ref} rotation={[0.25, -0.35, 0]}>
        <RoundedBox args={[2.3, 1.55, 0.22]} radius={0.12} smoothness={4} position={[0, 0.25, 0]}>
          <meshPhysicalMaterial
            color="#442c61"
            metalness={0.45}
            roughness={0.25}
            clearcoat={0.9}
          />
        </RoundedBox>
        <RoundedBox args={[2.0, 1.25, 0.06]} radius={0.06} position={[0, 0.25, 0.12]}>
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.2, 0.08]} radius={0.05} position={[0.45, -0.05, 0.15]}>
          <meshStandardMaterial color="#9c44dc" roughness={0.25} metalness={0.2} />
        </RoundedBox>
        <RoundedBox args={[1.1, 0.25, 0.9]} radius={0.08} position={[0, -0.75, -0.1]}>
          <meshStandardMaterial color="#543b6c" metalness={0.45} roughness={0.3} />
        </RoundedBox>
      </group>
    </Float>
  );
}

function FleetShieldAssembly() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35;
  });

  return (
    <Float speed={2.1} rotationIntensity={0.4} floatIntensity={0.85}>
      <group ref={ref}>
        <mesh>
          <torusKnotGeometry args={[0.95, 0.26, 96, 16]} />
          <meshPhysicalMaterial
            color="#9c44dc"
            emissive="#442c61"
            emissiveIntensity={0.2}
            metalness={0.45}
            roughness={0.18}
            clearcoat={1}
          />
        </mesh>
      </group>
    </Float>
  );
}

function AgentsNetworkAssembly() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x += delta * 0.05;
    }
  });

  const nodes: [number, number, number][] = [
    [-2.4, 0.8, -0.5],
    [2.3, -0.7, -0.4],
    [0, 1.3, -1.2],
    [-1.6, -1.1, 0.5],
    [1.8, 1.0, 0.4],
    [0, -0.2, 0.2],
  ];

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.6}>
      <group ref={ref}>
        {nodes.map((pos, idx) => (
          <mesh key={idx} position={pos}>
            <octahedronGeometry args={[idx === 5 ? 0.45 : 0.24, 0]} />
            <meshStandardMaterial
              color={idx === 5 ? '#9c44dc' : idx % 2 === 0 ? '#543b6c' : '#9c645c'}
              metalness={0.45}
              roughness={0.25}
            />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2.4, 0.3, 0]}>
          <torusGeometry args={[2.3, 0.018, 12, 80]} />
          <meshStandardMaterial color="#bc8ae1" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

function DishPlatterAssembly() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.35;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.28} floatIntensity={0.7}>
      <group ref={ref} rotation={[0.28, 0, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[1.55, 1.25, 0.18, 48]} />
          <meshPhysicalMaterial
            color="#d0b7b0"
            metalness={0.15}
            roughness={0.22}
            clearcoat={0.8}
          />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <dodecahedronGeometry args={[0.72, 0]} />
          <meshPhysicalMaterial
            color="#9c44dc"
            emissive="#442c61"
            emissiveIntensity={0.25}
            metalness={0.35}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>
      </group>
    </Float>
  );
}

function ResponsiveSceneGroup({ scene }: { scene: ShowcaseSceneKind }) {
  const { viewport } = useThree();
  const scale = viewport.width < 4.5 ? 0.82 : 1;

  return (
    <group scale={scale}>
      {scene === 'qr' && <QrCubeAssembly />}
      {scene === 'pos' && <PosTerminalAssembly />}
      {scene === 'fleet' && <FleetShieldAssembly />}
      {scene === 'agents' && <AgentsNetworkAssembly />}
      {scene === 'dish' && <DishPlatterAssembly />}
    </group>
  );
}

export function Showcase3D({ scene, className = '', transparent = false }: Showcase3DProps) {
  return (
    <div
      className={`relative h-full min-h-[260px] w-full touch-pan-y overflow-hidden sm:min-h-[320px] ${
        transparent
          ? 'bg-transparent'
          : 'rounded-[24px] border border-[#bc8ae1]/60 bg-[#faf5ff] shadow-[0_0_0_1px_rgba(156,68,220,0.12),0_4px_14px_-2px_rgba(68,44,97,0.12)]'
      } ${className}`}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.3, 5.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {!transparent && <color attach="background" args={['#faf5ff']} />}
        <ambientLight intensity={0.9} color="#ffffff" />
        <directionalLight position={[4, 5, 4]} intensity={1.7} color="#ffffff" />
        <directionalLight position={[-4, -3, -2]} intensity={0.85} color="#fde68a" />
        <pointLight position={[2, 2, 2.5]} intensity={1.25} color="#a855f7" />

        <ResponsiveSceneGroup scene={scene} />

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

export default Showcase3D;
