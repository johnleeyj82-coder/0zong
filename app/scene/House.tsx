"use client";
// The 3D house: one room at a time (shell, placeholder furniture, doors), lit by Seoul's time and weather.
// Loaded only on "/" and only in the browser (see RoomStage).
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, OrbitControls, PerformanceMonitor, useCursor } from "@react-three/drei";
import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ROOMS } from "../data";
import { useScene, type Quality } from "../components/SceneContext";
import { bubbleAnchor } from "../components/Bubble";
import { HOUSE } from "./spaces";
import type { Door, Part, Space, Thing } from "./kit";
import { lookFor, type Look } from "./look";
import { texture, windowLight } from "./textures";

const ACCENT = "#e9b872";
// Walls are 0.18 thick, but their inner faces stay 0.05 inside the room's nominal size (things are placed against that).
const WALL_T = 0.18, WALL_IN = 0.05;
const TRIM = "#33241a", FRAME = "#1c1a1c";

export default function House({ quality }: { quality: Exclude<Quality, "off"> }) {
  const { space: id, cameFrom, select, selected, hover, degrade, qualitySetting } = useScene();
  const space = HOUSE[id];
  const flash = useRef(0);
  // low: no shadows, no post-processing (phones). medium: 1024 shadow map + bloom. high: 2048 + full resolution.
  const shadows = quality !== "low";
  return (
    <Canvas
      className="house-canvas"
      dpr={quality === "high" ? [1, 2] : quality === "medium" ? [1, 1.5] : [0.75, 1]}
      shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
      gl={{ antialias: quality === "low", powerPreference: "high-performance", stencil: true }}
      camera={{ fov: 42, near: 0.1, far: 80, position: space.view.pos }}
      // A hobby's scene covers the whole screen: stop drawing the room underneath until it closes.
      frameloop={selected && selected !== "bed" ? "never" : "always"}
      onPointerMissed={() => select(null)}
      aria-label="0zong의 방 3D 장면. 끌어서 둘러보고, 물건을 누르면 그 취미가 열려요."
    >
      {qualitySetting === "auto" && <PerformanceMonitor onDecline={degrade} />}
      <Cursor on={!!hover} />
      <Rig space={space} cameFrom={cameFrom} />
      <Lights space={space} shadows={shadows} mapSize={quality === "high" ? 2048 : 1024} flash={flash} />
      <group key={space.id}>
        <Shell space={space} shadows={shadows} />
        {space.window && <Outside space={space} flash={flash} />}
        {space.window && !shadows && <WindowLight space={space} />}
        {space.things.map((t) => <ThingView key={t.key} t={t} shadows={shadows} />)}
        {space.doors.map((d) => <DoorView key={d.id} d={d} shadows={shadows} />)}
        {space.bubble && <BubbleAnchor at={space.bubble} />}
        {/* Soft dark pools where furniture meets the floor. Rendered once per room: nothing moves. */}
        {shadows && <ContactShadows position={[0, 0.016, 0]} scale={[space.size[0], space.size[1]]} resolution={512} far={1.1} blur={2.2} opacity={0.55} frames={1} color="#120b06" />}
      </group>
      {shadows && (
        // Bloom makes the bulbs, screens and city lights glow. The stencil buffer is kept for the window mask.
        <EffectComposer stencilBuffer multisampling={quality === "high" ? 4 : 2}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={1} luminanceSmoothing={0.25} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function Cursor({ on }: { on: boolean }) {
  useCursor(on);
  return null;
}

/* ---------- camera ---------- */
function Rig({ space, cameFrom }: { space: Space; cameFrom: string | null }) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const aspect = useThree((s) => s.size.width / s.size.height);
  // Portrait screens see less of the room's width: open the lens and step back a little (drag to see the sides).
  const back = aspect < 1.2 ? 1.12 : 1;

  useLayoutEffect(() => {
    const v = (cameFrom && space.from?.[cameFrom as keyof typeof space.from]) || space.view;
    const target = new THREE.Vector3(...v.target);
    const pos = new THREE.Vector3(...v.pos).sub(target).multiplyScalar(back).add(target);
    camera.position.copy(pos);
    controls.current?.target.copy(target);
    controls.current?.update();
  }, [space, cameFrom, camera, back]);

  useEffect(() => {
    camera.fov = aspect < 0.8 ? 64 : aspect < 1.2 ? 52 : 42;
    camera.updateProjectionMatrix();
  }, [aspect, camera]);

  return (
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.5} zoomSpeed={0.6}
      minDistance={3} maxDistance={9 * back} minPolarAngle={0.55} maxPolarAngle={1.45} minAzimuthAngle={-0.85} maxAzimuthAngle={0.85} />
  );
}

/* ---------- light ---------- */
type Mix = { sky: THREE.Color; low: THREE.Color; sun: THREE.Color; hemiSky: THREE.Color; hemiGround: THREE.Color; sunI: number; ambient: number; lamps: number; city: number };
const toMix = (l: Look): Mix => ({
  sky: new THREE.Color(l.skyTop), low: new THREE.Color(l.skyLow), sun: new THREE.Color(l.sun),
  hemiSky: new THREE.Color(l.hemiSky), hemiGround: new THREE.Color(l.hemiGround), sunI: l.sunI, ambient: l.ambient, lamps: l.lamps, city: l.city,
});

/** The current look eases toward the wanted one, so the bed or a new forecast fades instead of jumping. */
function useLook() {
  const { time, env } = useScene();
  const wanted = useMemo(() => toMix(lookFor(time, env?.weather ?? "clear")), [time, env?.weather]);
  const cur = useRef<Mix | null>(null);
  if (!cur.current) cur.current = toMix(lookFor(time, env?.weather ?? "clear"));
  useFrame((_, dt) => {
    const c = cur.current!, k = Math.min(1, dt * 1.2);
    c.sky.lerp(wanted.sky, k); c.low.lerp(wanted.low, k); c.sun.lerp(wanted.sun, k);
    c.hemiSky.lerp(wanted.hemiSky, k); c.hemiGround.lerp(wanted.hemiGround, k);
    c.sunI += (wanted.sunI - c.sunI) * k; c.ambient += (wanted.ambient - c.ambient) * k;
    c.lamps += (wanted.lamps - c.lamps) * k; c.city += (wanted.city - c.city) * k;
  });
  return cur as MutableRefObject<Mix>;
}

// One look per frame for everything that reads it (lights, sky, city), shared through this module-level ref.
let lookRef: MutableRefObject<Mix> | null = null;

function Lights({ space, shadows, mapSize, flash }: { space: Space; shadows: boolean; mapSize: number; flash: MutableRefObject<number> }) {
  const look = useLook();
  lookRef = look;
  const { env } = useScene();
  const storm = env?.weather === "storm";
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const lamps = useRef<(THREE.PointLight | null)[]>([]);
  const [w, d, h] = space.size;
  const nextFlash = useRef(3);
  const scene = useThree((s) => s.scene);
  const wx = space.window?.x ?? 0;

  // With shadows the sun stands outside: the walls and an unseen ceiling block it, so daylight really falls through
  // the window and lies on the floor. Without shadows it would light everything, so it hangs inside, dimmer.
  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    l.target.position.set(wx - 0.4, 0, 0.6);
    scene.add(l.target);
    return () => { scene.remove(l.target); };
  }, [scene, wx]);

  useFrame((state, dt) => {
    const l = look.current;
    if (storm) {
      nextFlash.current -= dt;
      if (nextFlash.current <= 0) { flash.current = 1; nextFlash.current = 4 + Math.random() * 8; }
    }
    flash.current = Math.max(0, flash.current - dt * 3.5);
    const f = flash.current * (0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 60));
    // With real shadows the sun no longer floods the room, so the sky's bounce carries the daytime.
    if (amb.current) amb.current.intensity = l.ambient * (shadows ? 1.4 : 1) + f * 1.5;
    if (hemi.current) { hemi.current.intensity = l.ambient * (shadows ? 3.4 : 2); hemi.current.color.copy(l.hemiSky); hemi.current.groundColor.copy(l.hemiGround); }
    if (sun.current) { sun.current.intensity = (shadows ? l.sunI * 1.6 : l.sunI * 0.6) + f * 4; sun.current.color.copy(l.sun); }
    if (fill.current) { fill.current.intensity = l.sunI * 0.22; fill.current.color.copy(l.hemiSky); }
    space.lamps.forEach((lamp, i) => { const p = lamps.current[i]; if (p) p.intensity = lamp.power * (0.25 + l.lamps * 2.2); });
  });

  return (
    <>
      <ambientLight ref={amb} color="#fff3e2" />
      <hemisphereLight ref={hemi} />
      <directionalLight ref={sun} position={shadows ? [wx + 1.6, 6.5, -d / 2 - 6] : [wx, 6, -d / 2 + 0.5]} castShadow={shadows}
        shadow-mapSize={[mapSize, mapSize]} shadow-bias={-0.0006} shadow-normalBias={0.03} shadow-radius={5}
        shadow-camera-left={-w / 2 - 1.5} shadow-camera-right={w / 2 + 1.5} shadow-camera-top={h + 2} shadow-camera-bottom={-3} shadow-camera-near={1} shadow-camera-far={22} />
      {/* A weak light from the camera's side, the colour of the sky, so shapes in shade still read. */}
      <directionalLight ref={fill} position={[2, 4, 6]} />
      {space.lamps.map((lamp, i) => (
        <pointLight key={i} ref={(el) => { lamps.current[i] = el; }} position={lamp.at} color={lamp.color ?? "#ffb56b"} distance={lamp.distance ?? 6} decay={1.6} />
      ))}
    </>
  );
}

