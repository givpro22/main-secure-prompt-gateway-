// GitHub 활용 도해 — 브랜치·이슈·프로젝트를 한 줄에 두고 실제 화면을 박는다.
//
//   node docs/github/build-evidence.mjs   → docs/github/evidence.svg
//   PNG는 시스템 Chrome으로 렌더한다 (README 참조)
//
// 두 가지를 지킨다.
//   1. 캡처를 자르지 않는다. 통째로 넣고(contain) 박스를 이미지 비율에 맞춘다.
//   2. 셋을 같은 줄에 둔다. 그래서 칸 폭은 이미지 비율이 정한다 — 아래 layout()이
//      가로 예산을 비율대로 나눈다. 폭이 정해지면 이미지 높이가 셋 다 같아진다.
//
// 원본은 브라우저를 확대한 상태(브랜치 1.6 · 이슈 2.0 · 보드 1.3)에서 필요한 만큼만
// 잘라 찍었다. 행을 많이 담을수록 같은 폭에서 글자가 작아지므로 적게 담았다.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const W = 1920
const H = 1080
const MARGIN = 120
const GAP = 20
const PAD = 28 // 카드 좌우 안쪽 여백

const C = {
  bg: '#F8F6F0',
  card: '#FFFFFF',
  band: '#3A4C5C',
  chip: '#4B5F71',
  ink: '#16202E',
  sub: '#5A6673',
  mute: '#8A939E',
  frame: '#C9D0D9',
  blue: '#2F5D8A',
  purple: '#5B4B8A',
  green: '#2E7D5B',
}
const FONT = "Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"

const img = (n) => 'data:image/png;base64,' + readFileSync(join(HERE, 'crops', n)).toString('base64')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const text = (x, y, s, o = {}) => {
  const { size = 24, weight = 400, fill = C.ink, anchor = 'start', spacing = 0 } = o
  const ls = spacing ? ` letter-spacing="${spacing}"` : ''
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`
}

/** 세 칸. 캡처 원본 크기를 그대로 적는다 — 비율이 폭을 정하므로 이 숫자가 곧 레이아웃이다. */
const PANELS = [
  {
    color: C.purple, en: 'BRANCH', ko: '브랜치로 나눈다',
    file: 'branches.png', iw: 460, ih: 390,
    caption: ['main + feat · fix · docs · ci · chore · test.', '31개가 PR을 거쳐서만 main으로 들어갔다.'],
  },
  {
    color: C.blue, en: 'ISSUE', ko: '이슈로 추적한다',
    file: 'issues.png', iw: 1525, ih: 784,
    caption: ['역할 라벨을 붙여 열고 닫힌 47 · 열린 4.', '줄 끝의 ⑂1이 그 이슈를 끝낸 PR이다.'],
  },
  {
    color: C.green, en: 'PROJECT', ko: '보드로 확인한다',
    file: 'board.png', iw: 912, ih: 440,
    caption: ['이슈가 닫히면 카드가 Done으로 넘어간다.', '카드에 붙은 #99가 그 이슈를 끝낸 PR이다.'],
  },
]

/**
 * 가로 예산을 이미지 비율대로 나눈다. 이미지 높이 하나(imgH)가 정해지면 세 칸의
 * 폭이 전부 정해지고 그 합이 예산과 맞아떨어진다.
 */
function layout(panels, budget) {
  const ratios = panels.map((p) => p.iw / p.ih)
  const sum = ratios.reduce((a, b) => a + b, 0)
  const imgH = (budget - panels.length * PAD * 2 - (panels.length - 1) * GAP) / sum
  return { imgH, widths: ratios.map((r) => r * imgH + PAD * 2) }
}

const parts = []
parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`)

// --- 머리말 -------------------------------------------------------------
parts.push(text(MARGIN, 74, 'GITHUB — BRANCH · ISSUE · PROJECT', { size: 21, weight: 700, fill: C.mute, spacing: 3.5 }))
parts.push(text(MARGIN, 136, '브랜치로 나누고, 이슈로 추적하고, 보드로 확인했습니다', { size: 48, weight: 700 }))
parts.push(text(1800, 136, 'github.com/givpro22/main-secure-prompt-gateway-', { size: 20, fill: C.mute, anchor: 'end' }))
parts.push(text(MARGIN, 178, 'main은 항상 데모 가능한 상태로 두고, 작업은 전부 브랜치와 PR을 지나게 했습니다. 아래는 잘라내지 않은 실제 저장소 화면입니다.', { size: 24, fill: C.sub }))

