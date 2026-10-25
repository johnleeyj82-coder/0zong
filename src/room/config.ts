// 방 설정. 방은 의자 자리에서 찍은 360도 사진(equirectangular, 가로:세로 = 2:1)이다.
// 각도는 모두 도(°) 단위.
//   yaw   : 사진 가운데(가로 50%)가 0, 오른쪽으로 돌수록 +, 왼쪽으로 돌수록 −. 범위 −180 ~ 180.
//   pitch : 눈높이가 0, 위가 +, 아래가 −.
// 배치 모드에서 사진을 클릭하면 그 자리의 yaw / pitch가 나온다.

export const room = {
  // 처음 바라보는 방향
  startYaw: 90,
  startPitch: -5,
  pitchLimit: 80,
  fov: { start: 75, min: 35, max: 90 },
  // 화면 좌우로 최소한 보여줄 각도
  minHorizontalFov: 60,
}

// 시간대별 사진. 슬라이더 시간에 맞춰 가까운 두 장을 부드럽게 섞는다.
// lamp가 있으면 조명을 켰을 때 그 사진으로 바뀐다(주로 밤 사진에 둔다).
// 지금은 조립식 3D 방으로 만든 임시 사진이고, 실제 사진을 찍으면 같은 자리에 바꿔 넣는다.
export type PanoKey = { hour: number; src: string; lamp?: string }

export const panos: PanoKey[] = [
  { hour: 7.5, src: '/pano/sample-morning.jpg' },
  { hour: 12, src: '/pano/sample-noon.jpg' },
  { hour: 18.5, src: '/pano/sample-sunset.jpg' },
  { hour: 22, src: '/pano/sample-night.jpg', lamp: '/pano/sample-night-lamp.jpg' },
]

export type Hotspot = {
  id: string
  label: string
  description: string
  yaw: number
  pitch: number
  // 사진에서 물건이 차지하는 가로 / 세로 각도
  width: number
  height: number
}

export const hotspots: Hotspot[] = [
  {
    id: 'monitor-left',
    label: '왼쪽 모니터',
    description: '게임 기록과 피드',
    yaw: 67,
    pitch: -7,
    width: 40,
    height: 26,
  },
  {
    id: 'monitor-right',
    label: '오른쪽 모니터',
    description: '보안 공부 노트',
    yaw: 113,
    pitch: -9,
    width: 34,
    height: 22,
  },
  { id: 'screen', label: '걸이형 스크린', description: '내가 만든 영상', yaw: 90, pitch: 33, width: 60, height: 30 },
  { id: 'cards', label: '트럼프 카드', description: '홀덤', yaw: 6, pitch: -19, width: 8, height: 8 },
  { id: 'headset', label: '헤드셋', description: '좋아하는 소리와 음악', yaw: 14, pitch: -16, width: 8, height: 9 },
  { id: 'novel', label: '소설책', description: '내가 그린 소설 속 세계', yaw: 23, pitch: -17, width: 9, height: 12 },
  { id: 'posters', label: '포스터', description: '영화 기록', yaw: -113, pitch: 12, width: 38, height: 18 },
  { id: 'bed', label: '침대', description: '시간 정하고 자기', yaw: -59, pitch: -26, width: 70, height: 34 },
]

// yaw / pitch(도) → 카메라 기준 방향. tools/stitch.sh로 만든 사진과 같은 약속이다.
export function direction(yaw: number, pitch: number): [number, number, number] {
  const y = (yaw * Math.PI) / 180
  const p = (pitch * Math.PI) / 180
  return [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)]
}
