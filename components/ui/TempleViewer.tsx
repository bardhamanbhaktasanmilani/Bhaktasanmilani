// components/ui/TempleViewer.tsx
"use client";

import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";

/**
 * TempleViewer — rewritten to fix lighting / material issues while preserving
 * the original features (shadows, glow, fit/center, day/night toggle, loader).
 *
 * Key fixes performed:
 * - Avoid aggressive lerp-to-white which flattens detail; instead gently bias
 *   materials toward a warm off-white marble while preserving texture maps.
 * - Reduce global ambient and hemisphere energy so a single dominant "sun"
 *   (directional light) creates readable depth and crisp shadows.
 * - Move the primary key light to be *behind* the temple relative to the camera
 *   (sun behind the temple) so temple front faces the camera with strong rim
 *   definition and backlight separation.
 * - Use PCFSoftShadowMap and sane shadow camera extents to reduce acne and
 *   clipping while keeping crisp shadows.
 * - Keep all original UX features (toggle, loader, glow plane, contact shadows)
 */

/* ---------------------- TUNABLE CONSTANTS ---------------------- */
const LIGHTEN_STRENGTH = 0.12; // much smaller than before — only a gentle bias
const SHADOW_MAP_SIZE = 2048;
const SHADOW_CAM_SIZE = 14;
const KEY_LIGHT_DAY = 2.0; // stronger sun for readable depth
const KEY_LIGHT_NIGHT = 0.18;
const HEMI_INTENSITY_DAY = 0.22; // lowered hemisphere so it doesn't flatten
const HEMI_INTENSITY_NIGHT = 0.12;
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
      const marbleBias = new THREE.Color(0xf4efe6); // warm off-white marble

      scene.traverse((obj: any) => {
        if (!obj) return;
        // only adjust meshes
        if (obj.isMesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;

          // detach shared materials by cloning where necessary
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

            // If the material has a color but also a texture map, avoid overwriting the color
            // as the texture contains the detail. We only bias materials that don't already
            // have a diffuse map or where color is meaningful.
            try {
              const hasMap = !!mat.map;

              if (!hasMap && mat.color) {
                // gently bias color toward marbleBias — much less aggressive than lerping to white
                if (typeof mat.color.lerp === "function") {
                  mat.color.lerp(marbleBias, Math.min(1, strength * 0.7));
                } else {
                  mat.color = marbleBias.clone();
                }
              }

              // Tame emissive: leave a subtle warm glow only if already present
              if (mat.emissive) {
                // keep emissive but reduce intensity so it doesn't wash out ambient shading
                if (typeof mat.emissive.lerp === "function") mat.emissive.lerp(new THREE.Color(0x000000), 1 - Math.min(0.9, strength * 2));
                mat.emissiveIntensity = Math.max(0.001, Math.min(0.35, (mat.emissiveIntensity || 0.0) * 0.18 + strength * 0.02));
              }

              // Make surfaces a touch glossier so they pick up highlights, but don't overdo it
              if (typeof mat.roughness === "number") {
                mat.roughness = Math.max(0.06, Math.min(1, (mat.roughness as number) - strength * 0.2));
              }

              if (typeof mat.metalness === "number") {
                mat.metalness = Math.max(0, (mat.metalness as number) - strength * 0.18);
              }

              if (typeof mat.envMapIntensity === "number") {
                mat.envMapIntensity = Math.min(6, (mat.envMapIntensity || 1) * (1 + strength * 0.3));
              }

              // ensure updates propagate
              mat.needsUpdate = true;
            } catch (e) {
              // ignore per-material failures — leave original material in place
            }
          });
        }
      });
    } catch (err) {
      // If traversal fails, do not crash the app
      // console.warn("TempleViewer: model traversal error", err);
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

function FitAndCenter({ sceneRef, onComputed, targetSize = 2 }: { sceneRef: React.MutableRefObject<THREE.Object3D | null>; onComputed: (v: { glowZ: number; modelScale: number; center: THREE.Vector3 }) => void; targetSize?: number; }) {
  const { camera } = useThree();

  useEffect(() => {
    const obj = sceneRef.current;
    if (!obj) return;

    // compute bounding box and scale to fit targetSize
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

    // compute a good camera distance and position
    if (camera && camera instanceof THREE.PerspectiveCamera) {
      const perspective = camera as THREE.PerspectiveCamera;
      const fov = (perspective.fov * Math.PI) / 180;
      const cameraDistance = Math.abs(Math.max(finalSize.x, finalSize.y, finalSize.z) / (2 * Math.tan(fov / 2))) * 1.8;
      perspective.position.set(cameraDistance * 0.9, cameraDistance * 0.6, cameraDistance * 0.9);
      perspective.near = 0.01;
      perspective.far = Math.max(1000, cameraDistance * 10);
      perspective.updateProjectionMatrix();

      // place glow behind the object relative to camera
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir); // points from camera toward scene
      const glowDir = camDir.clone().negate(); // behind the model relative to camera
      const padding = Math.max(finalSize.z * 0.7, 0.8);
      const glowDistance = Math.max(finalSize.length(), targetSize) * 1.6 + padding;
      const glowPos = glowDir.clone().multiplyScalar(glowDistance);

      onComputed({ glowZ: glowPos.z, modelScale: scale, center: finalCenter });
    } else {
      // fallback
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

function Starfield({ count = 700, radius = 24 }: { count?: number; radius?: number }) {
  const geomRef = useRef<THREE.BufferGeometry | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = radius * (0.6 + Math.random() * 0.4);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      arr[i * 3 + 0] = x;
      arr[i * 3 + 1] = y + 2.6;
      arr[i * 3 + 2] = z;
    }
    return arr;
  });

  useFrame(() => {
    if (!materialRef.current) return;
    const t = (Date.now() % 60000) / 60000;
    materialRef.current.size = 0.012 + Math.sin(t * Math.PI * 2) * 0.006;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={materialRef as any} size={0.01} sizeAttenuation transparent opacity={0.95} />
    </points>
  );
}

function Moon({ position = [6, 5, -6], radius = 0.55 }: { position?: [number, number, number]; radius?: number }) {
  const ref = useRef<THREE.Mesh | null>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.0008;
  });
  return (
    <mesh ref={ref} position={position as any} renderOrder={1}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial emissive={new THREE.Color(0xf8f4e6)} emissiveIntensity={1.0} roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

export default function TempleViewer({ modelPath = "/About/temple.glb" }: { modelPath?: string }) {
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const [glowPos, setGlowPos] = useState(new THREE.Vector3(0, 1.0, -3));
  const [glowScale, setGlowScale] = useState<number>(3.2);
  const glowTex = useFieryGlowTexture();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mode, setMode] = useState<"day" | "night">("day");
  const toggleMode = () => setMode((m) => (m === "day" ? "night" : "day"));

  const [canRenderWebGL, setCanRenderWebGL] = useState<boolean>(() => isWebGLAvailable());
  useEffect(() => {
    if (typeof window !== "undefined") setCanRenderWebGL(isWebGLAvailable());
  }, []);

  const ambientIntensity = mode === "day" ? 0.04 : 0.02; // very low ambient
  const pointLightIntensity = mode === "day" ? 1.1 : 0.28;
  const moonLightIntensity = mode === "night" ? 1.05 : 0;
  const containerBg = mode === "day" ? "linear-gradient(180deg, #fff7ef 0%, #ffe6d6 30%, #ffd0bf 60%, #ffb79a 100%)" : "linear-gradient(180deg,#02040a 0%,#071026 30%,#0b2440 60%,#081726 100%)";
  const canvasBg = mode === "day" ? "#fff9f1" : "#04041a";

  if (!canRenderWebGL) {
    return (
      <div className="w-full min-w-0 flex justify-center items-center relative rounded-2xl" style={{ background: containerBg, height: "min(60vh, 680px)", minHeight: 360 }}>
        <div style={{ position: "absolute", right: 18, top: 18, zIndex: 70 }}>
          <button aria-label="Toggle day/night" onClick={toggleMode} className="px-3 py-1 text-xs font-semibold rounded-full bg-white/70">Toggle view</button>
        </div>
        <div className="text-center max-w-xl p-6">
          <h3 className="mb-2 text-xl font-bold text-gray-900">3D preview unavailable</h3>
          <p className="text-sm text-gray-700">Your device or browser does not support WebGL. You can still view images and information on this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 flex justify-center items-center relative" style={{ background: containerBg, height: "min(75vh, 820px)", minHeight: 480 }}>
      <div style={{ position: "absolute", right: 18, top: 18, zIndex: 70 }}>
        <div role="button" aria-label="Toggle day/night" onClick={toggleMode} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleMode(); }} style={{ userSelect: "none", cursor: "pointer", padding: 6, borderRadius: 20, background: mode === "day" ? "rgba(255,255,255,0.9)" : "rgba(8,12,20,0.7)", display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 999, background: mode === "day" ? "#fde68a" : "transparent" }}>View Day</div>
          <div style={{ width: 1, height: 28, background: "rgba(0,0,0,0.06)" }} />
          <div style={{ fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 999, background: mode === "night" ? "#1e293b" : "transparent", color: mode === "night" ? "#fff" : undefined }}>View Night</div>
          <div style={{ position: "relative", marginLeft: 8 }}>
            <div style={{ width: 36, height: 22, borderRadius: 999, background: mode === "day" ? "#fff7ed" : "#0f172a", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, background: mode === "day" ? "#f97316" : "#60a5fa", transform: `translateX(${mode === "day" ? "4px" : "14px"})`, transition: "transform 220ms ease", margin: 2 }} />
            </div>
          </div>
        </div>
      </div>

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
          <hemisphereLight
  args={[
    0xfffffb,
    0x3a3426,
    mode === "day" ? HEMI_INTENSITY_DAY : HEMI_INTENSITY_NIGHT,
  ]}
/>

          {/* Primary key light (sun) — placed BEHIND the temple relative to the camera so
              temple front gets rim & backlit separation. */}
          <directionalLight
            castShadow
            color={mode === "day" ? "#fff7ea" : "#cfe6ff"}
            intensity={mode === "day" ? KEY_LIGHT_DAY : KEY_LIGHT_NIGHT}
            position={[-6, 10, -6]} // moved to the back-left so sun is behind temple
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
          <pointLight color={mode === "day" ? "#ffd9a8" : "#c9dfff"} intensity={pointLightIntensity} position={[0, 1.6, -2.5]} distance={12} decay={2} />

          {/* Rim/back light to accent edges */}
          <directionalLight color={0xfff3e8} intensity={RIM_INTENSITY} position={[6, 4, 6]} />

          {/* Low ambient so that the directional light creates contrast */}
          <ambientLight intensity={ambientIntensity} />

          {/* Night extras */}
          {mode === "night" && (
            <>
              <directionalLight color="#dbeeff" intensity={moonLightIntensity} position={[-6, 9, 2]} />
              <Moon position={[6, 5, -6]} radius={0.55} />
              <Starfield count={600} radius={26} />
            </>
          )}

          <TempleModel path={modelPath} sceneRef={sceneRef} onReady={() => setIsLoaded(true)} strength={LIGHTEN_STRENGTH} />

          <FitAndCenter sceneRef={sceneRef} targetSize={4.2} onComputed={({ glowZ, modelScale }) => {
            setGlowPos(new THREE.Vector3(0, 0.9 * modelScale, glowZ));
            setGlowScale(Math.max(3.2, modelScale * 3.0));
          }} />

          <GlowPlane texture={glowTex} position={glowPos} scale={mode === "day" ? glowScale : glowScale * 0.5} visible={!!glowTex} />

          <ContactShadows position={[0, -0.82, 0]} opacity={mode === "day" ? 0.72 : 0.38} width={3.8} blur={4} far={1.5} />

          <OrbitControls enablePan={false} enableZoom autoRotate autoRotateSpeed={0.55} maxPolarAngle={Math.PI / 1.2} minPolarAngle={Math.PI / 12} minDistance={0.8} maxDistance={18} enableDamping dampingFactor={0.08} />
        </Suspense>
      </Canvas>

      {!isLoaded && <OverlayLoader text="Loading model..." />}
    </div>
  );
}
