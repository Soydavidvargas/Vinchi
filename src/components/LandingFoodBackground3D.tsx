'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Float, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

type FoodItemKind =
  | 'burger'
  | 'pizza'
  | 'box'
  | 'cup'
  | 'donut'
  | 'bag'
  | 'taco'
  | 'bowl'
  | 'fries';

interface SharedProceduralGeos {
  pizzaBase: THREE.ExtrudeGeometry;
  pizzaCheese: THREE.ExtrudeGeometry;
  straw: THREE.TubeGeometry;
  bowl: THREE.LatheGeometry;
  tacoShell: THREE.ExtrudeGeometry;
}

function createSharedGeos(): SharedProceduralGeos {
  const createSliceShape = (w: number, len: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, -len * 0.52);
    shape.lineTo(w * 0.5, len * 0.45);
    shape.quadraticCurveTo(0, len * 0.58, -w * 0.5, len * 0.45);
    shape.closePath();
    return shape;
  };

  const pizzaBase = new THREE.ExtrudeGeometry(createSliceShape(1.15, 1.38), {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  pizzaBase.center();

  const pizzaCheese = new THREE.ExtrudeGeometry(createSliceShape(0.98, 1.18), {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  pizzaCheese.center();

  const strawCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.45, 0),
    new THREE.Vector3(0.02, 0.85, 0),
    new THREE.Vector3(0.24, 0.98, 0.05),
  ]);
  const straw = new THREE.TubeGeometry(strawCurve, 16, 0.036, 10, false);

  const bowlPoints = [
    new THREE.Vector2(0, -0.32),
    new THREE.Vector2(0.28, -0.32),
    new THREE.Vector2(0.42, -0.18),
    new THREE.Vector2(0.56, 0.06),
    new THREE.Vector2(0.62, 0.24),
    new THREE.Vector2(0.56, 0.24),
    new THREE.Vector2(0.49, 0.04),
    new THREE.Vector2(0.25, -0.24),
    new THREE.Vector2(0, -0.24),
  ];
  const bowl = new THREE.LatheGeometry(bowlPoints, 28);

  const tacoShape = new THREE.Shape();
  tacoShape.absarc(0, 0, 0.62, 0, Math.PI, false);
  tacoShape.lineTo(-0.54, 0);
  tacoShape.absarc(0, 0, 0.54, Math.PI, 0, true);
  tacoShape.closePath();

  const tacoShell = new THREE.ExtrudeGeometry(tacoShape, {
    depth: 0.46,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
  tacoShell.center();

  return { pizzaBase, pizzaCheese, straw, bowl, tacoShell };
}

function PurpleBurgerModel({ scale = 1 }: { scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2;
  });

  const sesamePositions: [number, number, number][] = [
    [-0.18, 0.45, 0.14],
    [0.16, 0.46, 0.12],
    [0, 0.48, -0.18],
    [-0.22, 0.42, -0.1],
    [0.2, 0.43, -0.08],
    [0.02, 0.49, 0.04],
  ];

  return (
    <group ref={ref} scale={scale} rotation={[0.28, 0.4, -0.12]}>
      <mesh position={[0, -0.26, 0]}>
        <cylinderGeometry args={[0.62, 0.56, 0.2, 24]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.45} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.65, 0.65, 0.17, 24]} />
        <meshStandardMaterial color="#2e1848" roughness={0.48} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[0, 0.42, 0]}>
        <boxGeometry args={[1.06, 0.06, 1.06]} />
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#7e22ce"
          emissiveIntensity={0.34}
          roughness={0.18}
          metalness={0.1}
          clearcoat={0.95}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.1, 10, 24]} />
        <meshStandardMaterial color="#fde68a" roughness={0.38} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.07, 20]} />
        <meshStandardMaterial color="#9c44dc" emissive="#442c61" emissiveIntensity={0.22} roughness={0.28} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.21, 0]}>
        <sphereGeometry args={[0.62, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#442c61"
          emissive="#2e1848"
          emissiveIntensity={0.22}
          roughness={0.34}
          metalness={0.18}
          clearcoat={0.55}
        />
      </mesh>
      {sesamePositions.map((pos, idx) => (
        <mesh key={idx} position={pos} rotation={[0.3, idx * 0.6, 0.2]}>
          <capsuleGeometry args={[0.026, 0.045, 4, 6]} />
          <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.22} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function PurplePizzaSliceModel({
  scale = 1,
  geos,
}: {
  scale?: number;
  geos: SharedProceduralGeos;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.18;
  });

  return (
    <group ref={ref} scale={scale} rotation={[-0.75, 0.3, 0.22]}>
      <mesh geometry={geos.pizzaBase}>
        <meshStandardMaterial color="#2e1848" roughness={0.48} metalness={0.14} />
      </mesh>
      <mesh geometry={geos.pizzaCheese} position={[0, -0.04, 0.075]}>
        <meshPhysicalMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.18}
          roughness={0.22}
          metalness={0.08}
          clearcoat={0.85}
        />
      </mesh>
      <mesh position={[0, 0.58, 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.105, 0.96, 6, 14]} />
        <meshStandardMaterial color="#442c61" roughness={0.42} metalness={0.16} />
      </mesh>
      {[
        [-0.14, 0.16],
        [0.18, 0.24],
        [0.02, -0.12],
      ].map(([x, y], idx) => (
        <mesh key={idx} position={[x, y, 0.115]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.135, 0.135, 0.038, 16]} />
          <meshPhysicalMaterial
            color={idx === 1 ? '#543b6c' : '#a855f7'}
            emissive="#7e22ce"
            emissiveIntensity={0.3}
            roughness={0.2}
            clearcoat={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function PurpleDeliveryBoxModel({ scale = 1 }: { scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.16;
    ref.current.rotation.x += delta * 0.04;
  });

  return (
    <group ref={ref} scale={scale} rotation={[0.32, -0.45, 0.1]}>
      <RoundedBox args={[1.08, 0.84, 1.08]} radius={0.08} smoothness={3}>
        <meshPhysicalMaterial
          color="#2e1848"
          emissive="#1e1033"
          emissiveIntensity={0.18}
          roughness={0.34}
          metalness={0.28}
          clearcoat={0.6}
        />
      </RoundedBox>
      <RoundedBox args={[1.15, 0.14, 1.15]} radius={0.05} smoothness={2} position={[0, 0.42, 0]}>
        <meshStandardMaterial color="#442c61" roughness={0.3} metalness={0.28} />
      </RoundedBox>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.19, 0.96, 1.18]} />
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#9c44dc"
          emissiveIntensity={0.38}
          roughness={0.16}
          metalness={0.35}
          clearcoat={0.95}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.18, 0.96, 0.19]} />
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#9c44dc"
          emissiveIntensity={0.38}
          roughness={0.16}
          metalness={0.35}
          clearcoat={0.95}
        />
      </mesh>
      <RoundedBox args={[0.42, 0.035, 0.3]} radius={0.01} position={[0.28, 0.5, 0.28]}>
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.22} roughness={0.28} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.24, 0.035]} radius={0.015} position={[0.24, -0.08, 0.55]}>
        <meshStandardMaterial color="#e9d5ff" emissive="#bc8ae1" emissiveIntensity={0.2} roughness={0.25} metalness={0.25} />
      </RoundedBox>
    </group>
  );
}

