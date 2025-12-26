// components/ui/TempleViewer.tsx
"use client";

import React, { Suspense, useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows, useProgress, Html } from "@react-three/drei";

/**
 * Rewritten TempleViewer:
 * - ErrorBoundary + retry fallback (handles loader failures)
 * - Progress percent overlay
 * - Low-end device detection (reduces DPR, disables shadows, lowers map sizes)
 * - Graceful fallback to a static poster image if model can't load
 * - Safer GLTF handling and mild material tweaks like before
 *
 * IMPORTANT:
 * - Put optimized GLB(s) inside /public (e.g. public/About/temple.glb).
 * - Prefer compressed/DRACO/Basis/KTX2 versions in production (see checklist below).
 */

/* -------- tunables -------- */
const DEFAULT_MODEL = "/About/temple-draco.glb";

const FALLBACK_IMAGE = "/About/temple-poster.jpg"; // place a static poster in public/About
const TARGET_SIZE = 2.6;

/* helper device checks */
function isWebGLAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

function detectLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobile = /Mobi|Android/i.test(ua);
  const deviceMemory = (navigator as any).deviceMemory || 0;
  const cpuCount = (navigator as any).hardwareConcurrency || 4;
  // treat low deviceMemory (<2GB) or low CPU threads or mobile as low-end
  return isMobile || deviceMemory > 0 && deviceMemory < 2 || cpuCount < 3;
}

/* ---------- small UI pieces ---------- */
function CenteredMessage({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode; }) {
  return (
    <div className="w-full min-w-0 flex justify-center items-center relative rounded-2xl" style={{ height: "min(65vh, 700px)" }}>
      <div className="text-center max-w-xl p-6">
        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-700 mb-3">{subtitle}</p>}
        {action}
      </div>
    </div>
  );
}

function OverlayLoader({ text = "Loading model…" }: { text?: string }) {
  return (
    <div aria-hidden={false} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.95)" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{text}</div>
      </div>
    </div>
  );
}

