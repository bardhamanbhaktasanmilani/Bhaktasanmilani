"use client";

import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
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
const FALLBACK_IMAGE = "/About/temple-poster.jpg";
const TARGET_SIZE = 2.6;

/* =====================================================
   DRACO LOADER (FIX — REQUIRED)
===================================================== */






/* helper device checks */


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
              transition: "width 200ms linear",
              background: "#f59e0b",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 12,
            marginTop: 6,
            textAlign: "right",
          }}
        >
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

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,247,160,1)");
    g.addColorStop(0.25, "rgba(255,180,70,0.98)");
    g.addColorStop(0.5, "rgba(255,120,30,0.95)");
    g.addColorStop(0.85, "rgba(200,40,20,0.35)");
    g.addColorStop(1, "rgba(200,40,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [lowEnd]);
}

/* ---------- MODEL (FIXED — DRACO WIRED, NOTHING ELSE CHANGED) ---------- */
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
    const scene = gltf.scene as THREE.Object3D;
    sceneRef.current = scene;

    const marbleBias = new THREE.Color(0xf4efe6);
    scene.traverse((obj: any) => {
      if (obj?.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((mat: any) => {
          if (!mat) return;
          if (!mat.map && mat.color) {
            mat.color.lerp(marbleBias, strength * 0.7);
          }
        });
      }
    });
  }, [gltf, sceneRef, strength]);

  return gltf?.scene ? <primitive object={gltf.scene} /> : null;
}

/* ---------- Fit & center (UNCHANGED) ---------- */
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

/* ---------- Glow plane (UNCHANGED) ---------- */
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
        opacity={1}
      />
    </mesh>
  );
}

/* ---------- MAIN EXPORT (UNCHANGED UI / FEATURES) ---------- */
export default function TempleViewer({
  modelPath = DEFAULT_MODEL,
}: {
  modelPath?: string;
}) {
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const [glowPos, setGlowPos] = useState(
    new THREE.Vector3(0, 1, -3)
  );
  const [glowScale, setGlowScale] = useState(3.2);

 
  const lowEnd = detectLowEndDevice();
  const glowTex = useFieryGlowTexture(lowEnd);

  const dpr: [number, number] = lowEnd ? [1, 1] : [1, 1.4];



  return (
    <div
      className="relative w-full flex justify-center"
      style={{
        height: "min(75vh,820px)",
        background:
          "linear-gradient(180deg,#fff7ef 0%,#ffe6d6 30%,#ffd0bf 60%,#ffb79a 100%)",
      }}
    >
      <Canvas
        shadows={!lowEnd}
        dpr={dpr}
        camera={{ fov: 40 }}
        gl={{ powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#fff9f1"]} />

        <Suspense fallback={<ProgressOverlay />}>
          <hemisphereLight intensity={0.22} />
          <directionalLight
            castShadow={!lowEnd}
            position={[-6, 10, -6]}
            intensity={2}
          />

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

          <ContactShadows
            position={[0, -0.82, 0]}
            opacity={0.72}
            blur={lowEnd ? 2 : 4}
            far={1.5}
          />

          <OrbitControls
            enablePan={false}
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