function PurpleDrinkCupModel({
  scale = 1,
  geos,
}: {
  scale?: number;
  geos: SharedProceduralGeos;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.22;
  });

  return (
    <group ref={ref} scale={scale} rotation={[0.2, 0.2, -0.18]}>
      <mesh>
        <cylinderGeometry args={[0.42, 0.29, 1.04, 22]} />
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#7e22ce"
          emissiveIntensity={0.26}
          roughness={0.18}
          metalness={0.15}
          clearcoat={0.95}
        />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.39, 0.34, 0.44, 22]} />
        <meshStandardMaterial color="#2e1848" roughness={0.44} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.09, 22]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.18} roughness={0.24} />
      </mesh>
      <mesh geometry={geos.straw}>
        <meshPhysicalMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.24}
          roughness={0.16}
          clearcoat={0.95}
        />
      </mesh>
    </group>
  );
}

function PurpleDonutModel({ scale = 1 }: { scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.24;
    ref.current.rotation.z += delta * 0.08;
  });

  const sprinkles: [number, number, number, number][] = [
    [0.44, 0.19, 0.12, 0.4],
    [-0.4, 0.2, 0.2, 1.2],
    [0.14, 0.2, -0.44, 2.1],
    [-0.18, 0.19, -0.4, 0.9],
    [0.36, 0.18, -0.28, 1.6],
    [-0.38, 0.19, -0.18, 2.5],
  ];

  return (
    <group ref={ref} scale={scale} rotation={[0.55, 0.3, 0.25]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.21, 14, 28]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.48} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.46, 0.188, 14, 28]} />
        <meshPhysicalMaterial
          color="#9c44dc"
          emissive="#6b21a8"
          emissiveIntensity={0.34}
          roughness={0.12}
          metalness={0.12}
          clearcoat={1}
        />
      </mesh>
      {sprinkles.map(([x, y, z, rot], idx) => (
        <mesh key={idx} position={[x, y, z]} rotation={[Math.PI / 2, 0, rot]}>
          <capsuleGeometry args={[0.026, 0.075, 4, 6]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#fde68a' : '#ffffff'}
            emissive={idx % 2 === 0 ? '#fbbf24' : '#e9d5ff'}
            emissiveIntensity={0.28}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function PurpleThermalBagModel({ scale = 1 }: { scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.18;
  });

  return (
    <group ref={ref} scale={scale} rotation={[0.24, 0.5, -0.1]}>
      <RoundedBox args={[0.96, 1.08, 0.78]} radius={0.14} smoothness={3}>
        <meshPhysicalMaterial
          color="#442c61"
          emissive="#2e1848"
          emissiveIntensity={0.2}
          roughness={0.36}
          metalness={0.24}
          clearcoat={0.55}
        />
      </RoundedBox>
      <RoundedBox args={[1.0, 0.24, 0.82]} radius={0.1} smoothness={3} position={[0, 0.44, 0.02]}>
        <meshStandardMaterial color="#2e1848" roughness={0.32} metalness={0.28} />
      </RoundedBox>
      <RoundedBox args={[0.76, 0.14, 0.05]} radius={0.02} position={[0, 0.08, 0.4]}>
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={0.48}
          roughness={0.2}
        />
      </RoundedBox>
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.22, 0.05, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.2} roughness={0.28} metalness={0.35} />
      </mesh>
    </group>
  );
}

function PurpleTacoModel({
  scale = 1,
  geos,
}: {
  scale?: number;
  geos: SharedProceduralGeos;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.21;
  });

  return (
    <group ref={ref} scale={scale} rotation={[0.25, -0.3, 0.2]}>
      <mesh geometry={geos.tacoShell} rotation={[Math.PI, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.14} roughness={0.45} metalness={0.06} />
      </mesh>
      {[-0.22, 0, 0.22].map((z, idx) => (
        <mesh key={idx} position={[0, 0.06, z]}>
          <dodecahedronGeometry args={[0.175, 0]} />
          <meshStandardMaterial color="#2e1848" roughness={0.44} metalness={0.16} />
        </mesh>
      ))}
      {[-0.18, 0.08, 0.24].map((z, idx) => (
        <mesh key={idx} position={[0.04, 0.24, z]} rotation={[0.2, idx, 0.4]}>
          <sphereGeometry args={[0.145, 10, 10]} />
          <meshStandardMaterial
            color={idx === 1 ? '#543b6c' : '#a855f7'}
            emissive="#7e22ce"
            emissiveIntensity={0.25}
            roughness={0.3}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.048, 0.56, 4, 8]} />
        <meshPhysicalMaterial
          color="#9c44dc"
          emissive="#7e22ce"
          emissiveIntensity={0.32}
          roughness={0.16}
          clearcoat={0.95}
        />
      </mesh>
    </group>
  );
}

function PurpleRamenBowlModel({
  scale = 1,
  geos,
}: {
  scale?: number;
  geos: SharedProceduralGeos;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.19;
  });

  return (
    <group ref={ref} scale={scale} rotation={[0.42, 0.2, -0.12]}>
      <mesh geometry={geos.bowl}>
        <meshPhysicalMaterial
          color="#2e1848"
          emissive="#1e1033"
          emissiveIntensity={0.2}
          roughness={0.24}
          metalness={0.22}
          clearcoat={0.9}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.51, 0.51, 0.04, 24]} />
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#7e22ce"
          emissiveIntensity={0.28}
          roughness={0.16}
          clearcoat={0.95}
        />
      </mesh>
      <mesh position={[-0.1, 0.16, 0.05]} rotation={[Math.PI / 2, 0, 0.3]}>
        <torusGeometry args={[0.16, 0.055, 8, 20]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.2} roughness={0.35} />
      </mesh>
      <mesh position={[0.18, 0.18, -0.08]}>
        <sphereGeometry args={[0.125, 14, 14]} />
        <meshPhysicalMaterial color="#9c44dc" emissive="#7e22ce" emissiveIntensity={0.3} roughness={0.18} clearcoat={0.9} />
      </mesh>
      <mesh position={[0.22, 0.32, 0.14]} rotation={[0.25, 0.15, -0.65]}>
        <cylinderGeometry args={[0.02, 0.013, 0.98, 8]} />
        <meshStandardMaterial color="#fde68a" roughness={0.28} />
      </mesh>
      <mesh position={[0.26, 0.34, 0.2]} rotation={[0.3, 0.2, -0.58]}>
        <cylinderGeometry args={[0.02, 0.013, 0.98, 8]} />
        <meshStandardMaterial color="#fde68a" roughness={0.28} />
      </mesh>
    </group>
  );
}

