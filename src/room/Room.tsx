import { RoundedBox, useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import { DoubleSide, MirroredRepeatWrapping, PlaneGeometry, SRGBColorSpace, type Texture } from 'three'
import { dims } from './config'
import type { Mood } from './timeOfDay'

const { W, L, H } = dims
const white = '#e9e6e1'
const deskTop = 0.73

function tex(t: Texture, rx = 1, ry = 1) {
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = MirroredRepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 8
  return t
}

// 사진 질감을 입힌 조립식 방. 치수는 config.ts의 dims를 따른다.
export function Room({ mood }: { mood: Mood }) {
  const t = useTexture({
    wall: '/tex/wallpaper.jpg',
    curtain: '/tex/curtain.jpg',
    wood: '/tex/wardrobe-wood.jpg',
    band: '/tex/wardrobe-band.jpg',
    topgun: '/tex/poster-topgun.jpg',
    marty: '/tex/poster-marty.jpg',
    love: '/tex/poster-possible-love.jpg',
    cards: '/tex/cards-front.jpg',
    novel: '/tex/novel-cover.jpg',
    mat: '/tex/deskmat.jpg',
  })
  const wallSide = useMemo(() => tex(t.wall.clone(), L / 0.9, H / 0.6), [t.wall])
  const wallEnd = useMemo(() => tex(t.wall.clone(), W / 0.9, H / 0.6), [t.wall])
  useMemo(() => {
    for (const k of ['curtain', 'wood', 'band', 'topgun', 'marty', 'love', 'cards', 'novel', 'mat'] as const) tex(t[k])
    t.curtain.repeat.set(4, 1)
  }, [t])

  // 커튼 주름: 평면을 사인파로 접는다.
  const curtainGeo = useMemo(() => {
    const g = new PlaneGeometry(W, H - 0.1, 160, 1)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 26) * 0.025)
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <group>
      {/* 바닥, 천장 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, L / 2]} receiveShadow>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#cbbfae" roughness={0.75} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[W / 2, H, L / 2]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#f2f0ec" />
      </mesh>

      {/* 벽: 포스터 벽(x=0), 모니터 벽(x=W), 옷장 쪽 벽(z=L) */}
      <mesh position={[0, H / 2, L / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[L, H]} />
        <meshStandardMaterial map={wallSide} roughness={0.9} />
      </mesh>
      <mesh position={[W, H / 2, L / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[L, H]} />
        <meshStandardMaterial map={wallSide} roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, L]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallEnd} roughness={0.9} />
      </mesh>

      {/* 창문 벽: 바깥 하늘 + 얇은 커튼 */}
      <mesh position={[W / 2, H / 2, -0.4]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color={mood.sky} toneMapped={false} />
      </mesh>
      <mesh geometry={curtainGeo} position={[W / 2, (H - 0.1) / 2, 0.06]}>
        <meshStandardMaterial
          map={t.curtain}
          color="#ffffff"
          emissive={mood.sky}
          emissiveIntensity={0.6 + mood.sunIntensity * 0.7}
          emissiveMap={t.curtain}
          transparent
          opacity={0.96}
          side={DoubleSide}
          roughness={1}
        />
      </mesh>

      {/* 커튼 레일 */}
      <mesh position={[W / 2, H - 0.04, 0.08]}>
        <boxGeometry args={[W, 0.08, 0.16]} />
        <meshStandardMaterial color="#efece6" />
      </mesh>

      <Bed />

      {/* 창가 작은 탁자 */}
      <Table x0={1.15} x1={1.6} z0={0.3} z1={0.75} h={0.6} />

      {/* 창가 책상과 물건들 */}
      <Table x0={1.95} x1={W - 0.02} z0={0.35} z1={0.95} h={deskTop} />
      <mesh position={[W - 0.24, deskTop + 0.1, 0.62]} castShadow>
        <boxGeometry args={[0.42, 0.2, 0.36]} />
        <meshStandardMaterial color="#e8e8e6" roughness={0.5} />
      </mesh>
      <group position={[2.08, deskTop + 0.035, 0.75]} rotation={[0, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.064, 0.02, 0.09]} />
          <meshStandardMaterial color="#b22a2a" />
        </mesh>
        <mesh position={[0, 0.0101, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.064, 0.09]} />
          <meshStandardMaterial map={t.cards} />
        </mesh>
      </group>
      <Headset position={[2.25, deskTop + 0.03, 0.6]} />
      <group position={[2.36, deskTop, 0.82]} rotation={[0, -0.3, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[i * 0.012, 0.022 + i * 0.044, -i * 0.01]} rotation={[0, i * 0.12, 0]} castShadow>
            <boxGeometry args={[0.15, 0.04, 0.22]} />
            <meshStandardMaterial color="#3a2e22" />
          </mesh>
        ))}
        <mesh position={[0.024, 0.155, -0.02]} rotation={[-Math.PI / 2, 0, 0.24]}>
          <planeGeometry args={[0.15, 0.22]} />
          <meshStandardMaterial map={t.novel} />
        </mesh>
      </group>

      {/* 모니터 책상 */}
      <Table x0={W - 0.62} x1={W - 0.02} z0={1.2} z1={2.5} h={deskTop} />
      <mesh position={[W - 0.3, deskTop + 0.003, 1.85]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} receiveShadow>
        <planeGeometry args={[0.9, 0.4]} />
        <meshStandardMaterial map={t.mat} roughness={0.95} />
      </mesh>
      <Monitor z={1.58} y={1.06} w={0.62} h={0.36} />
      <Monitor z={2.16} y={1.04} w={0.55} h={0.32} />
      <DeskLamp position={[W - 0.42, deskTop, 1.3]} />

      {/* 걸이형 스크린 */}
      <group position={[W - 0.03, 1.72, 1.85]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.24, 1.0]} />
          <meshStandardMaterial color="#20232a" />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[1.16, 0.96]} />
          <meshStandardMaterial color="#f4f4f2" roughness={0.9} />
        </mesh>
      </group>

      {/* 오른쪽 선반과 책 */}
      <Shelf />

      {/* 포스터 벽 */}
      <Poster map={t.topgun} z={3.15} y={1.7} />
      <Poster map={t.marty} z={2.6} y={1.55} />
      <Poster map={t.love} z={2.05} y={1.45} />

      {/* 옷장과 문 */}
      <Wardrobe wood={t.wood} band={t.band} />
      <mesh position={[2.45, 1.0, L - 0.005]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.8, 2.0]} />
        <meshStandardMaterial color="#efeae2" roughness={0.6} />
      </mesh>
    </group>
  )
}

