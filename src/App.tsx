import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CameraRig } from './room/CameraRig'
import { hotspots, room, type Hotspot } from './room/config'
import { Hotspots } from './room/Hotspots'
import { PlaceholderRoom } from './room/PlaceholderRoom'
import { RoomSplat, type SplatSource } from './room/RoomSplat'
import { hourLabel, moodAt } from './room/timeOfDay'

function nowHour() {
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}

// vite 개발 서버는 없는 파일에도 index.html을 돌려주므로 내용 종류로 확인한다.
async function hasSplat(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok && !(res.headers.get('content-type') ?? '').includes('text/html')
  } catch {
    return false
  }
}

export default function App() {
  const [source, setSource] = useState<SplatSource | null>(null)
  const [status, setStatus] = useState<'none' | 'loading' | 'ready' | 'error'>('none')
  const [hour, setHour] = useState(nowHour)
  const [focused, setFocused] = useState<Hotspot | null>(null)
  const [placing, setPlacing] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)
  const dragged = useRef(false)
  const mood = useMemo(() => moodAt(hour), [hour])

  useEffect(() => {
    hasSplat(room.splatUrl).then((ok) => {
      if (ok) {
        setStatus('loading')
        setSource({ url: room.splatUrl })
      }
    })
  }, [])

  // 스캔 파일(.spz, .ply 등)을 창에 끌어다 놓으면 바로 띄운다.
  useEffect(() => {
    const onDrop = async (e: DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer?.files[0]
      if (!file) return
      setStatus('loading')
      setSource({ bytes: await file.arrayBuffer(), name: file.name })
    }
    const onOver = (e: DragEvent) => e.preventDefault()
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onOver)
    return () => {
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onOver)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onLoaded = useCallback((ok: boolean) => setStatus(ok ? 'ready' : 'error'), [])

  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (!placing || dragged.current) return
    e.stopPropagation()
    const p = e.point
    setPicked(`[${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`)
  }

  const showSplat = source && status !== 'error'

  return (
    <>
      <Canvas
        camera={{ fov: 70, near: 0.01, far: 100, position: room.eye }}
        gl={{ antialias: false }}
        onPointerMissed={() => !dragged.current && !placing && setFocused(null)}
      >
        <color attach="background" args={[mood.tint.clone().multiplyScalar(0.15)]} />
        <ambientLight intensity={mood.ambient} />
        <directionalLight position={[-3, 2.5, 0.6]} color={mood.sun} intensity={mood.sunIntensity} />
        <group onClick={pick}>
          {showSplat ? <RoomSplat source={source} tint={mood.tint} onLoaded={onLoaded} /> : <PlaceholderRoom />}
        </group>
        <Hotspots showBoxes={placing} focused={focused} onSelect={setFocused} dragged={dragged} />
        <CameraRig focused={focused} dragged={dragged} />
      </Canvas>

      <header className="hud top">
        <span className="brand">0zong의 방</span>
        <span className="hint">
          {status === 'loading' && '방 불러오는 중…'}
          {status === 'error' && '스캔 파일을 읽지 못했어요. 임시 방을 보여줘요.'}
          {status === 'none' && '임시 방이에요. 스캔 파일(.spz, .ply)을 창에 끌어다 놓으면 바로 바뀌어요.'}
          {status === 'ready' && '드래그해서 둘러보고, 물체에 마우스를 올려 보세요.'}
        </span>
      </header>

      <footer className="hud bottom">
        <label className="time">
          <span>{hourLabel(hour)}</span>
          <input type="range" min={0} max={24} step={0.25} value={hour} onChange={(e) => setHour(+e.target.value)} />
        </label>
        <button className={placing ? 'on' : ''} onClick={() => (setPlacing(!placing), setPicked(null))}>
          배치 모드
        </button>
        {placing && <span className="picked">{picked ? `클릭한 좌표 ${picked}` : '방을 클릭하면 좌표가 나와요'}</span>}
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
