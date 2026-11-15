'use client';

import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, OrbitControls, RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';

export interface Hero3DProps {
  /** Clases de posicionamiento Tailwind (por defecto: absolute inset-0 -z-10) */
  className?: string;
  /** Variante visual de la geometría central */
  geometryType?: 'icosahedron' | 'roundedBox';
}

function VinchiCoreMesh({ geometryType }: { geometryType: 'icosahedron' | 'roundedBox' }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const isCompact = viewport.width < 6.4;
  const targetPosition: [number, number, number] = isCompact
    ? [0, 1.3, -0.6]
    : [1.55, 0.08, 0];
  const targetScale = isCompact ? 0.72 : 1;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.24;
      groupRef.current.rotation.x += delta * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.3;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.45} floatIntensity={0.9}>
      <group ref={groupRef} position={targetPosition} scale={targetScale}>
        {geometryType === 'roundedBox' ? (
          <RoundedBox args={[1.9, 1.9, 1.9]} radius={0.28} smoothness={6}>
            <meshPhysicalMaterial
              color="#9c44dc"
              emissive="#442c61"
              emissiveIntensity={0.22}
              metalness={0.35}
              roughness={0.2}
              clearcoat={1}
              clearcoatRoughness={0.12}
            />
          </RoundedBox>
        ) : (
          <mesh>
            <icosahedronGeometry args={[1.45, 1]} />
            <meshPhysicalMaterial
              color="#9c44dc"
              emissive="#442c61"
              emissiveIntensity={0.2}
              metalness={0.32}
              roughness={0.2}
              clearcoat={1}
              clearcoatRoughness={0.12}
            />
          </mesh>
        )}

        <mesh ref={ringRef} rotation={[Math.PI / 3, 0.25, 0]}>
          <torusGeometry args={[2.25, 0.045, 24, 96]} />
          <meshStandardMaterial color="#bc8ae1" emissive="#9c44dc" emissiveIntensity={0.22} metalness={0.55} roughness={0.25} />
        </mesh>

        <mesh rotation={[-Math.PI / 4, -0.35, 0.2]}>
          <torusGeometry args={[2.65, 0.028, 16, 96]} />
          <meshStandardMaterial color="#442c61" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

export function Hero3D({
  className = 'absolute inset-0 -z-10',
  geometryType = 'icosahedron',
}: Hero3DProps) {
  return (
    <div className={`pointer-events-none touch-pan-y overflow-hidden bg-gradient-to-br from-[#ede4fb] via-[#f6f1fc] to-[#e9d5ff] ${className}`}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#ede4fb']} />
        <fog attach="fog" args={['#ede4fb', 8, 18]} />

        <ambientLight intensity={0.95} color="#faf5ff" />
        <directionalLight position={[5, 6, 5]} intensity={1.85} color="#ffffff" />
        <directionalLight position={[-5, -3, -4]} intensity={1.05} color="#fde68a" />
        <pointLight position={[2.5, 1.8, 3]} intensity={2.1} color="#a855f7" />

        <VinchiCoreMesh geometryType={geometryType} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate
          autoRotateSpeed={0.45}
        />
      </Canvas>
    </div>
  );
}

export default Hero3D;