/** Without real shadows (low quality): a patch of window light painted on the floor, as bright as the sun is. */
function WindowLight({ space }: { space: Space }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const win = space.window!;
  const map = useMemo(() => windowLight(), []);
  useFrame(() => {
    const l = lookRef?.current;
    if (!l || !mat.current) return;
    mat.current.opacity = Math.min(0.5, l.sunI * 0.17);
    mat.current.color.copy(l.sun);
  });
  return (
    <mesh position={[win.x - 0.25, 0.02, -space.size[1] / 2 + 1.5]} rotation={[-Math.PI / 2, 0, 0.1]}>
      <planeGeometry args={[win.w * 1.05, 2.6]} />
      <meshBasicMaterial ref={mat} map={map} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

/* ---------- walls, floor, window ---------- */
function Shell({ space, shadows }: { space: Space; shadows: boolean }) {
  const [w, d, h] = space.size;
  const win = space.window;
  const back = -d / 2 - (WALL_T / 2 - WALL_IN);
  const side = w / 2 + (WALL_T / 2 - WALL_IN);
  const cap = useMemo(() => new THREE.Color(space.wall).lerp(new THREE.Color("#f3eadb"), 0.45).getStyle(), [space.wall]);
  const plaster = (rx: number, ry: number) => texture("plaster", Math.max(1, Math.round(rx / 2)), Math.max(1, Math.round(ry / 2)));

  const wall = (key: string, size: [number, number, number], at: [number, number, number], rx = size[0]) => (
    <mesh key={key} position={at} receiveShadow={shadows} castShadow={shadows}>
      <boxGeometry args={size} /><meshStandardMaterial color={space.wall} map={plaster(rx, size[1])} roughness={0.96} />
    </mesh>
  );
  const depth = d + WALL_T - WALL_IN;
  const pieces = win
    ? [
        wall("bl", [win.x - win.w / 2 + w / 2 + WALL_T, h, WALL_T], [(-w / 2 - WALL_T + win.x - win.w / 2) / 2, h / 2, back]),
        wall("br", [w / 2 + WALL_T - win.x - win.w / 2, h, WALL_T], [(w / 2 + WALL_T + win.x + win.w / 2) / 2, h / 2, back]),
        wall("bb", [win.w, win.y, WALL_T], [win.x, win.y / 2, back]),
        wall("bt", [win.w, h - win.y - win.h, WALL_T], [win.x, (h + win.y + win.h) / 2, back]),
      ]
    : [wall("b", [w + WALL_T * 2, h, WALL_T], [0, h / 2, back])];
  const zMid = (back - WALL_T / 2 + d / 2) / 2;

  return (
    <group>
      {/* the diorama's base, then the floorboards */}
      <mesh position={[0, -0.26, zMid]}><boxGeometry args={[w + WALL_T * 2 + 0.16, 0.32, depth + 0.16]} /><meshStandardMaterial color="#1a130e" roughness={1} /></mesh>
      <mesh position={[0, -0.05, 0]} receiveShadow={shadows}>
        <boxGeometry args={[w, 0.1, d]} />
        <meshStandardMaterial color={space.floor} map={texture("planks", Math.round(w / 1.6), Math.round(d / 1.6))} roughness={0.62} />
      </mesh>
      {pieces}
      {wall("l", [WALL_T, h, depth], [-side, h / 2, zMid], depth)}
      {wall("r", [WALL_T, h, depth], [side, h / 2, zMid], depth)}
      {/* the cut tops of the walls catch a little light, so the room reads as a model you look into */}
      {[[0, back, w + WALL_T * 2, WALL_T], [-side, zMid, WALL_T, depth], [side, zMid, WALL_T, depth]].map(([x, z, sx, sz], i) => (
        <mesh key={`cap${i}`} position={[x, h + 0.011, z]}><boxGeometry args={[sx + 0.002, 0.02, sz + 0.002]} /><meshStandardMaterial color={cap} roughness={1} /></mesh>
      ))}
      {/* skirting boards */}
      {[[0, -d / 2 + WALL_IN + 0.012, w - 0.1, 0.024], [-w / 2 + WALL_IN + 0.012, 0, 0.024, d - 0.1], [w / 2 - WALL_IN - 0.012, 0, 0.024, d - 0.1]].map(([x, z, sx, sz], i) => (
        <mesh key={`sk${i}`} position={[x, 0.055, z]} receiveShadow={shadows}><boxGeometry args={[sx, 0.11, sz]} /><meshStandardMaterial color={TRIM} roughness={0.6} /></mesh>
      ))}
      {/* what the sun cannot pass: an unseen ceiling that only casts shadow */}
      {shadows && (
        <mesh position={[0, h + 0.05, zMid]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <planeGeometry args={[w + 1, depth + 1]} /><meshBasicMaterial colorWrite={false} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
      {win && <WindowFrame win={win} z={-d / 2 + WALL_IN} shadows={shadows} />}
    </group>
  );
}

/** Frame, mullions, sill, a faint pane of glass, and pleated curtains on a rod. */
function WindowFrame({ win, z, shadows }: { win: NonNullable<Space["window"]>; z: number; shadows: boolean }) {
  const top = win.y + win.h;
  const pleats = 6;
  return (
    <group position={[win.x, 0, z]}>
      {[win.y, top].map((y) => (
        <mesh key={y} position={[0, y, -0.06]} castShadow={shadows}><boxGeometry args={[win.w + 0.1, 0.06, 0.16]} /><meshStandardMaterial color={FRAME} roughness={0.5} /></mesh>
      ))}
      {[-win.w / 2, 0, win.w / 2].map((x) => (
        <mesh key={x} position={[x, win.y + win.h / 2, -0.06]} castShadow={shadows}><boxGeometry args={[x === 0 ? 0.04 : 0.06, win.h, 0.14]} /><meshStandardMaterial color={FRAME} roughness={0.5} /></mesh>
      ))}
      <mesh position={[0, win.y + win.h * 0.58, -0.06]} castShadow={shadows}><boxGeometry args={[win.w, 0.03, 0.1]} /><meshStandardMaterial color={FRAME} roughness={0.5} /></mesh>
      <mesh position={[0, win.y + win.h / 2, -0.07]}>
        <planeGeometry args={[win.w, win.h]} /><meshStandardMaterial color="#9fc3e6" transparent opacity={0.07} roughness={0.05} metalness={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[0, win.y - 0.03, 0.06]} castShadow={shadows} receiveShadow={shadows}>
        <boxGeometry args={[win.w + 0.24, 0.04, 0.24]} /><meshStandardMaterial color="#6a4630" map={texture("grain")} roughness={0.55} />
      </mesh>
      {/* curtain rod and two bunches of pleats */}
      <mesh position={[0, top + 0.2, 0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.014, 0.014, win.w + 1.1, 10]} /><meshStandardMaterial color={FRAME} metalness={0.6} roughness={0.4} /></mesh>
      {[-1, 1].map((s) => Array.from({ length: pleats }, (_, i) => (
        <mesh key={`${s}${i}`} position={[s * (win.w / 2 + 0.36 - i * 0.085), (top + 0.2 + 0.06) / 2, 0.1 + (i % 2) * 0.025]} scale={[1, 1, 0.55]} castShadow={shadows}>
          <cylinderGeometry args={[0.05, 0.058, top + 0.2 - 0.06, 10]} />
          <meshStandardMaterial color="#e9decb" map={texture("fabric", 1, 6)} roughness={1} transparent opacity={0.93} />
        </mesh>
      )))}
    </group>
  );
}

/* ---------- outside the window: sky, the city, rain or snow ---------- */
// The room has no ceiling, so anything outside would also show above the walls. The window writes 1 into the stencil
// buffer and everything outside draws only where it finds that 1: you see the city through the glass and nowhere else.
const THROUGH_WINDOW = { stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc } as const;

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function Outside({ space, flash }: { space: Space; flash: MutableRefObject<number> }) {
  const { env } = useScene();
  const win = space.window!;
  const back = -space.size[1] / 2;
  const city = useRef<THREE.PointsMaterial>(null);
  // One material for every building: by day they take on the haze of the sky, at night they are silhouettes.
  const towers = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a3040", roughness: 1, ...THROUGH_WINDOW }), []);
  useEffect(() => () => towers.dispose(), [towers]);

  const skyGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(40, 16, 1, 8);
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    return g;
  }, []);

  const { buildings, lights } = useMemo(() => {
    const r = rand(7);
    const buildings: { x: number; z: number; w: number; h: number }[] = [];
    const pts: number[] = [];
    for (let i = 0; i < 26; i++) {
      const x = -12 + i * 0.95 + r() * 0.4, z = back - 5 - r() * 4, w = 0.7 + r() * 0.9, h = 3 + r() * 9;
      buildings.push({ x, z, w, h });
      for (let k = 0; k < 22; k++) {
        if (r() < 0.45) continue;
        pts.push(x - w / 2 + 0.1 + r() * (w - 0.2), -6 + 0.3 + r() * (h - 0.6), z + w / 2 + 0.01);
      }
    }
    return { buildings, lights: new Float32Array(pts) };
  }, [back]);

  useFrame(() => {
    const l = lookRef?.current;
    if (!l) return;
    const col = skyGeo.attributes.color as THREE.BufferAttribute;
    const pos = skyGeo.attributes.position as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + 8) / 16; // 0 at the bottom of the plane, 1 at the top
      c.copy(l.low).lerp(l.sky, Math.min(1, t * 1.4)).offsetHSL(0, 0, flash.current * 0.35);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    if (city.current) city.current.opacity = 0.15 + l.city * 0.85;
    towers.emissive.copy(l.low);
    towers.emissiveIntensity = 0.42 * (1 - l.city);
  });

  const weather = env?.weather;
  return (
    <group>
      <mesh position={[win.x, win.y + win.h / 2, back]} renderOrder={-1}>
        <planeGeometry args={[win.w, win.h]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} stencilWrite stencilRef={1}
          stencilFunc={THREE.AlwaysStencilFunc} stencilZPass={THREE.ReplaceStencilOp} />
      </mesh>
      <mesh position={[win.x, 1, back - 10]} geometry={skyGeo} renderOrder={1}>
        <meshBasicMaterial vertexColors toneMapped={false} {...THROUGH_WINDOW} />
      </mesh>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x + win.x, -6 + b.h / 2, b.z]} renderOrder={1} material={towers}><boxGeometry args={[b.w, b.h, b.w]} /></mesh>
      ))}
      <points position={[win.x, 0, 0]} renderOrder={1}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[lights, 3]} /></bufferGeometry>
        <pointsMaterial ref={city} color="#ffcf8a" size={0.09} transparent toneMapped={false} {...THROUGH_WINDOW} />
      </points>
      {(weather === "rain" || weather === "storm") && <Rain x={win.x} back={back} heavy={weather === "storm"} />}
      {weather === "snow" && <Snow x={win.x} back={back} />}
    </group>
  );
}

