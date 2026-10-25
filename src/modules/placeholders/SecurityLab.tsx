// PHASE 1 임시 화면. 학습 기록 히트맵 모양만 보여준다. 칸의 진하기는 고정된 예시 값이다.
const fields = ['Crypto', 'Pwnable', 'Reversing', 'Web', 'System', 'CTF']
const WEEKS = 18

function sampleLevel(week: number, day: number) {
  // 무작위 대신 고정 식을 써서 새로고침해도 같은 모양이 나오게 한다.
  return (week * 7 + day * 3 + ((week * day) % 5)) % 5
}

export default function SecurityLab() {
  return (
    <div className="module-body">
      <p className="sample-note">히트맵은 예시 값이에요. 실제 학습 기록이 아니에요.</p>
      <div className="heatmap" role="img" aria-label="예시 학습 히트맵">
        {Array.from({ length: WEEKS }, (_, w) => (
          <div key={w} className="heat-col">
            {Array.from({ length: 7 }, (_, d) => (
              <span key={d} className={`heat l${sampleLevel(w, d)}`} />
            ))}
          </div>
        ))}
      </div>
      <ul className="tag-row">
        {fields.map((f) => (
          <li key={f} className="chip">
            {f}
          </li>
        ))}
      </ul>
      <p className="next-step">다음 단계: Markdown 노트, 문제 풀이 일지, 양방향 링크, 공개/비공개 분리 저장.</p>
    </div>
  )
}
