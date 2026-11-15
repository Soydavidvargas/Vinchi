'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Float,
  Lightformer,
  RoundedBox,
} from '@react-three/drei';
import * as THREE from 'three';

const PHONE_WALLPAPER_SRC = '/assets/aistudio/Descarga_Ya_en_VINCHI_13cf0590.png';

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawDynamicIsland(ctx: CanvasRenderingContext2D, width: number) {
  ctx.fillStyle = '#0a0a0a';
  drawRoundedRectPath(ctx, width / 2 - 108, 44, 216, 46, 23);
  ctx.fill();
}

function paintFallbackGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#2a0944');
  grad.addColorStop(0.5, '#442c61');
  grad.addColorStop(1, '#1d0533');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  drawDynamicIsland(ctx, width);
}

function createVinchiWallpaperTexture(): {
  texture: THREE.CanvasTexture;
  disposeImage: () => void;
} {
  const width = 768;
  const height = 1612;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  paintFallbackGradient(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  let cancelled = false;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (cancelled) return;
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    drawDynamicIsland(ctx, width);
    texture.needsUpdate = true;
  };
  img.src = PHONE_WALLPAPER_SRC;

  return {
    texture,
    disposeImage: () => {
      cancelled = true;
      img.onload = null;
    },
  };
}

function createRoundedScreenGeometry(w: number, h: number, r: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const geo = new THREE.ShapeGeometry(shape, 16);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    uv.setXY(i, (px + w / 2) / w, (py + h / 2) / h);
  }
  uv.needsUpdate = true;
  return geo;
}

function Smartphone3DModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const fitScale = Math.min(1, viewport.width / 3.25, viewport.height / 5.55);

  const wallpaperResource = useMemo(() => createVinchiWallpaperTexture(), []);
  const screenGeometry = useMemo(() => createRoundedScreenGeometry(2.02, 4.24, 0.21), []);

  useEffect(() => {
    return () => {
      wallpaperResource.disposeImage();
      wallpaperResource.texture.dispose();
      screenGeometry.dispose();
    };
  }, [wallpaperResource, screenGeometry]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.16 - 0.15;
  });

  return (
    <group scale={fitScale}>
      <Float speed={1.4} rotationIntensity={0.04} floatIntensity={0.12}>
        <group ref={groupRef} rotation={[0.04, -0.15, 0]} position={[0, 0.1, 0]}>
        {/* 1. Primary Machined Metallic Chassis */}
        <RoundedBox args={[2.28, 4.54, 0.22]} radius={0.28} smoothness={6} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#442c61"
            metalness={0.58}
            roughness={0.26}
            clearcoat={0.85}
            clearcoatRoughness={0.12}
          />
        </RoundedBox>

        {/* 2. Front Obsidian Glass Bezel */}
        <RoundedBox args={[2.16, 4.42, 0.04]} radius={0.24} smoothness={5} position={[0, 0, 0.1]}>
          <meshPhysicalMaterial
            color="#171717"
            metalness={0.25}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        </RoundedBox>

        {/* 3. High-DPI OLED Screen Mesh with Vinchi Wallpaper */}
        <mesh geometry={screenGeometry} position={[0, 0, 0.123]}>
          <meshPhysicalMaterial
            map={wallpaperResource.texture}
            emissive="#ffffff"
            emissiveMap={wallpaperResource.texture}
            emissiveIntensity={0.32}
            roughness={0.16}
            metalness={0.02}
            clearcoat={0.9}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* 4. Side Hardware Buttons (Power + Volume) */}
        <RoundedBox args={[0.04, 0.56, 0.07]} radius={0.015} position={[1.15, 0.52, 0]}>
          <meshStandardMaterial color="#9c44dc" metalness={0.65} roughness={0.22} />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.36, 0.07]} radius={0.015} position={[-1.15, 0.78, 0]}>
          <meshStandardMaterial color="#9c44dc" metalness={0.65} roughness={0.22} />
        </RoundedBox>
        <RoundedBox args={[0.04, 0.36, 0.07]} radius={0.015} position={[-1.15, 0.3, 0]}>
          <meshStandardMaterial color="#9c44dc" metalness={0.65} roughness={0.22} />
        </RoundedBox>

        {/* 5. Rear Camera Plateau & Triple Optical Lenses */}
        <RoundedBox args={[0.92, 0.96, 0.08]} radius={0.16} smoothness={4} position={[0.48, 1.54, -0.14]}>
          <meshPhysicalMaterial
            color="#543b6c"
            metalness={0.6}
            roughness={0.2}
            clearcoat={0.9}
          />
        </RoundedBox>
        {[
          [0.26, 1.74],
          [0.26, 1.34],
          [0.68, 1.54],
        ].map(([x, y], idx) => (
          <group key={idx} position={[x, y, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.16, 0.16, 0.05, 32]} />
              <meshStandardMaterial color="#171717" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.03, 32]} />
              <meshPhysicalMaterial color="#bc8ae1" metalness={0.2} roughness={0.08} clearcoat={1} />
            </mesh>
          </group>
        ))}
        </group>
      </Float>
      <ContactShadows
        position={[0, -2.38, 0]}
        opacity={0.26}
        scale={6.2}
        blur={2.4}
        far={4}
        color="#442c61"
      />
    </group>
  );
}

export interface MobileShowcase3DProps {
  className?: string;
}

export function MobileShowcase3D({ className = '' }: MobileShowcase3DProps) {
  return (
    <div
      className={`pointer-events-none relative h-[440px] w-full touch-pan-y sm:h-[500px] lg:h-[560px] ${className}`}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 7.25], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.8} color="#ffffff" />
        <hemisphereLight args={['#ffffff', '#d0b7b0', 0.7]} />
        <directionalLight position={[5, 7, 5]} intensity={1.7} color="#ffffff" castShadow />
        <directionalLight position={[-5, 2, -4]} intensity={0.85} color="#bc8ae1" />

        {/* Procedural Studio Environment (Zero external HDR 404s) */}
        <Environment resolution={256}>
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#ffffff"
            scale={[10, 6, 1]}
            position={[0, 4, 4]}
            rotation={[Math.PI / 4, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.8}
            color="#bc8ae1"
            scale={[6, 8, 1]}
            position={[-5, 1, 3]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            color="#d0b7b0"
            scale={[6, 8, 1]}
            position={[5, -1, 3]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        </Environment>

        <Smartphone3DModel />
      </Canvas>
    </div>
  );
}

export default MobileShowcase3D;