function Rain({ x, back, heavy }: { x: number; back: number; heavy: boolean }) {
  const n = heavy ? 900 : 500;
  const geo = useRef<THREE.BufferGeometry>(null);
  const data = useMemo(() => {
    const r = rand(11), a = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const px = x - 3 + r() * 6, py = -2 + r() * 6, pz = back - 0.3 - r() * 3;
      a.set([px, py, pz, px + 0.03, py - 0.28, pz], i * 6);
    }
    return a;
  }, [n, x, back]);
  useFrame((_, dt) => {
    const p = geo.current?.attributes.position as THREE.BufferAttribute | undefined;
    if (!p) return;
    const v = (heavy ? 11 : 8) * Math.min(dt, 0.05);
    const a = p.array as Float32Array;
    for (let i = 0; i < a.length; i += 6) {
      a[i + 1] -= v; a[i + 4] -= v;
      if (a[i + 4] < -2) { a[i + 1] += 6; a[i + 4] += 6; }
    }
    p.needsUpdate = true;
  });
  return (
    <lineSegments>
      <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[data, 3]} /></bufferGeometry>
      <lineBasicMaterial color="#aeb9cc" transparent opacity={0.45} {...THROUGH_WINDOW} />
    </lineSegments>
  );
}

function Snow({ x, back }: { x: number; back: number }) {
  const geo = useRef<THREE.BufferGeometry>(null);
  const data = useMemo(() => {
    const r = rand(5), a = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) a.set([x - 3 + r() * 6, -2 + r() * 6, back - 0.3 - r() * 3], i * 3);
    return a;
  }, [x, back]);
  useFrame((state, dt) => {
    const p = geo.current?.attributes.position as THREE.BufferAttribute | undefined;
    if (!p) return;
    const a = p.array as Float32Array, t = state.clock.elapsedTime, step = Math.min(dt, 0.05);
    for (let i = 0; i < a.length; i += 3) {
      a[i + 1] -= 0.6 * step;
      a[i] += Math.sin(t + i) * 0.15 * step;
      if (a[i + 1] < -2) a[i + 1] += 6;
    }
    p.needsUpdate = true;
  });
  return (
    <points>
      <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[data, 3]} /></bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.85} {...THROUGH_WINDOW} />
    </points>
  );
}

