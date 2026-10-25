'use client'

import dynamic from 'next/dynamic'

// 3D 장면은 브라우저에서만 그린다. 서버 HTML에는 로딩 문구가 먼저 나가서 첫 화면이 비지 않는다.
const RoomExperience = dynamic(() => import('@/room/RoomExperience'), {
  ssr: false,
  loading: () => (
    <div className="loading" role="status">
      <span>방 불러오는 중</span>
    </div>
  ),
})

export default function RoomLoader() {
  return <RoomExperience />
}