// --- 세 칸 --------------------------------------------------------------
const RY = 248
const { imgH, widths } = layout(PANELS, W - MARGIN * 2)
const CARD_H = 108 + imgH + 22 + 74

let x = MARGIN
PANELS.forEach((p, i) => {
  const w = widths[i]
  parts.push(`<rect x="${x}" y="${RY}" width="${w}" height="${CARD_H}" rx="18" fill="${C.card}"/>`)
  parts.push(`<path d="M${x} ${RY + 18} a18 18 0 0 1 18 -18 h${w - 36} a18 18 0 0 1 18 18 v4 h-${w} z" fill="${p.color}"/>`)
  parts.push(text(x + PAD, RY + 54, p.en, { size: 20, weight: 700, fill: p.color, spacing: 1.6 }))
  parts.push(text(x + PAD, RY + 92, p.ko, { size: 28, weight: 700 }))

  const dw = w - PAD * 2
  const dy = RY + 108
  parts.push(`<rect x="${x + PAD - 5}" y="${dy - 5}" width="${dw + 10}" height="${imgH + 10}" rx="11" fill="#0D1117"/>`)
  parts.push(`<image x="${x + PAD}" y="${dy}" width="${dw}" height="${imgH}" href="${img(p.file)}"/>`)
  parts.push(`<rect x="${x + PAD - 5}" y="${dy - 5}" width="${dw + 10}" height="${imgH + 10}" rx="11" fill="none" stroke="${C.frame}" stroke-width="1.5"/>`)

  p.caption.forEach((l, k) => {
    parts.push(text(x + PAD, dy + imgH + 46 + k * 30, l, { size: 20, fill: C.sub }))
  })
  x += w + GAP
})

// --- 아래 띠: 한 바퀴 ----------------------------------------------------
const BY = RY + CARD_H + 32
const BH = 214
parts.push(`<rect x="${MARGIN}" y="${BY}" width="${W - MARGIN * 2}" height="${BH}" rx="18" fill="${C.band}"/>`)
parts.push(text(MARGIN + 36, BY + 50, '작업 하나가 이 순서로 한 바퀴를 돕니다', { size: 26, weight: 700, fill: '#FFFFFF' }))
parts.push(text(MARGIN + 36, BY + 84, '3일 · 커밋 171건 · 이슈 담당은 넷이 11 · 11 · 13 · 12로 나눠 가졌다', { size: 19, fill: '#AFBECB' }))

const STEPS = [
  ['이슈', '51', '건'], ['브랜치', '31', '개'], ['PR', '52', '건'], ['CI 검증', '22', '회'], ['보드', '51', '항목'],
]
const CW = 250
const CGAP = 32
let cx = W - MARGIN - 36 - (STEPS.length * CW + (STEPS.length - 1) * CGAP)
const cy = BY + 116
STEPS.forEach(([k, v, u], i) => {
  parts.push(`<rect x="${cx}" y="${cy}" width="${CW}" height="76" rx="12" fill="${C.chip}"/>`)
  parts.push(text(cx + 22, cy + 32, k, { size: 19, fill: '#C3CCD6' }))
  parts.push(
    `<text x="${cx + 22}" y="${cy + 64}" font-family="${FONT}">`
    + `<tspan font-size="30" font-weight="700" fill="#FFFFFF">${esc(v)}</tspan>`
    + `<tspan font-size="17" dx="8" fill="#AFBECB">${esc(u)}</tspan>`
    + `</text>`)
  cx += CW
  if (i < STEPS.length - 1) {
    const ax = cx + CGAP / 2
    parts.push(`<path d="M${ax - 6} ${cy + 27} l8 11 l-8 11" fill="none" stroke="#8FA0AF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)
    cx += CGAP
  }
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${parts.join('\n')}
</svg>
`
writeFileSync(join(HERE, 'evidence.svg'), svg)
console.log(`썼다: evidence.svg  이미지높이 ${Math.round(imgH)} · 칸 폭 ${widths.map((w) => Math.round(w)).join(' / ')}`)