/* ---------- things and doors ---------- */
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();

/** One part as geometry, already moved, turned and stretched into its place inside the thing. */
function partGeometry(p: Part): THREE.BufferGeometry {
  let g: THREE.BufferGeometry;
  if (p.kind === "box") g = new THREE.BoxGeometry(...p.size);
  else if (p.kind === "rbox") {
    const min = Math.min(...p.size);
    g = new RoundedBoxGeometry(p.size[0], p.size[1], p.size[2], 3, Math.min(p.radius ?? min * 0.2, min / 2 - 0.0004));
  } else if (p.kind === "cyl") g = new THREE.CylinderGeometry(p.r2 ?? p.r, p.r, p.h, p.seg ?? 24);
  else if (p.kind === "ball") g = new THREE.SphereGeometry(p.r, 24, 16);
  else g = new THREE.LatheGeometry(p.pts.map(([r, y]) => new THREE.Vector2(r, y)), p.seg ?? 24);
  if (g.index) { const n = g.toNonIndexed(); g.dispose(); g = n; }
  for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
  E.set(...(p.rot ?? [0, 0, 0]));
  M4.compose(V.set(...p.at), Q.setFromEuler(E), SC.set(...(p.scale ?? [1, 1, 1])));
  g.applyMatrix4(M4);
  return g;
}

