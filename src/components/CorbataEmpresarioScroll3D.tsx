'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface TieMeshProps {
  progressRef: RefObject<number>;
  directionRef: RefObject<1 | -1>;
  velocityRef: RefObject<number>;
}

function ExecutiveTieModel({ progressRef, directionRef, velocityRef }: TieMeshProps) {
  const tieRef = useRef<THREE.Group>(null);

  const knotGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, 0.14);
    shape.lineTo(0.18, 0.14);
    shape.lineTo(0.11, -0.14);
    shape.lineTo(-0.11, -0.14);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.11,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, []);

  const bladeGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.1, 0.45);
    shape.lineTo(0.1, 0.45);
    shape.lineTo(0.24, -0.42);
    shape.lineTo(0, -0.74);
    shape.lineTo(-0.24, -0.42);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, []);

  const collarLeftGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.4, 0.18);
    shape.lineTo(-0.08, 0.14);
    shape.lineTo(-0.2, -0.12);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    return geo;
  }, []);

  const collarRightGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.4, 0.18);
    shape.lineTo(0.08, 0.14);
    shape.lineTo(0.2, -0.12);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      knotGeometry.dispose();
      bladeGeometry.dispose();
      collarLeftGeometry.dispose();
      collarRightGeometry.dispose();
    };
  }, [knotGeometry, bladeGeometry, collarLeftGeometry, collarRightGeometry]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!tieRef.current) return;

    const progress = progressRef.current ?? 0;
    const dir = directionRef.current ?? 1;
    const speed = Math.min(0.45, Math.abs(velocityRef.current ?? 0) * 14);

    // Executive tilt and graceful silk turn as you scroll down/up
    const targetRotY = Math.sin(progress * Math.PI * 2.2) * 0.42 + (dir === 1 ? 0.25 : -0.25);
    const targetRotZ = Math.sin(state.clock.elapsedTime * 2.6) * (0.04 + speed * 0.12);
    const targetRotX = dir === 1 ? 0.1 : -0.1;

    tieRef.current.rotation.y = THREE.MathUtils.damp(tieRef.current.rotation.y, targetRotY, 7, dt);
    tieRef.current.rotation.z = THREE.MathUtils.damp(tieRef.current.rotation.z, targetRotZ, 7, dt);
    tieRef.current.rotation.x = THREE.MathUtils.damp(tieRef.current.rotation.x, targetRotX, 7, dt);
    tieRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.03;
  });

  return (
    <group ref={tieRef} scale={1.12} rotation={[0.1, 0.25, 0]}>
      {/* Crisp White Shirt Collar Wings */}
      <mesh geometry={collarLeftGeometry} position={[0, 0.56, -0.02]}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} metalness={0.04} clearcoat={0.25} />
      </mesh>
      <mesh geometry={collarRightGeometry} position={[0, 0.56, -0.02]}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.35} metalness={0.04} clearcoat={0.25} />
      </mesh>

      {/* Deep Plum Silk Windsor Knot */}
      <mesh geometry={knotGeometry} position={[0, 0.56, 0.03]}>
        <meshPhysicalMaterial
          color="#442c61"
          roughness={0.26}
          metalness={0.18}
          clearcoat={0.85}
          clearcoatRoughness={0.22}
        />
      </mesh>

      {/* Main Satin Purple Tie Blade */}
      <mesh geometry={bladeGeometry} position={[0, -0.08, 0]}>
        <meshPhysicalMaterial
          color="#9c44dc"
          roughness={0.22}
          metalness={0.22}
          clearcoat={0.9}
          clearcoatRoughness={0.18}
        />
      </mesh>

      {/* Executive Diagonal Silk Stripes */}
      <mesh position={[0.01, 0.12, 0.052]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.31, 0.042, 0.015]} />
        <meshStandardMaterial color="#bc8ae1" roughness={0.28} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.18, 0.052]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.37, 0.042, 0.015]} />
        <meshStandardMaterial color="#bc8ae1" roughness={0.28} metalness={0.25} />
      </mesh>
      <mesh position={[0, -0.34, 0.052]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.34, 0.022, 0.015]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} />
      </mesh>

      {/* Brushed Metallic Executive Tie Clip / Pisacorbatas */}
      <group position={[0.06, -0.02, 0.058]}>
        <RoundedBox args={[0.32, 0.055, 0.032]} radius={0.012}>
          <meshPhysicalMaterial
            color="#e7d6cf"
            metalness={0.88}
            roughness={0.18}
            clearcoat={0.7}
          />
        </RoundedBox>
        {/* Glowing Vinchi Gem Accent on Clip */}
        <mesh position={[-0.1, 0, 0.02]}>
          <octahedronGeometry args={[0.026, 0]} />
          <meshStandardMaterial
            color="#9c44dc"
            emissive="#bc8ae1"
            emissiveIntensity={0.8}
            roughness={0.15}
          />
        </mesh>
      </group>

      {/* Subtle Diamond Pin on Knot */}
      <mesh position={[0, 0.56, 0.11]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.065, 0.065, 0.02]} />
        <meshStandardMaterial
          color="#bc8ae1"
          emissive="#9c44dc"
          emissiveIntensity={0.55}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

export interface CorbataEmpresarioScroll3DProps {
  corridorRef: RefObject<HTMLDivElement | null>;
}

const TIE_CONTAINER_HEIGHT = 122;

export function CorbataEmpresarioScroll3D({ corridorRef }: CorbataEmpresarioScroll3DProps) {
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
      const maxTravelPx = Math.max(0, corridorHeight - TIE_CONTAINER_HEIGHT + 8);

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
      className="pointer-events-none absolute top-0 bottom-0 right-0 z-20 hidden w-[112px] lg:block"
    >
      {/* Guía ejecutiva vertical derecha */}
      <div className="absolute top-6 bottom-6 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-[#442c61]/35" />
      <div className="absolute top-6 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-[#442c61] bg-[#ffffff]" />
      <div className="absolute bottom-6 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#442c61]" />

      {/* Corbata 3D ejecutiva que acompaña el scroll */}
      <div
        ref={wrapperRef}
        className="absolute top-0 left-0 h-[122px] w-[112px] will-change-transform"
        style={{ opacity: 0 }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.2], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ pointerEvents: 'none' }}
        >
          <ambientLight intensity={0.9} color="#ffffff" />
          <hemisphereLight args={['#ffffff', '#bc8ae1', 0.85]} />
          <directionalLight position={[4, 5, 5]} intensity={1.7} color="#ffffff" />
          <directionalLight position={[-4, -2, 3]} intensity={0.9} color="#bc8ae1" />

          <Environment resolution={128}>
            <Lightformer
              form="rect"
              intensity={2.3}
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

          <ExecutiveTieModel
            progressRef={smoothProgressRef}
            directionRef={directionRef}
            velocityRef={velocityRef}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default CorbataEmpresarioScroll3D;
