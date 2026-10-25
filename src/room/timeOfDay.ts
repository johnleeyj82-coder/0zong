import { Color } from 'three'

// 시간(0~24)에 따른 방 분위기. 실제 시간대 사진이 오면 이 표의 색을 사진에 맞춘다.
type Key = { hour: number; sky: string; ambient: number; sun: string; sunIntensity: number }

const keys: Key[] = [
  { hour: 0, sky: '#0b1020', ambient: 0.15, sun: '#6f83b8', sunIntensity: 0.05 },
  { hour: 5, sky: '#26304f', ambient: 0.2, sun: '#8a96c4', sunIntensity: 0.1 },
  { hour: 7, sky: '#cfe0f5', ambient: 0.75, sun: '#f4f7ff', sunIntensity: 1.2 },
  { hour: 12, sky: '#e6f0fb', ambient: 0.9, sun: '#fff8ec', sunIntensity: 1.6 },
  { hour: 16, sky: '#f3ead8', ambient: 0.8, sun: '#ffe2b0', sunIntensity: 1.4 },
  { hour: 18.5, sky: '#f7b98a', ambient: 0.6, sun: '#ffb070', sunIntensity: 1.3 },
  { hour: 20, sky: '#3a3556', ambient: 0.3, sun: '#8a7ab0', sunIntensity: 0.2 },
  { hour: 24, sky: '#0b1020', ambient: 0.15, sun: '#6f83b8', sunIntensity: 0.05 },
]

export type Mood = { hour: number; sky: Color; ambient: number; sun: Color; sunIntensity: number }

export function moodAt(hour: number): Mood {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < keys.length - 2 && keys[i + 1].hour <= h) i++
  const a = keys[i]
  const b = keys[i + 1]
  const t = (h - a.hour) / (b.hour - a.hour)
  return {
    hour: h,
    sky: new Color(a.sky).lerp(new Color(b.sky), t),
    ambient: a.ambient + (b.ambient - a.ambient) * t,
    sun: new Color(a.sun).lerp(new Color(b.sun), t),
    sunIntensity: a.sunIntensity + (b.sunIntensity - a.sunIntensity) * t,
  }
}

export function hourLabel(hour: number) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
