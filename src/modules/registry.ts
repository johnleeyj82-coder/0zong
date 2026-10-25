import CinemaArchive from './placeholders/CinemaArchive'
import GameArchive from './placeholders/GameArchive'
import SecurityLab from './placeholders/SecurityLab'
import type { ModuleDefinition, ModuleId } from './types'

// 콘텐츠 모듈 등록표. 방 렌더러는 이 표만 보고 패널을 연다.
export const modules: Record<ModuleId, ModuleDefinition> = {
  'game-archive': {
    moduleId: 'game-archive',
    title: 'GAME ARCHIVE',
    subtitle: '플레이한 게임과 기록',
    entry: 'monitor-zoom',
    permission: 'public',
    status: 'placeholder',
    Body: GameArchive,
  },
  'security-lab': {
    moduleId: 'security-lab',
    title: 'CYBERSECURITY KNOWLEDGE LAB',
    subtitle: '보안 공부 노트와 풀이 일지',
    entry: 'monitor-zoom',
    permission: 'public',
    status: 'placeholder',
    Body: SecurityLab,
  },
  'cinema-archive': {
    moduleId: 'cinema-archive',
    title: 'CINEMA ARCHIVE',
    subtitle: '본 영화와 평점',
    entry: 'poster-zoom',
    permission: 'public',
    status: 'placeholder',
    Body: CinemaArchive,
  },
}

export function getModule(id: ModuleId): ModuleDefinition {
  return modules[id]
}
