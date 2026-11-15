'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface MotoMeshProps {
  progressRef: RefObject<number>;
  directionRef: RefObject<1 | -1>;
  velocityRef: RefObject<number>;
}

function DeliveryMotorcycleModel({ progressRef, directionRef, velocityRef }: MotoMeshProps) {
  const motoRef = useRef<THREE.Group>(null);
  const frontWheelRef = useRef<THREE.Group>(null);
  const rearWheelRef = useRef<THREE.Group>(null);
  const prevProgressRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const currentProgress = progressRef.current ?? 0;
    const progressDelta = currentProgress - prevProgressRef.current;
    prevProgressRef.current = currentProgress;

    // Spin wheels proportionally to scroll travel + gentle idle spin when moving
    const wheelSpin = progressDelta * 38;
    if (frontWheelRef.current) {
      frontWheelRef.current.rotation.z -= wheelSpin;
    }
    if (rearWheelRef.current) {
      rearWheelRef.current.rotation.z -= wheelSpin;
    }

    if (motoRef.current) {
      const dir = directionRef.current ?? 1;
      // Rotate moto to face downward when descending, and upward when returning
      const targetRotZ = dir === 1 ? -Math.PI / 2 + 0.08 : Math.PI / 2 - 0.08;
      const targetRotY = dir === 1 ? 0.34 : -0.34;
      const targetRotX = dir === 1 ? 0.14 : -0.14;

      motoRef.current.rotation.z = THREE.MathUtils.damp(
        motoRef.current.rotation.z,
        targetRotZ,
        9,
        dt
      );
      motoRef.current.rotation.y = THREE.MathUtils.damp(
        motoRef.current.rotation.y,
        targetRotY,
        8,
        dt
      );
      motoRef.current.rotation.x = THREE.MathUtils.damp(
        motoRef.current.rotation.x,
        targetRotX,
        8,
        dt
      );

      // Subtle smooth suspension poise without harsh vibration
      const speedBoost = Math.min(0.6, Math.abs(velocityRef.current ?? 0) * 10);
      const bob = Math.sin(state.clock.elapsedTime * 2.2) * (0.008 + speedBoost * 0.01);
      motoRef.current.position.x = bob;
    }
  });

  const renderWheel = (x: number, ref: RefObject<THREE.Group | null>) => (
    <group ref={ref} position={[x, -0.46, 0]}>
      {/* Tire */}
      <mesh>
        <torusGeometry args={[0.31, 0.1, 14, 28]} />
        <meshStandardMaterial color="#171717" roughness={0.65} metalness={0.1} />
      </mesh>
      {/* Purple alloy rim */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.09, 18]} />
        <meshPhysicalMaterial color="#bc8ae1" metalness={0.7} roughness={0.22} clearcoat={0.8} />
      </mesh>
      {/* Cross spokes so rotation is clearly visible */}
      <mesh>
        <boxGeometry args={[0.38, 0.045, 0.11]} />
        <meshStandardMaterial color="#442c61" metalness={0.55} roughness={0.28} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.38, 0.045, 0.11]} />
        <meshStandardMaterial color="#442c61" metalness={0.55} roughness={0.28} />
      </mesh>
      {/* Hub cap */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.13, 12]} />
        <meshStandardMaterial color="#9c44dc" metalness={0.75} roughness={0.2} />
      </mesh>
    </group>
  );

  return (
    <group ref={motoRef} scale={0.94} rotation={[0.14, 0.34, -Math.PI / 2 + 0.08]}>
      {/* Rear & Front Wheels */}
      {renderWheel(-0.62, rearWheelRef)}
      {renderWheel(0.68, frontWheelRef)}

      {/* Main Lower Frame & Footboard */}
      <RoundedBox args={[1.15, 0.22, 0.38]} radius={0.08} smoothness={3} position={[0, -0.24, 0]}>
        <meshPhysicalMaterial color="#442c61" metalness={0.45} roughness={0.28} clearcoat={0.75} />
      </RoundedBox>

      {/* Rear Body Fairing */}
      <RoundedBox args={[0.72, 0.3, 0.4]} radius={0.1} smoothness={3} position={[-0.4, -0.04, 0]}>
        <meshPhysicalMaterial color="#543b6c" metalness={0.4} roughness={0.24} clearcoat={0.85} />
      </RoundedBox>

      {/* Ergonomic Seat */}
      <RoundedBox args={[0.62, 0.13, 0.34]} radius={0.06} smoothness={3} position={[-0.22, 0.16, 0]}>
        <meshStandardMaterial color="#171717" roughness={0.62} metalness={0.08} />
      </RoundedBox>

      {/* Front Apron / Shield */}
      <RoundedBox
        args={[0.28, 0.72, 0.36]}
        radius={0.09}
        smoothness={3}
        position={[0.42, 0.08, 0]}
        rotation={[0, 0, 0.24]}
      >
        <meshPhysicalMaterial color="#9c44dc" metalness={0.35} roughness={0.2} clearcoat={0.95} />
      </RoundedBox>

      {/* Front Telescopic Fork */}
      <mesh position={[0.58, -0.14, 0]} rotation={[0, 0, 0.26]}>
        <cylinderGeometry args={[0.045, 0.04, 0.72, 12]} />
        <meshStandardMaterial color="#d0b7b0" metalness={0.75} roughness={0.22} />
      </mesh>

      {/* Front Fender */}
      <mesh position={[0.68, -0.22, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.32, 0.07, 0.22]} />
        <meshStandardMaterial color="#442c61" metalness={0.45} roughness={0.3} />
      </mesh>

      {/* Handlebars & Grips */}
      <mesh position={[0.38, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.56, 12]} />
        <meshStandardMaterial color="#171717" metalness={0.65} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.16, 0.12, 0.2]} radius={0.04} position={[0.44, 0.42, 0]}>
        <meshStandardMaterial color="#442c61" metalness={0.5} roughness={0.25} />
      </RoundedBox>

      {/* Glowing LED Headlight */}
      <mesh position={[0.55, 0.34, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.085, 0.095, 0.07, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#bc8ae1"
          emissiveIntensity={1.6}
          roughness={0.1}
        />
      </mesh>

      {/* Rear Rack */}
      <RoundedBox args={[0.42, 0.05, 0.34]} radius={0.02} position={[-0.68, 0.14, 0]}>
        <meshStandardMaterial color="#d0b7b0" metalness={0.65} roughness={0.28} />
      </RoundedBox>

      {/* Vinchi Purple Thermal Delivery Box */}
      <group position={[-0.68, 0.42, 0]}>
        <RoundedBox args={[0.54, 0.48, 0.48]} radius={0.07} smoothness={3}>
          <meshPhysicalMaterial
            color="#9c44dc"
            metalness={0.25}
            roughness={0.24}
            clearcoat={0.85}
          />
        </RoundedBox>
        {/* Box lid */}
        <RoundedBox args={[0.57, 0.09, 0.51]} radius={0.04} position={[0, 0.22, 0]}>
          <meshStandardMaterial color="#442c61" metalness={0.4} roughness={0.25} />
        </RoundedBox>
        {/* Reflective orchid stripe */}
        <RoundedBox args={[0.42, 0.09, 0.5]} radius={0.02} position={[0, 0.02, 0]}>
          <meshStandardMaterial
            color="#bc8ae1"
            emissive="#bc8ae1"
            emissiveIntensity={0.35}
            roughness={0.2}
          />
        </RoundedBox>
      </group>

      {/* Exhaust Pipe */}
      <mesh position={[-0.52, -0.38, 0.22]} rotation={[0, 0, Math.PI / 2 - 0.12]}>
        <cylinderGeometry args={[0.045, 0.055, 0.56, 12]} />
        <meshStandardMaterial color="#d0b7b0" metalness={0.8} roughness={0.22} />
      </mesh>
    </group>
  );
}

