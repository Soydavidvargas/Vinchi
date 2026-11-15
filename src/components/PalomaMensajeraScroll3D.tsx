'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface PigeonMeshProps {
  progressRef: RefObject<number>;
  directionRef: RefObject<1 | -1>;
  velocityRef: RefObject<number>;
}

function MessengerPigeonModel({ progressRef, directionRef, velocityRef }: PigeonMeshProps) {
  const pigeonRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  const wingGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.32, 0.24, 0.72, 0.16);
    shape.quadraticCurveTo(0.88, 0.08, 0.82, -0.08);
    shape.quadraticCurveTo(0.54, -0.24, 0.22, -0.22);
    shape.quadraticCurveTo(0.06, -0.16, 0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    geo.center();
    return geo;
  }, []);

  const tailGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.12, 0);
    shape.lineTo(-0.46, 0.16);
    shape.quadraticCurveTo(-0.52, 0, -0.46, -0.16);
    shape.lineTo(-0.12, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      wingGeometry.dispose();
      tailGeometry.dispose();
    };
  }, [wingGeometry, tailGeometry]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const speedBoost = Math.min(0.9, Math.abs(velocityRef.current ?? 0) * 18);
    const flapSpeed = 3.8 + speedBoost * 4.2;
    const flapAngle = Math.sin(state.clock.elapsedTime * flapSpeed) * (0.36 + speedBoost * 0.14);

    if (leftWingRef.current) {
      leftWingRef.current.rotation.x = flapAngle;
      leftWingRef.current.rotation.z = 0.16 + flapAngle * 0.22;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.x = -flapAngle;
      rightWingRef.current.rotation.z = -0.16 - flapAngle * 0.22;
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(state.clock.elapsedTime * flapSpeed) * 0.05;
    }

    if (pigeonRef.current) {
      const dir = directionRef.current ?? 1;
      const scrollBank = Math.sin((progressRef.current ?? 0) * Math.PI * 2) * 0.1;
      // Face downward on scroll down, upward when scrolling back up
      const targetRotZ = dir === 1 ? -Math.PI / 2 + 0.18 : Math.PI / 2 - 0.18;
      const targetRotY = (dir === 1 ? 0.34 : -0.34) + scrollBank;
      const targetRotX = dir === 1 ? 0.12 : -0.12;

      pigeonRef.current.rotation.z = THREE.MathUtils.damp(
        pigeonRef.current.rotation.z,
        targetRotZ,
        7,
        dt
      );
      pigeonRef.current.rotation.y = THREE.MathUtils.damp(
        pigeonRef.current.rotation.y,
        targetRotY,
        6,
        dt
      );
      pigeonRef.current.rotation.x = THREE.MathUtils.damp(
        pigeonRef.current.rotation.x,
        targetRotX,
        6,
        dt
      );

      // Gentle calm poise
      pigeonRef.current.position.x = Math.sin(state.clock.elapsedTime * 2) * 0.025;
    }
  });

  return (
    <group ref={pigeonRef} scale={0.92} rotation={[0.14, 0.36, -Math.PI / 2 + 0.18]}>
      {/* Main Torso (Pearlescent White Dove Body) */}
      <mesh scale={[1.38, 0.92, 0.88]}>
        <sphereGeometry args={[0.38, 24, 20]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.25}
          metalness={0.05}
          clearcoat={0.55}
        />
      </mesh>

      {/* Soft Lavender Breast Plumage */}
      <mesh position={[0.24, 0.04, 0]} scale={[1.05, 0.95, 0.9]}>
        <sphereGeometry args={[0.24, 20, 16]} />
        <meshPhysicalMaterial color="#f2e8fb" roughness={0.32} metalness={0.05} />
      </mesh>

      {/* Neck & Head */}
      <mesh position={[0.45, 0.24, 0]}>
        <sphereGeometry args={[0.21, 20, 16]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.22} metalness={0.05} clearcoat={0.6} />
      </mesh>

      {/* Expressive Eyes */}
      <mesh position={[0.56, 0.3, 0.15]}>
        <sphereGeometry args={[0.036, 12, 12]} />
        <meshStandardMaterial color="#171717" roughness={0.15} metalness={0.3} />
      </mesh>
      <mesh position={[0.56, 0.3, -0.15]}>
        <sphereGeometry args={[0.036, 12, 12]} />
        <meshStandardMaterial color="#171717" roughness={0.15} metalness={0.3} />
      </mesh>

      {/* Golden-Terracotta Beak */}
      <mesh position={[0.7, 0.23, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.065, 0.18, 12]} />
        <meshStandardMaterial color="#9c645c" roughness={0.35} metalness={0.18} />
      </mesh>

      {/* Sealed Vinchi Order Envelope held under Beak / Courier Strap */}
      <group position={[0.72, 0.08, 0]} rotation={[0.15, 0.2, -0.2]}>
        <RoundedBox args={[0.24, 0.17, 0.04]} radius={0.015}>
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </RoundedBox>
        {/* Envelope purple wax seal */}
        <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
          <meshStandardMaterial
            color="#9c44dc"
            emissive="#9c44dc"
            emissiveIntensity={0.45}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Vinchi Courier Harness Collar */}
      <mesh position={[0.35, 0.12, 0]} rotation={[0, 0, 0.55]}>
        <torusGeometry args={[0.21, 0.028, 10, 24]} />
        <meshStandardMaterial color="#9c44dc" roughness={0.28} metalness={0.25} />
      </mesh>

      {/* Left Articulated Wing */}
      <group ref={leftWingRef} position={[0.05, 0.16, 0.22]} rotation={[0.25, -0.45, 0]}>
        <mesh
          geometry={wingGeometry}
          position={[0.15, 0.04, 0.24]}
          rotation={[Math.PI / 2 - 0.15, 0.3, 0.4]}
        >
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.26}
            metalness={0.05}
            clearcoat={0.5}
          />
        </mesh>
        {/* Orchid Wing Tip Accent */}
        <mesh position={[-0.08, 0.08, 0.55]} rotation={[Math.PI / 2, 0.2, 0.45]} scale={[0.55, 0.55, 0.7]}>
          <boxGeometry args={[0.42, 0.16, 0.04]} />
          <meshStandardMaterial color="#bc8ae1" roughness={0.35} />
        </mesh>
      </group>

      {/* Right Articulated Wing */}
      <group ref={rightWingRef} position={[0.05, 0.16, -0.22]} rotation={[-0.25, 0.45, 0]}>
        <mesh
          geometry={wingGeometry}
          position={[0.15, 0.04, -0.24]}
          rotation={[-Math.PI / 2 + 0.15, -0.3, 0.4]}
        >
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.26}
            metalness={0.05}
            clearcoat={0.5}
          />
        </mesh>
        <mesh position={[-0.08, 0.08, -0.55]} rotation={[-Math.PI / 2, -0.2, 0.45]} scale={[0.55, 0.55, 0.7]}>
          <boxGeometry args={[0.42, 0.16, 0.04]} />
          <meshStandardMaterial color="#bc8ae1" roughness={0.35} />
        </mesh>
      </group>

      {/* Fan-Shaped Tail Feathers */}
      <group ref={tailRef} position={[-0.36, -0.04, 0]} rotation={[0, 0, -0.2]}>
        <mesh geometry={tailGeometry} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial color="#bc8ae1" roughness={0.32} metalness={0.08} />
        </mesh>
      </group>
    </group>
  );
}