function Table({ x0, x1, z0, z1, h }: { x0: number; x1: number; z0: number; z1: number; h: number }) {
  const w = x1 - x0
  const d = z1 - z0
  const legs: [number, number][] = [
    [x0 + 0.03, z0 + 0.03],
    [x1 - 0.03, z0 + 0.03],
    [x0 + 0.03, z1 - 0.03],
    [x1 - 0.03, z1 - 0.03],
  ]
  return (
    <group>
      <mesh position={[x0 + w / 2, h - 0.015, z0 + d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.03, d]} />
        <meshStandardMaterial color={white} roughness={0.55} />
      </mesh>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x, (h - 0.03) / 2, z]} castShadow>
          <boxGeometry args={[0.03, h - 0.03, 0.03]} />
          <meshStandardMaterial color="#d9d6d0" metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Bed() {
  return (
    <group>
      <mesh position={[0.55, 0.15, 1.0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.3, 2.0]} />
        <meshStandardMaterial color="#ece9e4" roughness={0.6} />
      </mesh>
      <RoundedBox args={[1.08, 0.2, 1.98]} radius={0.06} position={[0.55, 0.4, 1.0]} castShadow receiveShadow>
        <meshStandardMaterial color="#fbfbfa" roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[1.12, 0.08, 1.45]} radius={0.04} position={[0.56, 0.53, 1.28]} rotation={[0, 0, 0.02]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.12, 0.38]} radius={0.06} position={[0.5, 0.56, 0.28]} castShadow>
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </RoundedBox>
    </group>
  )
}