/** Parts that look the same share one mesh: a bookcase of 80 books is a handful of draw calls, not 80. */
const lookKey = (p: Part) => [p.color, p.glow ?? "", p.glowI ?? "", p.opacity ?? "", p.rough ?? "", p.metal ?? "", p.tex ?? "", p.kind === "lathe" ? "l" : ""].join("|");

function useMerged(parts: Part[]) {
  const groups = useMemo(() => {
    const by = new Map<string, { p: Part; geos: THREE.BufferGeometry[] }>();
    for (const p of parts) {
      const k = lookKey(p);
      const g = by.get(k) ?? { p, geos: [] };
      g.geos.push(partGeometry(p));
      by.set(k, g);
    }
    return [...by.entries()].map(([key, { p, geos }]) => {
      const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos);
      if (geos.length > 1) geos.forEach((x) => x.dispose());
      return { key, p, geo };
    });
  }, [parts]);
  useEffect(() => () => groups.forEach((g) => g.geo.dispose()), [groups]);
  return groups;
}

function PartsMesh({ parts, hot, shadows }: { parts: Part[]; hot: boolean; shadows: boolean }) {
  const groups = useMerged(parts);
  return (
    <>
      {groups.map(({ key, p, geo }) => {
        const glow = hot ? (p.glow ? p.glow : ACCENT) : p.glow ?? "#000000";
        const glowI = hot ? (p.glow ? (p.glowI ?? 1) * 1.3 : 0.32) : p.glow ? p.glowI ?? 1 : 0;
        const clear = p.opacity !== undefined;
        return (
          <mesh key={key} geometry={geo} castShadow={shadows && !clear && !p.glow} receiveShadow={shadows && !clear}>
            <meshStandardMaterial color={p.color} map={p.tex ? texture(p.tex) : null} emissive={glow} emissiveIntensity={glowI}
              roughness={p.rough ?? 0.75} metalness={p.metal ?? 0} transparent={clear} opacity={p.opacity ?? 1} depthWrite={!clear || p.opacity! >= 0.6}
              side={p.kind === "lathe" ? THREE.DoubleSide : THREE.FrontSide} />
          </mesh>
        );
      })}
    </>
  );
}

