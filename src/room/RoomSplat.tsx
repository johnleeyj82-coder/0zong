import { useThree } from '@react-three/fiber'
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark'
import { useEffect, useState } from 'react'
import type { Color } from 'three'
import { room } from './config'

export type SplatSource = { url: string } | { bytes: ArrayBuffer; name: string }

// 실사 방 스플랫. Spark 렌더러를 씬에 붙이고 SplatMesh 하나를 띄운다.
export function RoomSplat({
  source,
  tint,
  onLoaded,
}: {
  source: SplatSource
  tint: Color
  onLoaded: (ok: boolean) => void
}) {
  const { gl, scene } = useThree()
  const [mesh, setMesh] = useState<SplatMesh | null>(null)

  useEffect(() => {
    const spark = new SparkRenderer({ renderer: gl })
    scene.add(spark)
    return () => {
      scene.remove(spark)
    }
  }, [gl, scene])

  useEffect(() => {
    const splat =
      'url' in source
        ? new SplatMesh({ url: source.url })
        : new SplatMesh({ fileBytes: source.bytes, fileName: source.name })
    splat.rotation.set(...room.splatRotation)
    splat.position.set(...room.splatPosition)
    splat.scale.setScalar(room.splatScale)
    let alive = true
    splat.initialized.then(
      () => alive && onLoaded(true),
      () => alive && onLoaded(false),
    )
    setMesh(splat)
    return () => {
      alive = false
      splat.dispose()
      setMesh(null)
    }
  }, [source, onLoaded])

  useEffect(() => {
    if (mesh) mesh.recolor = tint
  }, [mesh, tint])

  return mesh ? <primitive object={mesh} /> : null
}