export interface DeliveryMotoScroll3DProps {
  corridorRef: RefObject<HTMLDivElement | null>;
}

const MOTO_CONTAINER_HEIGHT = 112;

export function DeliveryMotoScroll3D({ corridorRef }: DeliveryMotoScroll3DProps) {
  const motoWrapperRef = useRef<HTMLDivElement>(null);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);
  const velocityRef = useRef(0);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let rafId = 0;

    const updateTargetFromDom = () => {
      const corridorEl = corridorRef.current;
      const motoEl = motoWrapperRef.current;
      if (!corridorEl || !motoEl) return;

      const rect = corridorEl.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const corridorHeight = corridorEl.offsetHeight;
      const maxTravelPx = Math.max(0, corridorHeight - MOTO_CONTAINER_HEIGHT + 10);

      // Start appearing as soon as top of "01. QR en Mesa" approaches upper-mid screen,
      // and reach bottom (touching "Nuestros Agentes" top border) when corridor bottom is in lower viewport.
      const startY = vh * 0.46;
      const endY = vh * 0.84;
      const scrollSpan = Math.max(120, corridorHeight - (endY - startY));
      const rawProgress = (startY - rect.top) / scrollSpan;
      const clampedProgress = Math.min(1, Math.max(0, rawProgress));
      targetProgressRef.current = clampedProgress;

      // Visibility fade: appears when entering block 01 from top, stays visible through Agentes boundary
      const fadeIn = Math.min(1, Math.max(0, (vh * 0.82 - rect.top) / (vh * 0.28)));
      const fadeOut = rect.bottom < vh * 0.12 ? Math.max(0, rect.bottom / (vh * 0.12)) : 1;
      const opacity = Math.min(fadeIn, fadeOut);

      // Smooth exponential chase for silky motion down and back up
      const prev = smoothProgressRef.current;
      const next = prev + (targetProgressRef.current - prev) * 0.18;
      smoothProgressRef.current = next;
      velocityRef.current = next - prev;

      const yPx = next * maxTravelPx;
      motoEl.style.transform = `translate3d(0, ${yPx.toFixed(1)}px, 0)`;
      motoEl.style.opacity = opacity.toFixed(3);
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
      className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-20 hidden w-[108px] -translate-x-1/2 lg:block"
    >
      {/* Guía vertical punteada hasta el borde superior de Agentes */}
      <div className="absolute top-6 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-[#bc8ae1]/55" />

      {/* Nodo de llegada justo en el marco de Agentes */}
      <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[#9c44dc] bg-[#ffffff]" />

      {/* Moto 3D que baja y sube con el scroll */}
      <div
        ref={motoWrapperRef}
        className="absolute top-0 left-0 h-[112px] w-[108px] will-change-transform"
        style={{ opacity: 0 }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.6], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.85} color="#ffffff" />
          <hemisphereLight args={['#ffffff', '#bc8ae1', 0.85]} />
          <directionalLight position={[4, 5, 5]} intensity={1.6} color="#ffffff" />
          <directionalLight position={[-4, -2, 3]} intensity={0.9} color="#bc8ae1" />

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
              intensity={1.5}
              color="#bc8ae1"
              scale={[6, 8, 1]}
              position={[-4, 0, 3]}
              rotation={[0, Math.PI / 2, 0]}
            />
          </Environment>

          <DeliveryMotorcycleModel
            progressRef={smoothProgressRef}
            directionRef={directionRef}
            velocityRef={velocityRef}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default DeliveryMotoScroll3D;