const thingLabel = (t: Thing) => t.label ?? ROOMS.find((r) => r.key === t.hobby)?.label ?? "";

/** Hover handlers shared by things and doors. A drag that ends on an object is a look-around, not a click. */
function useHot(id: string, label: string, onPick: () => void) {
  const { hover, setHover } = useScene();
  return {
    hot: hover?.id === id,
    handlers: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover({ id, label }); },
      onPointerOut: () => setHover((h) => (h?.id === id ? null : h)),
      onClick: (e: ThreeEvent<MouseEvent>) => { if (e.delta > 6) return; e.stopPropagation(); onPick(); },
    },
  };
}

function ThingView({ t, shadows }: { t: Thing; shadows: boolean }) {
  const { selected, select } = useScene();
  const target = t.hobby ?? (t.action === "time" ? "bed" : null);
  const { hot, handlers } = useHot(t.key, thingLabel(t), () => select(target));
  return (
    <group position={t.at} rotation={[0, t.rotY ?? 0, 0]} scale={t.scale ?? 1} {...(target ? handlers : {})}>
      <PartsMesh parts={t.parts} hot={!!target && (hot || selected === target)} shadows={shadows} />
    </group>
  );
}

function DoorView({ d, shadows }: { d: Door; shadows: boolean }) {
  const { go } = useScene();
  const { hot, handlers } = useHot(d.id, d.label, () => go(d.to));
  const glow = hot ? ACCENT : "#000000";
  const wood = texture("grain");
  return (
    <group position={d.at} rotation={[0, d.rotY, 0]} {...handlers}>
      {[[-0.5, 1.08, 0.09, 2.16], [0.5, 1.08, 0.09, 2.16], [0, 2.2, 1.09, 0.09]].map(([x, y, sx, sy], i) => (
        <mesh key={i} position={[x, y, 0.02]} castShadow={shadows}><boxGeometry args={[sx, sy, 0.08]} /><meshStandardMaterial color={TRIM} emissive={glow} emissiveIntensity={hot ? 0.3 : 0} roughness={0.6} /></mesh>
      ))}
      <mesh position={[0, 1.065, 0.0]}><boxGeometry args={[0.92, 2.13, 0.045]} /><meshStandardMaterial color="#7a573d" map={wood} emissive={glow} emissiveIntensity={hot ? 0.22 : 0} roughness={0.55} /></mesh>
      {[[0, 0.5, 0.68, 0.7], [0, 1.52, 0.68, 0.96]].map(([x, y, sx, sy], i) => (
        <group key={i} position={[x, y, 0.024]}>
          <mesh><boxGeometry args={[sx, sy, 0.006]} /><meshStandardMaterial color="#5f4330" roughness={0.6} /></mesh>
          <mesh position={[0, 0, 0.004]}><boxGeometry args={[sx - 0.07, sy - 0.07, 0.006]} /><meshStandardMaterial color="#73523a" map={wood} emissive={glow} emissiveIntensity={hot ? 0.2 : 0} roughness={0.55} /></mesh>
        </group>
      ))}
      <mesh position={[0.37, 1.02, 0.045]}><boxGeometry args={[0.045, 0.16, 0.012]} /><meshStandardMaterial color="#c9a24a" metalness={0.85} roughness={0.3} /></mesh>
      <mesh position={[0.32, 1.04, 0.075]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.011, 0.011, 0.13, 10]} /><meshStandardMaterial color="#c9a24a" metalness={0.85} roughness={0.3} /></mesh>
    </group>
  );
}

/* ---------- speech bubble over the owner's seat ---------- */
// The bubble itself is ordinary DOM (RoomStage). Here we only move it to where its 3D point lands on screen each frame.
function BubbleAnchor({ at }: { at: [number, number, number] }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => () => { if (bubbleAnchor.el) bubbleAnchor.el.style.visibility = "hidden"; }, []);
  useFrame(({ camera, size }) => {
    const el = bubbleAnchor.el;
    if (!el) return;
    v.set(...at).project(camera);
    el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px)`;
    el.style.visibility = v.z < 1 ? "visible" : "hidden";
  });
  return null;
}
