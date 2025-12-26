// components/ui/TempleViewer.tsx
"use client";

import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";

/**
 * TempleViewer — cleaned, day-only version.
 *
 * Changes made:
 * - Removed night mode, toggle UI and all night-only extras (moon, starfield).
 * - Kept loader, glow plane, contact shadows, orbit controls, and fit/center behavior.
 * - Ensured temple bias color is warm off-white (marble-like).
 * - Set a moderate target size for fitting the model (medium size).
 * - Commented out the aggressive "increase size" line; replaced with a mild/default glow scale.
 *
 * Keep any further stylistic or behavioral changes minimal to preserve original UX.
 */

/* ---------------------- TUNABLE CONSTANTS ---------------------- */
const LIGHTEN_STRENGTH = 0.12;
const SHADOW_MAP_SIZE = 2048;
const SHADOW_CAM_SIZE = 14;
const KEY_LIGHT_INTENSITY = 2.0;
const HEMI_INTENSITY = 0.22;
const RIM_INTENSITY = 0.6;

function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      (window as any).WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function OverlayLoader({ text = "Loading model…" }: { text?: string }) {
  return (
    <div
      aria-hidden={false}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 16px",
          borderRadius: 12,
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          backdropFilter: "blur(6px)",
        }}
      >
        <svg viewBox="0 0 50 50" style={{ width: 36, height: 36 }}>
          <defs>
            <linearGradient id="tv-g2" x1="1" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
          </defs>
          <circle cx="25" cy="25" r="18" stroke="rgba(0,0,0,0.08)" strokeWidth="6" fill="none" />
          <circle
            cx="25"
            cy="25"
            r="18"
            stroke="url(#tv-g2)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="90"
            strokeDashoffset="60"
            fill="none"
            style={{ transformOrigin: "50% 50%", animation: "spin 1s linear infinite" }}
          />
        </svg>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{text}</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

function useFieryGlowTexture(): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    try {
      const size = 1024;
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
      g.addColorStop(0.2, "rgba(255,200,90,0.98)");
      g.addColorStop(0.45, "rgba(255,140,40,0.95)");
      g.addColorStop(0.75, "rgba(220,40,20,0.4)");
      g.addColorStop(1, "rgba(220,40,20,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 600; i++) {
        const a = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 1.6) * r;
        const x = cx + Math.cos(a) * rad;
        const y = cy + Math.sin(a) * rad;
        const alpha = Math.random() * 0.05;
        ctx.fillStyle = `rgba(255,${Math.floor(120 - Math.random() * 60)},${Math.floor(50 - Math.random() * 30)},${alpha})`;
        ctx.fillRect(x, y, 1, 1);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      const SRGB = (THREE as any).SRGBColorSpace ?? (THREE as any).sRGBEncoding ?? undefined;
      if (SRGB !== undefined) {
        if ((tex as any).colorSpace !== undefined) (tex as any).colorSpace = SRGB;
        else (tex as any).encoding = SRGB;
      }
      tex.needsUpdate = true;
      return tex;
    } catch {
      return null;
    }
  }, []);
}

function TempleModel({ path, sceneRef, onReady, strength = LIGHTEN_STRENGTH }: { path: string; sceneRef: React.MutableRefObject<THREE.Object3D | null>; onReady?: () => void; strength?: number; }) {
  const gltf: any = useGLTF(path);
  const signaledRef = useRef(false);

  useEffect(() => {
    if (!gltf || !gltf.scene) return;
    const scene = gltf.scene as THREE.Object3D;
    sceneRef.current = scene;

    try {
      // warm off-white marble bias
      const marbleBias = new THREE.Color(0xf4efe6);

      scene.traverse((obj: any) => {
        if (!obj) return;
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;

          const mats = Array.isArray(obj.material) ? obj.material.slice() : [obj.material];
          const newMats = mats.map((m: any) => {
            if (!m) return m;
            try {
              const clone = m.clone ? m.clone() : Object.assign(Object.create(Object.getPrototypeOf(m)), m);
              return clone;
            } catch {
              return m;
            }
          });

          obj.material = Array.isArray(obj.material) ? newMats : newMats[0];

          newMats.forEach((mat: any) => {
            if (!mat) return;
            try {
              const hasMap = !!mat.map;

              if (!hasMap && mat.color) {
                // gently bias color toward marbleBias
                if (typeof mat.color.lerp === "function") {
                  mat.color.lerp(marbleBias, Math.min(1, strength * 0.7));
                } else {
                  mat.color = marbleBias.clone();
                }
              }

              if (mat.emissive) {
                if (typeof mat.emissive.lerp === "function") mat.emissive.lerp(new THREE.Color(0x000000), 1 - Math.min(0.9, strength * 2));
                mat.emissiveIntensity = Math.max(0.001, Math.min(0.35, (mat.emissiveIntensity || 0.0) * 0.18 + strength * 0.02));
              }

              if (typeof mat.roughness === "number") {
                mat.roughness = Math.max(0.06, Math.min(1, (mat.roughness as number) - strength * 0.2));
              }

              if (typeof mat.metalness === "number") {
                mat.metalness = Math.max(0, (mat.metalness as number) - strength * 0.18);
              }

              if (typeof mat.envMapIntensity === "number") {
                mat.envMapIntensity = Math.min(6, (mat.envMapIntensity || 1) * (1 + strength * 0.3));
              }

              mat.needsUpdate = true;
            } catch (e) {
              // ignore per-material failures
            }
          });
        }
      });
    } catch (err) {
      // safe fallback
    }

    if (onReady && !signaledRef.current) {
      Promise.resolve().then(() => {
        signaledRef.current = true;
        onReady();
      });
    }
  }, [gltf, sceneRef, onReady, strength]);

  return gltf?.scene ? <primitive object={gltf.scene} /> : null;
}

