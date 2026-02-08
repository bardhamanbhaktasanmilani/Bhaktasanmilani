"use client";

import React, {
  Suspense,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  ContactShadows,
  useProgress,
  Html,
} from "@react-three/drei";

/* ================= CONFIG ================= */
const DEFAULT_MODEL = "/About/temple-optimized.glb";
const TARGET_SIZE = 2.6;
const IOS_MAX_DPR = 1.2;

/* ================= DEVICE DETECTION ================= */
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function detectLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const mem = (navigator as any).deviceMemory ?? 0;
  const cpu = (navigator as any).hardwareConcurrency ?? 4;

  return isMobile || (mem && mem < 2) || cpu < 4;
}

/* ================= LOADER ================= */
function ProgressOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;

  return (
    <Html center>
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          background: "#fff",
          boxShadow: "0 6px 18px rgba(0,0,0,.15)",
        }}
      >
        <div style={{ fontWeight: 600 }}>Loading temple</div>
        <div
          style={{
            width: 220,
            height: 8,
            background: "#eee",
            marginTop: 8,
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#f59e0b",
            }}
          />
        </div>
      </div>
    </Html>
  );
}

/* ================= SUN GLOW TEXTURE ================= */
function useSunGlowTexture(lowEnd: boolean) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;

    const size = lowEnd ? 384 : 768; // iOS memory safe
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    g.addColorStop(0, "rgba(255,240,180,1)");
    g.addColorStop(0.45, "rgba(255,180,80,0.75)");
    g.addColorStop(0.85, "rgba(255,120,40,0.25)");
    g.addColorStop(1, "rgba(255,120,40,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    return tex;
  }, [lowEnd]);
}

/* ================= TEMPLE MODEL ================= */
function TempleModel({
  path,
  sceneRef,
  lowEnd,
}: {
  path: string;
  sceneRef: React.MutableRefObject<THREE.Object3D | null>;
  lowEnd: boolean;
}) {
  const gltf = useGLTF(path);

  useEffect(() => {
    if (!gltf?.scene) return;

    sceneRef.current = gltf.scene;
    const marbleWhite = new THREE.Color("#f8f6f2");

    gltf.scene.traverse((obj: any) => {
      if (!obj.isMesh) return;

      obj.castShadow = !lowEnd;
      obj.receiveShadow = !lowEnd;

      const mat = new THREE.MeshPhysicalMaterial({
        map: obj.material?.map ?? null,
        color: marbleWhite,
        roughness: lowEnd ? 0.32 : 0.18,
        metalness: 0.04,
        clearcoat: lowEnd ? 0 : 0.25,
        clearcoatRoughness: 0.25,
        reflectivity: lowEnd ? 0.15 : 0.4,
      });

      obj.material = mat;
    });
  }, [gltf, sceneRef, lowEnd]);

  return <primitive object={gltf.scene} />;
}

/* ================= FIT & CAMERA ================= */
function FitAndCenter({
  sceneRef,
  onDone,
}: {
  sceneRef: React.MutableRefObject<THREE.Object3D | null>;
  onDone: (d: { sunZ: number; scale: number }) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!sceneRef.current) return;

    const box = new THREE.Box3().setFromObject(sceneRef.current);
    const size = box.getSize(new THREE.Vector3());
    const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z);

    sceneRef.current.scale.setScalar(scale);
    box.setFromObject(sceneRef.current);

    const center = box.getCenter(new THREE.Vector3());
    sceneRef.current.position.sub(center);

    const dist = size.length() * 1.9;
    camera.position.set(dist, dist * 0.55, dist);
    camera.lookAt(0, 0, 0);

    onDone({ sunZ: -dist * 1.2, scale });
  }, []);

  return null;
}

/* ================= SUN GLOW ================= */
function SunGlow({
  texture,
  position,
  scale,
}: {
  texture: THREE.Texture | null;
  position: THREE.Vector3;
  scale: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame(() => ref.current?.lookAt(camera.position));
  if (!texture) return null;

  return (
    <mesh ref={ref} position={position} scale={[scale, scale, 1]}>
      <planeGeometry />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ================= MAIN VIEWER ================= */
export default function TempleViewer({
  modelPath = DEFAULT_MODEL,
}: {
  modelPath?: string;
}) {
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const isIOS = detectIOS();
  const lowEnd = detectLowEndDevice() || isIOS;

  const [sunPos, setSunPos] = useState(new THREE.Vector3(0, 1, -4));
  const [sunScale, setSunScale] = useState(3);

  const glowTex = useSunGlowTexture(lowEnd);

  /* Lazy mount for Safari memory safety */
  useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: "200px" }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  if (!visible) {
    return (
      <div
        ref={containerRef}
        style={{
          height: "min(75dvh,820px)",
          background: "linear-gradient(180deg,#fff7ef,#ffd6b5)",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: "min(75dvh,820px)",
        background: "linear-gradient(180deg,#fff7ef,#ffd6b5)",
        overflow: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <Canvas
        dpr={lowEnd ? 1 : Math.min(window.devicePixelRatio, IOS_MAX_DPR)}
        shadows={!lowEnd}
        camera={{ fov: 38 }}
        gl={{
          powerPreference: "low-power",
          antialias: !lowEnd,
          alpha: true,
        }}
      >
        <Suspense fallback={<ProgressOverlay />}>
          <ambientLight intensity={0.18} />

          <directionalLight
            position={[0, 8, -12]}
            intensity={lowEnd ? 1.6 : 2.8}
            color="#ffd9a3"
            castShadow={!lowEnd}
          />

          <directionalLight position={[6, 3, 6]} intensity={0.35} />

          <TempleModel
            path={modelPath}
            sceneRef={sceneRef}
            lowEnd={lowEnd}
          />

          <FitAndCenter
            sceneRef={sceneRef}
            onDone={({ sunZ, scale }) => {
              setSunPos(new THREE.Vector3(0, scale * 0.9, sunZ));
              setSunScale(Math.max(3, scale * 1.3));
            }}
          />

          {!lowEnd && (
            <SunGlow
              texture={glowTex}
              position={sunPos}
              scale={sunScale}
            />
          )}

          {!lowEnd && (
            <ContactShadows
              position={[0, -0.8, 0]}
              opacity={0.6}
              blur={4}
              far={1.5}
            />
          )}

         <OrbitControls
  enablePan={false}
  enableZoom
  minDistance={2.5}
  maxDistance={8}
  enableDamping
  dampingFactor={0.06}
  autoRotate
  autoRotateSpeed={0.45}
/>

        </Suspense>
      </Canvas>
    </div>
  );
}

/* preload */
useGLTF.preload(DEFAULT_MODEL);
