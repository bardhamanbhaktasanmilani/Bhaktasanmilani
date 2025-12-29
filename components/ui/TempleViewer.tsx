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

/* -------- tunables -------- */
const DEFAULT_MODEL = "/About/temple-optimized.glb";
const FALLBACK_IMAGE = "/About/temple-low.glb";
const TARGET_SIZE = 2.6;

/* ---------- device detection ---------- */
function detectLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android/i.test(ua);
  const deviceMemory = (navigator as any).deviceMemory || 0;
  const cpuCount = (navigator as any).hardwareConcurrency || 4;
  return isMobile || (deviceMemory > 0 && deviceMemory < 2) || cpuCount < 3;
}

/* ---------- progress overlay ---------- */
function ProgressOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;

  return (
    <Html center>
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Loading 3D model
        </div>
        <div
          style={{
            width: 220,
            height: 8,
            background: "#eee",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.round(progress)}%`,
              height: "100%",
              background: "#f59e0b",
              transition: "width 200ms linear",
            }}
          />
        </div>
        <div style={{ fontSize: 12, marginTop: 6, textAlign: "right" }}>
          {Math.round(progress)}%
        </div>
      </div>
    </Html>
  );
}

/* ---------- glow texture ---------- */
function useFieryGlowTexture(lowEnd = false): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = lowEnd ? 512 : 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
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
    g.addColorStop(0, "rgba(255,247,160,1)");
    g.addColorStop(0.4, "rgba(255,160,60,0.9)");
    g.addColorStop(0.8, "rgba(200,40,20,0.3)");
    g.addColorStop(1, "rgba(200,40,20,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, [lowEnd]);
}

/* ---------- Temple Model ---------- */
function TempleModel({
  path,
  sceneRef,
  strength = 0.12,
}: {
  path: string;
  sceneRef: React.MutableRefObject<THREE.Object3D | null>;
  strength?: number;
}) {
  const gltf = useGLTF(path, true);

  useEffect(() => {
    if (!gltf?.scene) return;
    sceneRef.current = gltf.scene;

    const marbleBias = new THREE.Color(0xf4efe6);
    gltf.scene.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((mat: any) => {
          if (mat?.color && !mat.map) {
            mat.color.lerp(marbleBias, strength * 0.7);
          }
        });
      }
    });
  }, [gltf, sceneRef, strength]);

  return gltf?.scene ? <primitive object={gltf.scene} /> : null;
}

/* ---------- Fit & center ---------- */
function FitAndCenter({
  sceneRef,
  onComputed,
}: {
  sceneRef: React.MutableRefObject<THREE.Object3D | null>;
  onComputed: (v: { glowZ: number; modelScale: number }) => void;
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

    const dist = size.length() * 1.8;
    camera.position.set(dist, dist * 0.6, dist);
    camera.lookAt(0, 0, 0);

    onComputed({ glowZ: -dist * 1.2, modelScale: scale });
  }, []);

  return null;
}

/* ---------- Glow Plane ---------- */
function GlowPlane({
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
    <mesh
      ref={ref}
      position={[position.x, position.y, position.z]}
      scale={[scale, scale, 1]}
    >
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

/* ---------- MAIN EXPORT ---------- */
export default function TempleViewer({
  modelPath = DEFAULT_MODEL,
}: {
  modelPath?: string;
}) {
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  const [glowPos, setGlowPos] = useState(new THREE.Vector3(0, 1, -3));
  const [glowScale, setGlowScale] = useState(3.2);

  const lowEnd = detectLowEndDevice();
  const glowTex = useFieryGlowTexture(lowEnd);

  /* render only when visible */
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
        className="w-full flex justify-center items-center"
        style={{ height: "min(75vh,820px)" }}
      >
        <img
          src={FALLBACK_IMAGE}
          alt="Temple preview"
          className="max-h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full flex justify-center"
      style={{
        height: "min(75vh,820px)",
        background:
          "linear-gradient(180deg,#fff7ef 0%,#ffe6d6 30%,#ffd0bf 60%,#ffb79a 100%)",
      }}
    >
      <Canvas
        dpr={lowEnd ? 1 : 1.4}
        camera={{ fov: 40 }}
        shadows={!lowEnd}
        gl={{
          powerPreference: "low-power",
          antialias: !lowEnd,
          alpha: false,
        }}
      >
        <color attach="background" args={["#fff9f1"]} />

        <Suspense fallback={<ProgressOverlay />}>
          <hemisphereLight intensity={0.22} />
          <directionalLight position={[-6, 10, -6]} intensity={2} />

          <TempleModel path={modelPath} sceneRef={sceneRef} />

          <FitAndCenter
            sceneRef={sceneRef}
            onComputed={({ glowZ, modelScale }) => {
              setGlowPos(new THREE.Vector3(0, 0.9 * modelScale, glowZ));
              setGlowScale(Math.max(3, modelScale * 1.2));
            }}
          />

          <GlowPlane
            texture={glowTex}
            position={glowPos}
            scale={glowScale}
          />

          {!lowEnd && (
            <ContactShadows
              position={[0, -0.82, 0]}
              opacity={0.7}
              blur={4}
              far={1.5}
            />
          )}

          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.05}
            autoRotate
            autoRotateSpeed={0.55}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* preload */
useGLTF.preload(DEFAULT_MODEL);
