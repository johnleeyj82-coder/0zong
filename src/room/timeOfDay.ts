import { Color } from 'three'

// 시간(0~24)에 따른 방 분위기. 실제 시간대 사진이 오면 이 표의 색을 사진에 맞춘다.
type Key = { hour: number; tint: string; ambient: number; sun: string; sunIntensity: number }

const keys: Key[] = [
  { hour: 0, tint: '#4a5675', ambient: 0.15, sun: '#6f83b8', sunIntensity: 0.05 },
  { hour: 5, tint: '#5b6585', ambient: 0.2, sun: '#8a96c4', sunIntensity: 0.1 },
  { hour: 7, tint: '#e8eef8', ambient: 0.75, sun: '#f4f7ff', sunIntensity: 1.2 },
  { hour: 12, tint: '#ffffff', ambient: 0.9, sun: '#fff8ec', sunIntensity: 1.6 },
  { hour: 16, tint: '#fff2de', ambient: 0.8, sun: '#ffe2b0', sunIntensity: 1.4 },
  { hour: 18.5, tint: '#ffb877', ambient: 0.6, sun: '#ff9a4d', sunIntensity: 1.5 },
  { hour: 20, tint: '#7a6f8f', ambient: 0.3, sun: '#8a7ab0', sunIntensity: 0.2 },
  { hour: 24, tint: '#4a5675', ambient: 0.15, sun: '#6f83b8', sunIntensity: 0.05 },
]

export type Mood = { tint: Color; ambient: number; sun: Color; sunIntensity: number }

export function moodAt(hour: number): Mood {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < keys.length - 2 && keys[i + 1].hour <= h) i++
  const a = keys[i]
  const b = keys[i + 1]
  const t = (h - a.hour) / (b.hour - a.hour)
  return {
    tint: new Color(a.tint).lerp(new Color(b.tint), t),
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
