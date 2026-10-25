import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { CameraRig } from './room/CameraRig'
import { hotspots, room, type Hotspot } from './room/config'
import { Hotspots } from './room/Hotspots'
import { PanoSphere } from './room/PanoSphere'
import { hourLabel } from './room/time'

function nowHour() {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

export default function App() {
  const [hour, setHour] = useState(nowHour)
  const [lampOn, setLampOn] = useState(() => {
    const h = nowHour()
    return h < 7 || h > 18.5
  })
  const [focused, setFocused] = useState<Hotspot | null>(null)
  const [placing, setPlacing] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const dragged = useRef(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (!placing || dragged.current) return
    e.stopPropagation()
    // 클릭한 방향을 config.ts의 yaw / pitch(도)로 바꿔 보여준다.
    const d = e.point.clone().normalize()
    const yaw = (Math.atan2(d.x, -d.z) * 180) / Math.PI
    const pitch = (Math.asin(d.y) * 180) / Math.PI
    setPicked(`yaw: ${yaw.toFixed(0)}, pitch: ${pitch.toFixed(0)}`)
  }

  return (
    <>
      <Canvas
        flat
        linear
        camera={{ fov: room.fov.start, near: 0.1, far: 100, position: [0, 0, 0] }}
        onPointerMissed={() => !dragged.current && !placing && setFocused(null)}
      >
        <color attach="background" args={['#0d0c0b']} />
        <Suspense fallback={null}>
          <PanoSphere hour={hour} lampOn={lampOn} onPick={pick} />
        </Suspense>
        <Hotspots showBoxes={placing} focused={focused} onSelect={setFocused} dragged={dragged} />
        <CameraRig focused={focused} dragged={dragged} />
      </Canvas>

      <header className="hud top">
        <span className="brand">0zong의 방</span>
        <span className="hint">드래그해서 둘러보고, 휠로 확대하고, 물건에 마우스를 올려 보세요.</span>
      </header>

      <footer className="hud bottom">
        <label className="time">
          <span>{hourLabel(hour)}</span>
          <input type="range" min={0} max={24} step={0.25} value={hour} onChange={(e) => setHour(+e.target.value)} />
        </label>
        <button className={lampOn ? 'on' : ''} onClick={() => setLampOn(!lampOn)}>
          조명 {lampOn ? '켜짐' : '꺼짐'}
        </button>
        <button className={placing ? 'on' : ''} onClick={() => (setPlacing(!placing), setPicked(null))}>
          배치 모드
        </button>
        {placing && (
          <span className="picked">
            {picked ? `클릭한 방향 ${picked}` : '사진을 클릭하면 그 방향의 yaw / pitch가 나와요'}
          </span>
        )}
      </footer>

      {focused && (
        <aside className="panel">
          <button className="back" onClick={() => setFocused(null)}>
            ← 돌아가기 <kbd>ESC</kbd>
          </button>
          <h1>{focused.label}</h1>
          <p>{focused.description}</p>
          <p className="soon">콘텐츠는 다음 단계에서 붙어요.</p>
          <nav>
            {hotspots
              .filter((h) => h.id !== focused.id)
              .map((h) => (
                <button key={h.id} onClick={() => setFocused(h)}>
                  {h.label}
                </button>
              ))}
          </nav>
        </aside>
      )}
    </>
  )
}