function FitAndCenter({ sceneRef, onComputed, targetSize = 2.6 }: { sceneRef: React.MutableRefObject<THREE.Object3D | null>; onComputed: (v: { glowZ: number; modelScale: number; center: THREE.Vector3 }) => void; targetSize?: number; }) {
  const { camera } = useThree();

  useEffect(() => {
    const obj = sceneRef.current;
    if (!obj) return;

    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
    const scale = targetSize / maxDim;
    obj.scale.setScalar(scale);

    // re-center
    const sbox = new THREE.Box3().setFromObject(obj);
    const scenter = sbox.getCenter(new THREE.Vector3());
    obj.position.x += -scenter.x;
    obj.position.y += -scenter.y;
    obj.position.z += -scenter.z;

    const finalBox = new THREE.Box3().setFromObject(obj);
    const finalSize = finalBox.getSize(new THREE.Vector3());
    const finalCenter = finalBox.getCenter(new THREE.Vector3());

    if (camera && camera instanceof THREE.PerspectiveCamera) {
      const perspective = camera as THREE.PerspectiveCamera;
      const fov = (perspective.fov * Math.PI) / 180;
      const cameraDistance = Math.abs(Math.max(finalSize.x, finalSize.y, finalSize.z) / (2 * Math.tan(fov / 2))) * 1.8;
      perspective.position.set(cameraDistance * 0.9, cameraDistance * 0.6, cameraDistance * 0.9);
      perspective.near = 0.01;
      perspective.far = Math.max(1000, cameraDistance * 10);
      perspective.updateProjectionMatrix();

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const glowDir = camDir.clone().negate();
      const padding = Math.max(finalSize.z * 0.7, 0.8);
      const glowDistance = Math.max(finalSize.length(), targetSize) * 1.6 + padding;
      const glowPos = glowDir.clone().multiplyScalar(glowDistance);

      onComputed({ glowZ: glowPos.z, modelScale: scale, center: finalCenter });
    } else {
      const glowPos = new THREE.Vector3(0, 0, -Math.max(finalSize.length(), targetSize) * 1.6 - 0.8);
      onComputed({ glowZ: glowPos.z, modelScale: scale, center: finalCenter });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneRef.current]);

  return null;
}

function GlowPlane({ texture, position, scale = 3, visible = true }: { texture: THREE.Texture | null; position: THREE.Vector3; scale?: number | [number, number, number]; visible?: boolean; }) {
  const ref = useRef<THREE.Mesh | null>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.lookAt(camera.position.x, camera.position.y, camera.position.z);
  });
  if (!texture) return null;
  const posArr = [position.x, position.y, position.z] as [number, number, number];
  return (
    <mesh ref={ref} position={posArr} scale={Array.isArray(scale) ? (scale as [number, number, number]) : [scale, scale, 1]} renderOrder={0} visible={visible}>
      <planeGeometry args={[1.0, 1.0, 1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} depthTest blending={THREE.AdditiveBlending} toneMapped={false} opacity={1.0} />
    </mesh>
  );
}