export interface PalomaMensajeraScroll3DProps {
  corridorRef: RefObject<HTMLDivElement | null>;
}

const PIGEON_CONTAINER_HEIGHT = 114;

export function PalomaMensajeraScroll3D({ corridorRef }: PalomaMensajeraScroll3DProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const velocityRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let rafId = 0;

    const updateTargetFromDom = () => {
      const corridorEl = corridorRef.current;
      const el = wrapperRef.current;
      if (!corridorEl || !el) return;

      const rect = corridorEl.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const corridorHeight = corridorEl.offsetHeight;
      const maxTravelPx = Math.max(0, corridorHeight - PIGEON_CONTAINER_HEIGHT + 8);

      const startY = vh * 0.48;
      const endY = vh * 0.85;
      const scrollSpan = Math.max(120, corridorHeight - (endY - startY));
      const rawProgress = (startY - rect.top) / scrollSpan;
      const clampedProgress = Math.min(1, Math.max(0, rawProgress));
      targetProgressRef.current = clampedProgress;

      const fadeIn = Math.min(1, Math.max(0, (vh * 0.84 - rect.top) / (vh * 0.25)));
      const fadeOut = rect.bottom < vh * 0.14 ? Math.max(0, rect.bottom / (vh * 0.14)) : 1;
      const opacity = Math.min(fadeIn, fadeOut);

      const prev = smoothProgressRef.current;
      const next = prev + (targetProgressRef.current - prev) * 0.18;
      smoothProgressRef.current = next;
      velocityRef.current = next - prev;

      const yPx = next * maxTravelPx;
      el.style.transform = `translate3d(0, ${yPx.toFixed(1)}px, 0)`;
      el.style.opacity = opacity.toFixed(3);
    };

    const onScroll = () => {
      const currentY = window.scrollY || 0;
      const diff = currentY - lastScrollYRef.current;
      if (Math.abs(diff) > 1.5) {
        directionRef.current = diff >= 0 ? 1 : -1;
      }
      lastScrollYRef.current = currentY;
    };

    const tick = () => {
      updateTargetFromDom();
      rafId = window.requestAnimationFrame(tick);
    };

    lastScrollYRef.current = window.scrollY || 0;
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateTargetFromDom, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateTargetFromDom);
    };
  }, [corridorRef]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 hidden w-[112px] lg:block"
    >
      {/* Ruta vertical izquierda de vuelo */}
      <div className="absolute top-6 bottom-6 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-[#9c44dc]/45" />
      <div className="absolute top-6 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[#9c44dc] bg-[#ffffff]" />
      <div className="absolute bottom-6 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#9c44dc]" />

      {/* Paloma mensajera 3D animada con el scroll */}
      <div
        ref={wrapperRef}
        className="absolute top-0 left-0 h-[114px] w-[112px] will-change-transform"
        style={{ opacity: 0 }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.45], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.95} color="#ffffff" />
          <hemisphereLight args={['#ffffff', '#bc8ae1', 0.9]} />
          <directionalLight position={[4, 5, 5]} intensity={1.65} color="#ffffff" />
          <directionalLight position={[-4, -2, 3]} intensity={0.85} color="#bc8ae1" />

          <Environment resolution={128}>
            <Lightformer
              form="rect"
              intensity={2.2}
              color="#ffffff"
              scale={[8, 6, 1]}
              position={[0, 4, 4]}
              rotation={[Math.PI / 4, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={1.6}
              color="#bc8ae1"
              scale={[6, 8, 1]}
              position={[-4, 0, 3]}
              rotation={[0, Math.PI / 2, 0]}
            />
          </Environment>

          <MessengerPigeonModel
            progressRef={smoothProgressRef}
            directionRef={directionRef}
            velocityRef={velocityRef}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default PalomaMensajeraScroll3D;