/* ---------- progress overlay using drei's useProgress ---------- */
function ProgressOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.95)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Loading 3D model</div>
        <div style={{ width: 220, height: 8, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${Math.round(progress)}%`, height: "100%", transition: "width 200ms linear", background: "#f59e0b" }} />
        </div>
        <div style={{ fontSize: 12, marginTop: 6, textAlign: "right" }}>{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

/* ---------- glow texture (smaller canvas on low-end) ---------- */
function useFieryGlowTexture(lowEnd = false): THREE.Texture | null {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    try {
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
      for (let i = 0; i < (lowEnd ? 200 : 600); i++) {
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
  }, [lowEnd]);
}

/* ---------- small component: loads GLTF and applies mild material tweaks ---------- */
function TempleModel({ path, sceneRef, onReady, strength = 0.12 }: { path: string; sceneRef: React.MutableRefObject<THREE.Object3D | null>; onReady?: () => void; strength?: number; }) {
  // useGLTF will throw on error -> caught by parent's ErrorBoundary
  const gltf: any = useGLTF(path, true);
  const signaledRef = useRef(false);

  useEffect(() => {
    if (!gltf || !gltf.scene) return;
    const scene = gltf.scene as THREE.Object3D;
    sceneRef.current = scene;

    try {
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
              return m.clone ? m.clone() : Object.assign(Object.create(Object.getPrototypeOf(m)), m);
            } catch {
              return m;
            }
          });
          obj.material = Array.isArray(obj.material) ? newMats : newMats[0];
          newMats.forEach((mat: any) => {
            if (!mat) return;
            try {
              if (!mat.map && mat.color && typeof mat.color.lerp === "function") {
                mat.color.lerp(marbleBias, Math.min(1, strength * 0.7));
              }
              if (mat.emissive && typeof mat.emissive.lerp === "function") {
                mat.emissive.lerp(new THREE.Color(0x000000), 1 - Math.min(0.9, strength * 2));
                mat.emissiveIntensity = Math.max(0.001, Math.min(0.35, (mat.emissiveIntensity || 0) * 0.18 + strength * 0.02));
              }
              if (typeof mat.roughness === "number") mat.roughness = Math.max(0.06, Math.min(1, (mat.roughness as number) - strength * 0.2));
              if (typeof mat.metalness === "number") mat.metalness = Math.max(0, (mat.metalness as number) - strength * 0.18);
              if (typeof mat.envMapIntensity === "number") mat.envMapIntensity = Math.min(6, (mat.envMapIntensity || 1) * (1 + strength * 0.3));
              mat.needsUpdate = true;
            } catch {
              /* ignore */
            }
          });
        }
      });
    } catch { /* ignore */ }

    if (onReady && !signaledRef.current) {
      Promise.resolve().then(() => {
        signaledRef.current = true;
        onReady();
      });
    }
  }, [gltf, sceneRef, onReady, strength]);

  return gltf?.scene ? <primitive object={gltf.scene} /> : null;
}

/* ---------- Fit + center logic (as before) ---------- */
function FitAndCenter({ sceneRef, onComputed, targetSize = TARGET_SIZE }: { sceneRef: React.MutableRefObject<THREE.Object3D | null>; onComputed: (v: { glowZ: number; modelScale: number; center: THREE.Vector3 }) => void; targetSize?: number; }) {
  const { camera } = useThree();

  useEffect(() => {
    const obj = sceneRef.current;
    if (!obj) return;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.0001);
    const scale = targetSize / maxDim;
    obj.scale.setScalar(scale);
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

/* ---------- glow plane ---------- */
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

/* ---------- Error boundary for Suspense loaders ---------- */
class LoaderErrorBoundary extends React.Component<{ children: React.ReactNode; onReset?: () => void }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("TempleViewer loader error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-w-0 flex justify-center items-center relative" style={{ height: "min(65vh,700px)" }}>
          <div className="text-center max-w-lg p-6">
            <h3 className="mb-2 text-xl font-bold text-gray-900">3D model failed to load</h3>
            <p className="text-sm text-gray-700 mb-4">Some devices or networks may fail to load the model. You can retry or view a static preview instead.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="px-4 py-2 rounded bg-amber-500 text-white" onClick={() => { this.setState({ hasError: false, error: undefined }); this.props.onReset?.(); }}>Retry</button>
              <a href={FALLBACK_IMAGE} target="_blank" rel="noreferrer" className="px-4 py-2 rounded border">Open fallback image</a>
            </div>
            <details className="mt-4 text-left text-xs text-gray-500">
              <summary>Debug info</summary>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{String(this.state.error ?? "no error")}</pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- main export ---------- */
export default function TempleViewer({ modelPath = DEFAULT_MODEL }: { modelPath?: string }) {
  const sceneRef = useRef<THREE.Object3D | null>(null);
  const [glowPos, setGlowPos] = useState(new THREE.Vector3(0, 1.0, -3));
  const [glowScale, setGlowScale] = useState<number>(3.2);
  const [isLoaded, setIsLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // to force remount canvas on retry
  const canWebGL = typeof window !== "undefined" ? isWebGLAvailable() : false;
  const lowEnd = typeof window !== "undefined" ? detectLowEndDevice() : false;
  const glowTex = useFieryGlowTexture(lowEnd);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!isWebGLAvailable()) console.warn("WebGL not available on this device/browser. TempleViewer will show a fallback.");
    }
  }, []);

  if (!canWebGL) {
    return <CenteredMessage title="3D preview unavailable" subtitle="Your device or browser does not support WebGL. A static preview is available below." action={<a href={FALLBACK_IMAGE} className="px-4 py-2 rounded bg-amber-500 text-white">Open preview</a>} />;
  }

  /* renderer & performance settings tuned for low-end devices */
  const dpr = lowEnd ? [1, 1] : [1, 1.4];
  const shadowMapSize = lowEnd ? 1024 : 2048;
  const contactShadowBlur = lowEnd ? 2 : 4;
  const contactShadowWidth = lowEnd ? 2.0 : 3.8;
  const shadowsEnabled = !lowEnd;

  return (
    <div className="w-full min-w-0 flex justify-center items-center relative" style={{ background: "linear-gradient(180deg,#fff7ef 0%,#ffe6d6 30%,#ffd0bf 60%,#ffb79a 100%)", height: "min(75vh,820px)", minHeight: 420 }}>
      <LoaderErrorBoundary onReset={() => setRenderKey(k => k + 1)}>
        <Canvas
          key={renderKey}
          shadows={shadowsEnabled}
          dpr={dpr}
          gl={{ antialias: !lowEnd, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%", maxWidth: 1200 }}
          camera={{ position: [3.0, 2.6, 4.2], fov: 40 }}
          onCreated={({ gl }) => {
            try {
              (gl as any).physicallyCorrectLights = true;
              if ((gl as any).outputEncoding !== undefined) (gl as any).outputEncoding = (THREE as any).sRGBEncoding ?? (THREE as any).SRGBColorSpace ?? (gl as any).outputEncoding;
              if ((gl as any).shadowMap) {
                (gl as any).shadowMap.enabled = shadowsEnabled;
                (gl as any).shadowMap.type = (THREE as any).PCFSoftShadowMap ?? (THREE as any).PCFShadowMap ?? (gl as any).shadowMap.type;
                (gl as any).shadowMap.autoUpdate = true;
                (gl as any).shadowMap.needsUpdate = true;
              }
            } catch (err) {
              console.warn("Renderer config failed:", err);
            }
          }}
        >
          <color attach="background" args={["#fff9f1"]} />

          <Suspense fallback={null}>
            <ProgressOverlay />

            {/* Lights */}
            <hemisphereLight args={[0xfffffb, 0x3a3426, lowEnd ? 0.2 : 0.22]} />
            <directionalLight
              castShadow={shadowsEnabled}
              color={"#fff7ea"}
              intensity={2.0}
              position={[-6, 10, -6]}
              shadow-mapSize-width={shadowMapSize}
              shadow-mapSize-height={shadowMapSize}
              shadow-bias={-0.0005}
              shadow-camera-near={0.5}
              shadow-camera-far={80}
              shadow-camera-left={-14}
              shadow-camera-right={14}
              shadow-camera-top={14}
              shadow-camera-bottom={-14}
            />
            <pointLight color={"#ffd9a8"} intensity={lowEnd ? 0.9 : 1.1} position={[0, 1.6, -2.5]} distance={12} decay={2} />
            <directionalLight color={0xfff3e8} intensity={0.6} position={[6, 4, 6]} />
            <ambientLight intensity={0.04} />

            {/* Model */}
            <TempleModel path={modelPath} sceneRef={sceneRef} onReady={() => setIsLoaded(true)} strength={0.12} />

            {/* Fit + compute glow scale/position */}
            <FitAndCenter sceneRef={sceneRef} targetSize={TARGET_SIZE} onComputed={({ glowZ, modelScale }) => {
              setGlowPos(new THREE.Vector3(0, 0.9 * modelScale, glowZ));
              setGlowScale(Math.max(3.0, modelScale * 1.2));
            }} />

            <GlowPlane texture={glowTex} position={glowPos} scale={glowScale} visible={!!glowTex} />

            <ContactShadows position={[0, -0.82, 0]} opacity={0.72} width={contactShadowWidth} blur={contactShadowBlur} far={1.5} />

            <OrbitControls enablePan={false} enableZoom autoRotate autoRotateSpeed={0.55} maxPolarAngle={Math.PI / 1.2} minPolarAngle={Math.PI / 12} minDistance={0.8} maxDistance={18} enableDamping dampingFactor={0.08} />
          </Suspense>
        </Canvas>
      </LoaderErrorBoundary>

      {!isLoaded && <OverlayLoader text="Loading model..." />}

      {/* show fallback image below the canvas for small screens where user wants quick preview */}
      <noscript>
        <div style={{ padding: 8, textAlign: "center" }}>
          <a href={FALLBACK_IMAGE}>View static preview</a>
        </div>
      </noscript>

    </div>
  );
}
