"use client";
// The 3D house: one room at a time (shell, placeholder furniture, doors), lit by Seoul's time and weather.
// Loaded only on "/" and only in the browser (see RoomStage).
import { useEffect, useLayoutEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor, useCursor } from "@react-three/drei";
import * as THREE from "three";
import { ROOMS } from "../data";
import { useScene, type Quality } from "../components/SceneContext";
import { bubbleAnchor } from "../components/Bubble";
import { HOUSE } from "./spaces";
import { C, type Door, type Part, type Space, type Thing } from "./kit";
import { lookFor, type Look } from "./look";

const ACCENT = "#e9b872";
const WALL_T = 0.1;

export default function House({ quality }: { quality: Exclude<Quality, "off"> }) {
  const { space: id, cameFrom, select, hover, degrade, qualitySetting } = useScene();
  const space = HOUSE[id];
  const flash = useRef(0);
  const shadows = quality === "high";
  return (
    <Canvas
      className="house-canvas"
      dpr={quality === "high" ? [1, 2] : quality === "medium" ? [1, 1.5] : [0.75, 1]}
      shadows={shadows}
      gl={{ antialias: quality !== "low", powerPreference: "high-performance", stencil: true }}
      camera={{ fov: 42, near: 0.1, far: 80, position: space.view.pos }}
      onPointerMissed={() => select(null)}
      aria-label="0zong의 방 3D 장면. 끌어서 둘러보고, 물건을 누르면 그 취미가 열려요."
    >
      {qualitySetting === "auto" && <PerformanceMonitor onDecline={degrade} />}
      <Cursor on={!!hover} />
      <Rig space={space} cameFrom={cameFrom} />
      <Lights space={space} shadows={shadows} flash={flash} />
      <group key={space.id}>
        <Shell space={space} shadows={shadows} />
        {space.window && <Outside space={space} flash={flash} />}
        {space.things.map((t) => <ThingView key={t.key} t={t} shadows={shadows} />)}
        {space.doors.map((d) => <DoorView key={d.id} d={d} />)}
        {space.bubble && <BubbleAnchor at={space.bubble} />}
      </group>
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

function Lights({ space, shadows, flash }: { space: Space; shadows: boolean; flash: MutableRefObject<number> }) {
  const look = useLook();
  lookRef = look;
  const { env } = useScene();
  const storm = env?.weather === "storm";
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const lamps = useRef<(THREE.PointLight | null)[]>([]);
  const [w, , d] = space.size;
  const nextFlash = useRef(3);

  useFrame((state, dt) => {
    const l = look.current;
    if (storm) {
      nextFlash.current -= dt;
      if (nextFlash.current <= 0) { flash.current = 1; nextFlash.current = 4 + Math.random() * 8; }
    }
    flash.current = Math.max(0, flash.current - dt * 3.5);
    const f = flash.current * (0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 60));
    if (amb.current) amb.current.intensity = l.ambient + f * 1.5;
    if (hemi.current) { hemi.current.intensity = l.ambient * 2; hemi.current.color.copy(l.hemiSky); hemi.current.groundColor.copy(l.hemiGround); }
    if (sun.current) { sun.current.intensity = l.sunI + f * 4; sun.current.color.copy(l.sun); }
    space.lamps.forEach((lamp, i) => { const p = lamps.current[i]; if (p) p.intensity = lamp.power * (0.25 + l.lamps * 2.2); });
  });

  return (
    <>
      <ambientLight ref={amb} color="#fff3e2" />
      <hemisphereLight ref={hemi} />
      {/* Daylight comes in high from the window side and lands on the floor and the tops of things. */}
      <directionalLight ref={sun} position={[space.window?.x ?? 0, 6, -d / 2 + 0.5]} castShadow={shadows}
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-w / 2} shadow-camera-right={w / 2} shadow-camera-top={4} shadow-camera-bottom={-2} />
      {space.lamps.map((lamp, i) => (
        <pointLight key={i} ref={(el) => { lamps.current[i] = el; }} position={lamp.at} color={lamp.color ?? "#ffb56b"} distance={lamp.distance ?? 6} decay={1.6} />
      ))}
    </>
  );
}

