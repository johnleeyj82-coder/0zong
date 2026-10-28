// Example records for the movie room. Film facts (director, year, runtime) are real; the scores and watch dates are
// invented and every record is flagged `example` so the UI labels it "예시". Replace these with the owner's own records.
import type { Movie } from "./movies";

export const EXAMPLE_MOVIES: Movie[] = [
  { id: "ex-aftersun", title: "애프터썬", originalTitle: "Aftersun", year: 2022, director: "샬럿 웰스", genres: ["드라마"], runtime: 102,
    watchedAt: "2026-10-18", example: true,
    scores: { engagement: 21, aftertaste: 20, story: 18, character: 14, visual: 14, personal: 5 } },
  { id: "ex-perfect-days", title: "퍼펙트 데이즈", originalTitle: "Perfect Days", year: 2023, director: "빔 벤더스", genres: ["드라마"], runtime: 124,
    watchedAt: "2026-10-25", example: true,
    scores: { engagement: 20, aftertaste: 19, story: 17, character: 15, visual: 13, personal: 5 } },
  { id: "ex-decision-to-leave", title: "헤어질 결심", originalTitle: "Decision to Leave", year: 2022, director: "박찬욱", genres: ["미스터리", "로맨스"], runtime: 138,
    watchedAt: "2026-09-27", example: true,
    scores: { engagement: 22, aftertaste: 18, story: 17, character: 14, visual: 15, personal: 4 } },
  { id: "ex-past-lives", title: "패스트 라이브즈", originalTitle: "Past Lives", year: 2023, director: "셀린 송", genres: ["드라마", "로맨스"], runtime: 106,
    watchedAt: "2026-09-14", example: true,
    scores: { engagement: 19, aftertaste: 19, story: 16, character: 14, visual: 12, personal: 4 } },
  { id: "ex-dune-2", title: "듄: 파트 2", originalTitle: "Dune: Part Two", year: 2024, director: "드니 빌뇌브", genres: ["SF", "모험"], runtime: 166,
    watchedAt: "2026-10-02", example: true,
    scores: { engagement: 24, aftertaste: 13, story: 15, character: 12, visual: 15, personal: 4 } },
  { id: "ex-monster", title: "괴물", originalTitle: "Monster", year: 2023, director: "고레에다 히로카즈", genres: ["드라마"], runtime: 126,
    watchedAt: "2026-08-30", example: true,
    scores: { engagement: 18, aftertaste: 18, story: 18, character: 13, visual: 11, personal: 3 } },
  { id: "ex-zone-of-interest", title: "존 오브 인터레스트", originalTitle: "The Zone of Interest", year: 2023, director: "조너선 글레이저", genres: ["드라마", "역사"], runtime: 105,
    watchedAt: "2026-08-16", example: true,
    scores: { engagement: 13, aftertaste: 20, story: 16, character: 10, visual: 15, personal: 2 } },
  { id: "ex-across-the-spider-verse", title: "스파이더맨: 어크로스 더 유니버스", originalTitle: "Spider-Man: Across the Spider-Verse", year: 2023,
    director: "호아킴 도스 산토스 외", genres: ["애니메이션", "액션"], runtime: 140,
    watchedAt: "2026-07-29", example: true,
    scores: { engagement: 24, aftertaste: 12, story: 14, character: 13, visual: 15, personal: 4 } },
];
