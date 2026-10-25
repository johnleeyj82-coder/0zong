import { useTexture } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BackSide, LinearFilter, type ShaderMaterial, type Texture } from 'three'
import { panos } from './config'
import { panoBlend } from './time'

// 카메라를 감싼 큰 구에 360도 사진을 입힌다. 시간대 사진 두 장과 각자의 조명 사진을 셰이더에서 섞는다.
// 사진 좌표는 config.ts의 direction()과 같은 약속을 쓴다.

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  #define PI 3.141592653589793
  uniform sampler2D texA;
  uniform sampler2D texB;
  uniform sampler2D lampA;
  uniform sampler2D lampB;
  uniform float mixAB;
  uniform float lampOn;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float yaw = atan(d.x, -d.z);
    float pitch = asin(clamp(d.y, -1.0, 1.0));
    vec2 uv = vec2(yaw / (2.0 * PI) + 0.5, pitch / PI + 0.5);
    // 밉맵을 끄고 쓰므로 경계(yaw = ±180°)에서 이음새가 생기지 않는다.
    vec3 a = mix(texture2D(texA, uv).rgb, texture2D(lampA, uv).rgb, lampOn);
    vec3 b = mix(texture2D(texB, uv).rgb, texture2D(lampB, uv).rgb, lampOn);
    vec3 c = mix(a, b, mixAB);
    gl_FragColor = vec4(c, 1.0);
  }
`

function prepare(t: Texture) {
  t.generateMipmaps = false
  t.minFilter = LinearFilter
  t.magFilter = LinearFilter
  t.anisotropy = 1
  t.needsUpdate = true
}

export function PanoSphere({
  hour,
  lampOn,
  onPick,
}: {
  hour: number
  lampOn: boolean
  onPick?: (e: ThreeEvent<MouseEvent>) => void
}) {
  const urls = useMemo(() => panos.flatMap((p) => [p.src, ...(p.lamp ? [p.lamp] : [])]), [])
  const textures = useTexture(urls, (ts) => (Array.isArray(ts) ? ts : [ts]).forEach(prepare))
  const byUrl = useMemo(() => new Map(urls.map((u, i) => [u, textures[i]])), [urls, textures])
  const mat = useRef<ShaderMaterial>(null)
  const lamp = useRef(lampOn ? 1 : 0)

  const uniforms = useMemo(
    () => ({
      texA: { value: textures[0] },
      texB: { value: textures[0] },
      lampA: { value: textures[0] },
      lampB: { value: textures[0] },
      mixAB: { value: 0 },
      lampOn: { value: 0 },
    }),
    [textures],
  )

  useFrame((_, delta) => {
    const m = mat.current
    if (!m) return
    const { a, b, t } = panoBlend(hour)
    // 조명 사진이 없는 시간대는 조명을 켜도 원래 사진 그대로다.
    m.uniforms.texA.value = byUrl.get(panos[a].src)
    m.uniforms.texB.value = byUrl.get(panos[b].src)
    m.uniforms.lampA.value = byUrl.get(panos[a].lamp ?? panos[a].src)
    m.uniforms.lampB.value = byUrl.get(panos[b].lamp ?? panos[b].src)
    m.uniforms.mixAB.value = t
    lamp.current += ((lampOn ? 1 : 0) - lamp.current) * (1 - Math.exp(-delta * 5))
    m.uniforms.lampOn.value = lamp.current
  })

  return (
    <mesh onClick={onPick} renderOrder={-1}>
      <sphereGeometry args={[50, 96, 48]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        side={BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