function PurpleFriesBoxModel({ scale = 1 }: { scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.21;
  });

  const fries: [number, number, number, number][] = [
    [-0.22, 0.34, 0.04, 0.18],
    [-0.11, 0.42, -0.05, 0.08],
    [0, 0.46, 0.03, 0],
    [0.11, 0.4, -0.04, -0.1],
    [0.22, 0.33, 0.05, -0.2],
    [-0.07, 0.38, 0.09, 0.04],
    [0.08, 0.37, 0.08, -0.06],
  ];

  return (
    <group ref={ref} scale={scale} rotation={[0.22, -0.25, 0.15]}>
      <RoundedBox args={[0.66, 0.68, 0.32]} radius={0.05} smoothness={3} position={[0, -0.12, 0]}>
        <meshPhysicalMaterial
          color="#2e1848"
          emissive="#1e1033"
          emissiveIntensity={0.2}
          roughness={0.34}
          metalness={0.24}
          clearcoat={0.55}
        />
      </RoundedBox>
      <RoundedBox args={[0.68, 0.19, 0.34]} radius={0.03} position={[0, -0.12, 0]}>
        <meshStandardMaterial
          color="#a855f7"
          emissive="#9c44dc"
          emissiveIntensity={0.35}
          roughness={0.22}
          metalness={0.28}
        />
      </RoundedBox>
      {fries.map(([x, y, z, rot], idx) => (
        <RoundedBox
          key={idx}
          args={[0.092, 0.56, 0.082]}
          radius={0.02}
          position={[x, y, z]}
          rotation={[0, 0, rot]}
        >
          <meshStandardMaterial
            color={idx % 2 === 0 ? '#fbbf24' : '#fde68a'}
            emissive="#f59e0b"
            emissiveIntensity={0.16}
            roughness={0.36}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

interface ScatteredSpec {
  id: string;
  kind: FoodItemKind;
  nx: number; // -1..+1 normalized horizontal spread across viewport
  y: number;  // vertical world coordinate
  z: number;  // depth (-1.2 foreground flank .. -6.5 deep background)
  scale: number;
  floatSpeed: number;
}

const SCATTERED_ITEMS: ScatteredSpec[] = [
  // Zona superior / Hero (dispersos izquierda, centro-fondo y derecha con mayor presencia)
  { id: 'h-burger-l', kind: 'burger', nx: -0.84, y: 2.25, z: -0.9, scale: 1.05, floatSpeed: 1.45 },
  { id: 'h-donut-cl', kind: 'donut', nx: -0.34, y: 2.7, z: -2.2, scale: 0.88, floatSpeed: 1.7 },
  { id: 'h-fries-c', kind: 'fries', nx: 0.12, y: 2.15, z: -2.5, scale: 0.86, floatSpeed: 1.35 },
  { id: 'h-pizza-cr', kind: 'pizza', nx: 0.52, y: 2.75, z: -1.8, scale: 0.94, floatSpeed: 1.5 },
  { id: 'h-cup-r', kind: 'cup', nx: 0.88, y: 2.2, z: -1.0, scale: 0.98, floatSpeed: 1.6 },
  { id: 'h-box-l', kind: 'box', nx: -0.88, y: -0.65, z: -1.0, scale: 1.02, floatSpeed: 1.35 },
  { id: 'h-taco-c', kind: 'taco', nx: -0.18, y: -1.45, z: -2.4, scale: 0.88, floatSpeed: 1.55 },
  { id: 'h-bowl-r', kind: 'bowl', nx: 0.84, y: -1.85, z: -1.4, scale: 0.96, floatSpeed: 1.45 },

  // Zona "¿Cómo Funciona?"
  { id: 'f-pizza-l', kind: 'pizza', nx: -0.78, y: -3.4, z: -1.1, scale: 1.0, floatSpeed: 1.4 },
  { id: 'f-bag-c', kind: 'bag', nx: 0.04, y: -4.2, z: -2.5, scale: 0.86, floatSpeed: 1.35 },
  { id: 'f-burger-r', kind: 'burger', nx: 0.86, y: -4.7, z: -0.95, scale: 1.04, floatSpeed: 1.5 },
  { id: 'f-donut-cl', kind: 'donut', nx: -0.42, y: -5.8, z: -2.1, scale: 0.88, floatSpeed: 1.65 },
  { id: 'f-cup-l', kind: 'cup', nx: -0.88, y: -6.7, z: -1.05, scale: 0.98, floatSpeed: 1.5 },
  { id: 'f-fries-cr', kind: 'fries', nx: 0.48, y: -6.9, z: -2.3, scale: 0.86, floatSpeed: 1.6 },
  { id: 'f-box-r', kind: 'box', nx: 0.86, y: -7.8, z: -1.1, scale: 1.0, floatSpeed: 1.35 },

  // Zona "Agentes"
  { id: 'a-taco-l', kind: 'taco', nx: -0.82, y: -9.3, z: -1.05, scale: 1.0, floatSpeed: 1.45 },
  { id: 'a-bowl-cl', kind: 'bowl', nx: -0.26, y: -10.1, z: -2.4, scale: 0.86, floatSpeed: 1.5 },
  { id: 'a-bag-r', kind: 'bag', nx: 0.88, y: -10.4, z: -0.95, scale: 1.02, floatSpeed: 1.35 },
  { id: 'a-pizza-cr', kind: 'pizza', nx: 0.36, y: -11.6, z: -2.2, scale: 0.88, floatSpeed: 1.6 },
  { id: 'a-burger-l', kind: 'burger', nx: -0.86, y: -12.2, z: -1.05, scale: 1.0, floatSpeed: 1.4 },

  // Zona "Planes" y Footer
  { id: 'p-donut-r', kind: 'donut', nx: 0.82, y: -13.7, z: -1.1, scale: 1.0, floatSpeed: 1.7 },
  { id: 'p-cup-cl', kind: 'cup', nx: -0.36, y: -14.5, z: -2.3, scale: 0.86, floatSpeed: 1.55 },
  { id: 'p-box-l', kind: 'box', nx: -0.84, y: -15.4, z: -0.95, scale: 1.04, floatSpeed: 1.3 },
  { id: 'p-fries-r', kind: 'fries', nx: 0.86, y: -16.1, z: -1.15, scale: 0.98, floatSpeed: 1.5 },
  { id: 'p-bowl-c', kind: 'bowl', nx: 0.16, y: -17.0, z: -2.4, scale: 0.86, floatSpeed: 1.4 },
  { id: 'p-bag-l', kind: 'bag', nx: -0.78, y: -18.2, z: -1.2, scale: 0.96, floatSpeed: 1.35 },
  { id: 'p-taco-r', kind: 'taco', nx: 0.8, y: -18.8, z: -1.2, scale: 0.96, floatSpeed: 1.5 },
];

function ParallaxFoodWorld({
  scrollYRef,
  pointerRef,
}: {
  scrollYRef: { current: number };
  pointerRef: { current: { x: number; y: number } };
}) {
  const worldRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const sharedGeos = useMemo(() => createSharedGeos(), []);

  useEffect(() => {
    return () => {
      sharedGeos.pizzaBase.dispose();
      sharedGeos.pizzaCheese.dispose();
      sharedGeos.straw.dispose();
      sharedGeos.bowl.dispose();
      sharedGeos.tacoShell.dispose();
    };
  }, [sharedGeos]);

  const isCompact = viewport.width < 8.5;
  const maxHalfSpan = isCompact ? viewport.width * 0.45 : Math.min(6.3, viewport.width * 0.47);
  const baseScale = isCompact ? 0.88 : 1.22;

  useFrame((_, delta) => {
    if (!worldRef.current) return;
    const scrollProgress = scrollYRef.current * 0.0022;
    const targetX = pointerRef.current.x * 0.28;
    const targetY = scrollProgress + pointerRef.current.y * 0.18;
    worldRef.current.position.x = THREE.MathUtils.damp(
      worldRef.current.position.x,
      targetX,
      3.5,
      delta
    );
    worldRef.current.position.y = THREE.MathUtils.damp(
      worldRef.current.position.y,
      targetY,
      4,
      delta
    );
    worldRef.current.rotation.y = THREE.MathUtils.damp(
      worldRef.current.rotation.y,
      pointerRef.current.x * 0.06,
      3.5,
      delta
    );
  });

  return (
    <group ref={worldRef}>
      {SCATTERED_ITEMS.map((item, idx) => {
        const x = item.nx * maxHalfSpan;
        const s = item.scale * baseScale;
        const showStudioOrbit = idx % 2 === 0;
        return (
          <group key={item.id} position={[x, item.y, item.z]}>
            <Float speed={item.floatSpeed * 0.72} rotationIntensity={0.22} floatIntensity={0.34}>
              {showStudioOrbit && (
                <mesh rotation={[Math.PI / 2.6, 0.35, 0]}>
                  <torusGeometry args={[0.92 * s, 0.014 * s, 8, 36]} />
                  <meshStandardMaterial
                    color={idx % 4 === 0 ? '#fde68a' : '#c084fc'}
                    emissive={idx % 4 === 0 ? '#f59e0b' : '#9c44dc'}
                    emissiveIntensity={0.45}
                    roughness={0.2}
                    metalness={0.5}
                  />
                </mesh>
              )}
              {item.kind === 'burger' && <PurpleBurgerModel scale={s} />}
              {item.kind === 'pizza' && <PurplePizzaSliceModel scale={s} geos={sharedGeos} />}
              {item.kind === 'box' && <PurpleDeliveryBoxModel scale={s} />}
              {item.kind === 'cup' && <PurpleDrinkCupModel scale={s} geos={sharedGeos} />}
              {item.kind === 'donut' && <PurpleDonutModel scale={s} />}
              {item.kind === 'bag' && <PurpleThermalBagModel scale={s} />}
              {item.kind === 'taco' && <PurpleTacoModel scale={s} geos={sharedGeos} />}
              {item.kind === 'bowl' && <PurpleRamenBowlModel scale={s} geos={sharedGeos} />}
              {item.kind === 'fries' && <PurpleFriesBoxModel scale={s} />}
            </Float>
          </group>
        );
      })}
    </group>
  );
}

export function LandingFoodBackground3D() {
  const scrollYRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => {
      scrollYRef.current = window.scrollY || 0;
    };
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8.4], fov: 44 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <fog attach="fog" args={['#f3e8ff', 22, 42]} />

        <ambientLight intensity={1.05} color="#ffffff" />
        <hemisphereLight args={['#faf5ff', '#6b21a8', 1.2]} />
        <directionalLight position={[6, 8, 7]} intensity={2.1} color="#ffffff" />
        <directionalLight position={[-6, -4, 5]} intensity={1.35} color="#c084fc" />
        <pointLight position={[0, 2, 4.5]} intensity={1.65} color="#fde68a" />

        <Environment resolution={128}>
          <Lightformer
            form="rect"
            intensity={2.8}
            color="#ffffff"
            scale={[10, 6, 1]}
            position={[0, 5, 4]}
            rotation={[Math.PI / 4, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#a855f7"
            scale={[6, 8, 1]}
            position={[-6, 0, 3]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <Lightformer
            form="rect"
            intensity={2.0}
            color="#fde68a"
            scale={[6, 8, 1]}
            position={[6, -1, 3]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        </Environment>

        <ParallaxFoodWorld scrollYRef={scrollYRef} pointerRef={pointerRef} />
      </Canvas>
    </div>
  );
}

export default LandingFoodBackground3D;