function Monitor({ z, y, w, h }: { z: number; y: number; w: number; h: number }) {
  return (
    <group position={[W - 0.32, y, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.025, h, w]} />
        <meshStandardMaterial color="#0d0d0e" roughness={0.4} />
      </mesh>
      <mesh position={[-0.0131, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[w - 0.012, h - 0.012]} />
        <meshStandardMaterial color="#050608" roughness={0.15} metalness={0.2} />
      </mesh>
      {/* 모니터 암 */}
      <mesh position={[0.06, -h / 2 - 0.08, 0]}>
        <boxGeometry args={[0.03, 0.22, 0.04]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.08, deskTop - y + 0.02, 0]}>
        <boxGeometry args={[0.12, 0.04, 0.12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  )
}

function DeskLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.012, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.024, 32]} />
        <meshStandardMaterial color="#f0ece2" />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 12]} />
        <meshStandardMaterial color="#f0ece2" />
      </mesh>
      <mesh position={[0.08, 0.43, 0]} rotation={[0, 0, Math.PI / 2 + 0.2]} castShadow>
        <boxGeometry args={[0.04, 0.3, 0.06]} />
        <meshStandardMaterial color="#f0ece2" />
      </mesh>
    </group>
  )
}

function Headset({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.02, -0.07]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
        <meshStandardMaterial color="#1b1c1e" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0.07]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 24]} />
        <meshStandardMaterial color="#1b1c1e" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.08, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#1b1c1e" />
      </mesh>
    </group>
  )
}

function Shelf() {
  const x = W - 0.15
  const books = ['#2b4a7a', '#c9c4b8', '#7a2b2b', '#d8a33a', '#3d3d3d', '#f0efe9', '#5b7a4a', '#a33b6b']
  return (
    <group>
      <mesh position={[x, deskTop + 0.5, 2.85]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.02, 0.8]} />
        <meshStandardMaterial color={white} />
      </mesh>
      <mesh position={[x, deskTop + 0.25, 2.46]} castShadow>
        <boxGeometry args={[0.3, 0.5, 0.02]} />
        <meshStandardMaterial color={white} />
      </mesh>
      <Table x0={W - 0.32} x1={W - 0.02} z0={2.45} z1={3.25} h={deskTop} />
      {books.map((c, i) => (
        <mesh key={i} position={[x, deskTop + 0.12 + (i % 3) * 0.01, 2.52 + i * 0.035]} castShadow>
          <boxGeometry args={[0.2, 0.24 + (i % 3) * 0.02, 0.03]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function Poster({ map, z, y }: { map: Texture; z: number; y: number }) {
  return (
    <mesh position={[0.006, y, z]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[0.42, 0.59]} />
      <meshStandardMaterial map={map} roughness={0.5} />
    </mesh>
  )
}

function Wardrobe({ wood, band }: { wood: Texture; band: Texture }) {
  const depth = 0.6
  const width = 1.9
  const doors = 4
  const dw = width / doors
  return (
    <group position={[0, 0, L - depth]}>
      <mesh position={[width / 2, H / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, H, depth]} />
        <meshStandardMaterial map={wood} roughness={0.7} />
      </mesh>
      {Array.from({ length: doors }, (_, i) => (
        <group key={i} position={[dw * i + dw / 2, 0, -0.002]}>
          <mesh position={[0, 1.38, 0]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[dw - 0.02, 0.16]} />
            <meshStandardMaterial map={band} roughness={0.9} />
          </mesh>
          <mesh position={[-dw / 2, H / 2, -0.001]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.004, H]} />
            <meshBasicMaterial color="#6b6155" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
