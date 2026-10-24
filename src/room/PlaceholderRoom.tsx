// 스캔이 오기 전까지 쓰는 임시 상자 방. 실사가 아니라 위치 감만 잡는 용도다.
export function PlaceholderRoom() {
  const wall = '#d9d4cc'
  return (
    <group>
      {/* 바닥, 천장 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]} receiveShadow>
        <planeGeometry args={[3.4, 3.2]} />
        <meshStandardMaterial color="#9c8a74" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.4, 0.4]}>
        <planeGeometry args={[3.4, 3.2]} />
        <meshStandardMaterial color="#efece6" />
      </mesh>
      {/* 벽 4개. 왼쪽 벽에 창문 구멍 대신 밝은 판 */}
      <mesh position={[0, 1.2, -1.2]}>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[0, 1.2, 2.0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[-1.7, 1.2, 0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[1.7, 1.2, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh position={[-1.69, 1.4, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.6, 1.2]} />
        <meshBasicMaterial color="#cfe3ff" toneMapped={false} />
      </mesh>

      {/* 책상 */}
      <mesh position={[0, 0.72, -0.82]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.04, 0.7]} />
        <meshStandardMaterial color="#5a4632" />
      </mesh>
      {/* 모니터 두 대 */}
      <mesh position={[-0.55, 1.15, -0.9]} castShadow>
        <boxGeometry args={[0.62, 0.36, 0.03]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.3, 1.1, -0.95]} rotation={[0, -0.25, 0]} castShadow>
        <boxGeometry args={[0.54, 0.31, 0.03]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {/* 큐브 */}
      <mesh position={[0.25, 0.775, -0.6]} castShadow>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color="#e2453c" />
      </mesh>
      {/* 포스터 */}
      <mesh position={[1.68, 1.55, 0.2]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.6, 0.88]} />
        <meshStandardMaterial color="#2c3e66" />
      </mesh>
      {/* 침대 */}
      <mesh position={[0.9, 0.25, 1.3]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.5, 1.2]} />
        <meshStandardMaterial color="#c9c2b8" />
      </mesh>
    </group>
  )
}
