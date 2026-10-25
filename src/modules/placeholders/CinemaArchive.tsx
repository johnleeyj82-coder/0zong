// PHASE 1 임시 화면. 벽에 걸린 포스터 사진 3장만 보여준다. 평점과 감상은 아직 비어 있다.
const posters = [
  { src: '/tex/poster-topgun.jpg', alt: '벽 포스터 1' },
  { src: '/tex/poster-marty.jpg', alt: '벽 포스터 2' },
  { src: '/tex/poster-possible-love.jpg', alt: '벽 포스터 3' },
]

export default function CinemaArchive() {
  return (
    <div className="module-body">
      <p className="sample-note">방 사진에서 잘라 낸 포스터예요. 평점과 감상은 아직 입력 전이에요.</p>
      <ul className="poster-grid">
        {posters.map((p) => (
          <li key={p.src}>
            <img src={p.src} alt={p.alt} width={140} height={197} />
            <small>평점 미입력</small>
          </li>
        ))}
      </ul>
      <p className="next-step">
        다음 단계: 0~5점 평점, 리뷰, 보고 싶은 영화 목록. `0zong-cinema` 저장소는 아직 확인하지 못했어요.
      </p>
    </div>
  )
}
