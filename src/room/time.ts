import { panos } from './config'

// 지금 시간에 섞을 사진 두 장(a, b)과 섞는 비율 t(0 = a만, 1 = b만).
// 마지막 사진 다음은 다시 첫 사진으로 이어진다(밤 → 아침).
export function panoBlend(hour: number) {
  const h = ((hour % 24) + 24) % 24
  const n = panos.length
  let i = n - 1
  for (let k = 0; k < n; k++) if (panos[k].hour <= h) i = k
  const j = (i + 1) % n
  const from = panos[i].hour
  const to = panos[j].hour + (j <= i ? 24 : 0)
  const at = h < from ? h + 24 : h
  const raw = n === 1 ? 0 : (at - from) / (to - from)
  // 사진 시각 근처에서는 그 사진을 오래 보여주고, 중간에서 빠르게 넘어간다.
  const t = raw * raw * (3 - 2 * raw)
  return { a: i, b: j, t }
}

export function hourLabel(hour: number) {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