/* ---------- walls, floor, window ---------- */
function Shell({ space, shadows }: { space: Space; shadows: boolean }) {
  const [w, d, h] = space.size;
  const win = space.window;
  const back = -d / 2;
  const wall = (key: string, size: [number, number, number], at: [number, number, number]) => (
    <mesh key={key} position={at} receiveShadow={shadows}><boxGeometry args={size} /><meshStandardMaterial color={space.wall} roughness={0.95} /></mesh>
  );
  const pieces = win
    ? [
        wall("bl", [win.x - win.w / 2 + w / 2, h, WALL_T], [(-w / 2 + win.x - win.w / 2) / 2, h / 2, back]),
        wall("br", [w / 2 - win.x - win.w / 2, h, WALL_T], [(w / 2 + win.x + win.w / 2) / 2, h / 2, back]),
        wall("bb", [win.w, win.y, WALL_T], [win.x, win.y / 2, back]),
        wall("bt", [win.w, h - win.y - win.h, WALL_T], [win.x, (h + win.y + win.h) / 2, back]),
      ]
    : [wall("b", [w, h, WALL_T], [0, h / 2, back])];
  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow={shadows}><boxGeometry args={[w, 0.1, d]} /><meshStandardMaterial color={space.floor} roughness={0.7} /></mesh>
      {pieces}
      {wall("l", [WALL_T, h, d], [-w / 2, h / 2, 0])}
      {wall("r", [WALL_T, h, d], [w / 2, h / 2, 0])}
      {/* skirting */}
      {[[0, back + 0.06, w, 0.02], [-w / 2 + 0.06, 0, 0.02, d], [w / 2 - 0.06, 0, 0.02, d]].map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x, 0.05, z]}><boxGeometry args={[sx, 0.1, sz]} /><meshStandardMaterial color={C.woodDark} /></mesh>
      ))}
      {win && (
        <group position={[win.x, 0, back]}>
          {/* frame and mullion */}
          {[[0, win.y, win.w + 0.1, 0.06], [0, win.y + win.h, win.w + 0.1, 0.06]].map(([x, y, sx, sy], i) => (
            <mesh key={`h${i}`} position={[x, y, 0.02]}><boxGeometry args={[sx, sy, 0.14]} /><meshStandardMaterial color={C.black} /></mesh>
          ))}
          {[-win.w / 2, 0, win.w / 2].map((x, i) => (
            <mesh key={`v${i}`} position={[x, win.y + win.h / 2, 0.02]}><boxGeometry args={[0.05, win.h, 0.12]} /><meshStandardMaterial color={C.black} /></mesh>
          ))}
          <mesh position={[0, win.y - 0.02, 0.12]}><boxGeometry args={[win.w + 0.2, 0.04, 0.22]} /><meshStandardMaterial color={C.wood} /></mesh>
          {/* sheer curtains */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (win.w / 2 + 0.05), (win.y + win.h + 0.25) / 2 + 0.05, 0.14]}>
              <boxGeometry args={[0.55, win.y + win.h + 0.25, 0.04]} />
              <meshStandardMaterial color={C.cream} transparent opacity={0.55} roughness={1} />
            </mesh>
          ))}
        </group>
      )}
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
        <mesh key={i} position={[b.x + win.x, -6 + b.h / 2, b.z]} renderOrder={1}>
          <boxGeometry args={[b.w, b.h, b.w]} /><meshStandardMaterial color="#2a3040" roughness={1} {...THROUGH_WINDOW} />
        </mesh>
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
function PartMesh({ p, hot, shadows }: { p: Part; hot: boolean; shadows: boolean }) {
  const glow = hot ? (p.glow ? p.glow : ACCENT) : p.glow ?? "#000000";
  const glowI = hot ? (p.glow ? (p.glowI ?? 1) * 1.3 : 0.32) : p.glow ? p.glowI ?? 1 : 0;
  return (
    <mesh position={p.at} rotation={p.rot} castShadow={shadows} receiveShadow={shadows}>
      {p.kind === "box" && <boxGeometry args={p.size} />}
      {p.kind === "cyl" && <cylinderGeometry args={[p.r2 ?? p.r, p.r, p.h, p.seg ?? 24]} />}
      {p.kind === "ball" && <sphereGeometry args={[p.r, 20, 14]} />}
      <meshStandardMaterial color={p.color} emissive={glow} emissiveIntensity={glowI} roughness={0.75}
        transparent={p.opacity !== undefined} opacity={p.opacity ?? 1} />
    </mesh>
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
  const parts = t.parts.map((p, i) => <PartMesh key={i} p={p} hot={!!target && (hot || selected === target)} shadows={shadows} />);
  return (
    <group position={t.at} rotation={[0, t.rotY ?? 0, 0]} scale={t.scale ?? 1} {...(target ? handlers : {})}>
      {parts}
    </group>
  );
}

function DoorView({ d }: { d: Door }) {
  const { go } = useScene();
  const { hot, handlers } = useHot(d.id, d.label, () => go(d.to));
  const glow = hot ? ACCENT : "#000000";
  return (
    <group position={d.at} rotation={[0, d.rotY, 0]} {...handlers}>
      {[[-0.5, 1.07, 0.08, 2.14], [0.5, 1.07, 0.08, 2.14], [0, 2.17, 1.08, 0.08]].map(([x, y, sx, sy], i) => (
        <mesh key={i} position={[x, y, 0.05]}><boxGeometry args={[sx, sy, 0.1]} /><meshStandardMaterial color={C.woodDark} emissive={glow} emissiveIntensity={hot ? 0.3 : 0} /></mesh>
      ))}
      <mesh position={[0, 1.05, 0.04]}><boxGeometry args={[0.92, 2.1, 0.05]} /><meshStandardMaterial color="#6a4c36" emissive={glow} emissiveIntensity={hot ? 0.22 : 0} /></mesh>
      {[0.55, 1.45].map((y) => (
        <mesh key={y} position={[0, y, 0.07]}><boxGeometry args={[0.7, 0.62, 0.01]} /><meshStandardMaterial color="#5c412e" /></mesh>
      ))}
      <mesh position={[0.36, 1.0, 0.1]}><sphereGeometry args={[0.035, 16, 12]} /><meshStandardMaterial color="#c9a24a" metalness={0.7} roughness={0.3} /></mesh>
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