export default function TempleViewer({ modelPath = "/About/temple.glb" }: { modelPath?: string }) {
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const [glowPos, setGlowPos] = useState(new THREE.Vector3(0, 1.0, -3));
  const [glowScale, setGlowScale] = useState<number>(3.2);
  const glowTex = useFieryGlowTexture();
  const [isLoaded, setIsLoaded] = useState(false);
  const [canRenderWebGL, setCanRenderWebGL] = useState<boolean>(() => isWebGLAvailable());
  useEffect(() => {
    if (typeof window !== "undefined") setCanRenderWebGL(isWebGLAvailable());
  }, []);

  const containerBg = "linear-gradient(180deg, #fff7ef 0%, #ffe6d6 30%, #ffd0bf 60%, #ffb79a 100%)";
  const canvasBg = "#fff9f1";

  if (!canRenderWebGL) {
    return (
      <div className="w-full min-w-0 flex justify-center items-center relative rounded-2xl" style={{ background: containerBg, height: "min(60vh, 680px)", minHeight: 360 }}>
        <div className="text-center max-w-xl p-6">
          <h3 className="mb-2 text-xl font-bold text-gray-900">3D preview unavailable</h3>
          <p className="text-sm text-gray-700">Your device or browser does not support WebGL. You can still view images and information on this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex justify-center items-center relative" style={{ background: containerBg, height: "min(75vh, 820px)", minHeight: 480 }}>
      <Canvas
        shadows={true}
        dpr={[1, 1.4]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", maxWidth: 1200 }}
        camera={{ position: [3.0, 2.6, 4.2], fov: 40 }}
        onCreated={({ gl }) => {
          try {
            (gl as any).physicallyCorrectLights = true;
            if ((gl as any).outputEncoding !== undefined) (gl as any).outputEncoding = (THREE as any).sRGBEncoding ?? (THREE as any).SRGBColorSpace ?? (gl as any).outputEncoding;
            if ((gl as any).shadowMap) {
              (gl as any).shadowMap.enabled = true;
              (gl as any).shadowMap.type = (THREE as any).PCFSoftShadowMap ?? (THREE as any).PCFShadowMap ?? (gl as any).shadowMap.type;
            }
          } catch (err) {
            // ignore renderer config failures
          }
        }}
      >
        <color attach="background" args={[canvasBg]} />

        <Suspense fallback={null}>
          {/* Hemisphere: subtle sky-to-ground ambient */}
          <hemisphereLight args={[0xfffffb, 0x3a3426, HEMI_INTENSITY]} />

          {/* Primary key light (sun) — placed BEHIND the temple relative to the camera so
              temple front gets rim & backlit separation. */}
          <directionalLight
            castShadow
            color={"#fff7ea"}
            intensity={KEY_LIGHT_INTENSITY}
            position={[-6, 10, -6]}
            shadow-mapSize-width={SHADOW_MAP_SIZE}
            shadow-mapSize-height={SHADOW_MAP_SIZE}
            shadow-bias={-0.0005}
            shadow-camera-near={0.5}
            shadow-camera-far={80}
            shadow-camera-left={-SHADOW_CAM_SIZE}
            shadow-camera-right={SHADOW_CAM_SIZE}
            shadow-camera-top={SHADOW_CAM_SIZE}
            shadow-camera-bottom={-SHADOW_CAM_SIZE}
          />

          {/* Subtle fill to reveal recesses */}
          <pointLight color={"#ffd9a8"} intensity={1.1} position={[0, 1.6, -2.5]} distance={12} decay={2} />

          {/* Rim/back light to accent edges */}
          <directionalLight color={0xfff3e8} intensity={RIM_INTENSITY} position={[6, 4, 6]} />

          {/* Low ambient so that the directional light creates contrast */}
          <ambientLight intensity={0.04} />

          <TempleModel path={modelPath} sceneRef={sceneRef} onReady={() => setIsLoaded(true)} strength={LIGHTEN_STRENGTH} />

          {/* Fit and center with a moderate/medium targetSize -> ensures "not too big / not too small" */}
          <FitAndCenter sceneRef={sceneRef} targetSize={2.6} onComputed={({ glowZ, modelScale }) => {
            setGlowPos(new THREE.Vector3(0, 0.9 * modelScale, glowZ));

            // Previously this line multiplied the glow/scale aggressively (modelScale * 3.0),
            // making the glow and apparent model scale much larger.
            // Commenting out the aggressive increase to keep medium size.
            // setGlowScale(Math.max(3.2, modelScale * 3.0));

            // Use a conservative scaling so model appears medium-sized and balanced:
            setGlowScale(Math.max(3.2, modelScale * 1.2));
          }} />

          <GlowPlane texture={glowTex} position={glowPos} scale={glowScale} visible={!!glowTex} />

          <ContactShadows position={[0, -0.82, 0]} opacity={0.72} width={3.8} blur={4} far={1.5} />

          <OrbitControls enablePan={false} enableZoom autoRotate autoRotateSpeed={0.55} maxPolarAngle={Math.PI / 1.2} minPolarAngle={Math.PI / 12} minDistance={0.8} maxDistance={18} enableDamping dampingFactor={0.08} />
        </Suspense>
      </Canvas>

      {!isLoaded && <OverlayLoader text="Loading model..." />}
    </div>
  );
}
