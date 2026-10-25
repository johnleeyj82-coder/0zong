// PHASE 1 임시 화면. 실제 게임 기록은 PHASE 3에서 데이터베이스와 연결한다.
const sample = [
  { title: '예시 게임 A', platform: 'PC', hours: 0, state: '진행 중' },
  { title: '예시 게임 B', platform: 'PC', hours: 0, state: '완료' },
  { title: '예시 게임 C', platform: '콘솔', hours: 0, state: '보관' },
]

export default function GameArchive() {
  return (
    <div className="module-body">
      <p className="sample-note">아래는 화면 구성을 확인하기 위한 예시 항목이에요. 실제 기록이 아니에요.</p>
      <ul className="row-list">
        {sample.map((g) => (
          <li key={g.title}>
            <span className="cover" aria-hidden />
            <span className="grow">
              <strong>{g.title}</strong>
              <small>
                {g.platform} · {g.hours}시간
              </small>
            </span>
            <span className="chip">{g.state}</span>
          </li>
        ))}
      </ul>
      <p className="next-step">다음 단계: 게임별 일지, 플레이 시간, 스크린샷, 태그 검색, Steam 연동 검토.</p>
    </div>
  )
}
