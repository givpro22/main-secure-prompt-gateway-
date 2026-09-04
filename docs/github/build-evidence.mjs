// GitHub 활용 도해 — 실제 화면을 박아 넣은 판. 브랜치·이슈·프로젝트 세 축을 한 장에 둔다.
//
//   node docs/github/build-evidence.mjs   → docs/github/evidence.svg
//   PNG는 시스템 Chrome으로 렌더한다 (README 참조)
//
// 캡처는 자르지 않는다. 앞선 판은 박스 비율에 맞춰 잘라(cover) 넣었더니 이슈 제목과
// 보드의 Status 칸이 잘려 나갔다. 여기서는 통째로 넣고(contain) 박스 쪽을 이미지 비율에
// 맞춘다 — 그래서 세 칸의 폭이 서로 다르다.
//
// 원본 캡처는 브라우저를 확대(zoom 1.6/1.45/1.0)한 상태에서 필요한 행만 잘라 찍었다.
// 행을 많이 담을수록 글자가 작아진다. 슬라이드에서 읽히는 쪽을 택했다.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const W = 1920
const H = 1080

const C = {
  bg: '#F8F6F0',
  card: '#FFFFFF',
  band: '#3A4C5C',
  ink: '#16202E',
  sub: '#5A6673',
  mute: '#8A939E',
  line: '#DCD8CF',
  frame: '#C9D0D9',
  blue: '#2F5D8A',
  purple: '#5B4B8A',
  green: '#2E7D5B',
}
const FONT = "Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"

const img = (name) => 'data:image/png;base64,' + readFileSync(join(HERE, 'crops', name)).toString('base64')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const text = (x, y, s, o = {}) => {
  const { size = 24, weight = 400, fill = C.ink, anchor = 'start', spacing = 0 } = o
  const ls = spacing ? ` letter-spacing="${spacing}"` : ''
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`
}

/**
 * 카드 하나. 이미지는 박스 안에 통째로 들어가고(contain) 가로 가운데에 선다.
 * boxH만 정하면 폭은 이미지 비율이 정한다 — 잘라내지 않기 위해서다.
 */
function card({ x, y, w, h, color, en, ko, src, iw, ih, boxH, caption }) {
  const out = []
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${C.card}"/>`)
  out.push(`<path d="M${x} ${y + 18} a18 18 0 0 1 18 -18 h${w - 36} a18 18 0 0 1 18 18 v4 h-${w} z" fill="${color}"/>`)
  out.push(text(x + 28, y + 54, en, { size: 20, weight: 700, fill: color, spacing: 1.6 }))
  out.push(text(x + 28, y + 92, ko, { size: 27, weight: 700 }))

  const s = boxH / ih
  const dw = iw * s
  const dx = x + (w - dw) / 2
  const dy = y + 112
  out.push(`<rect x="${dx - 6}" y="${dy - 6}" width="${dw + 12}" height="${boxH + 12}" rx="12" fill="#0D1117"/>`)
  out.push(`<image x="${dx}" y="${dy}" width="${dw}" height="${boxH}" href="${src}"/>`)
  out.push(`<rect x="${dx - 6}" y="${dy - 6}" width="${dw + 12}" height="${boxH + 12}" rx="12" fill="none" stroke="${C.frame}" stroke-width="1.5"/>`)

  ;(caption || []).forEach((l, k) => {
    out.push(text(x + 28, dy + boxH + 44 + k * 30, l, { size: 20, fill: C.sub }))
  })
  return out.join('\n')
}

const parts = []
parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`)

// --- 머리말 -------------------------------------------------------------
parts.push(text(120, 70, 'GITHUB — BRANCH · ISSUE · PROJECT', { size: 21, weight: 700, fill: C.mute, spacing: 3.5 }))
parts.push(text(120, 128, '브랜치로 나누고, 이슈로 추적하고, 보드로 확인했습니다', { size: 48, weight: 700 }))
parts.push(text(120, 170, 'main은 항상 데모 가능한 상태로 두고, 작업은 전부 브랜치와 PR을 지나게 했습니다. 아래는 잘라내지 않은 실제 저장소 화면입니다.', { size: 24, fill: C.sub }))

// --- 윗줄: 브랜치 · 이슈 · 숫자 -----------------------------------------
const AY = 200
const AH = 340
parts.push(card({
  x: 120, y: AY, w: 400, h: AH, color: C.purple,
  en: 'BRANCH', ko: '브랜치로 나눈다',
  src: img('branches.png'), iw: 460, ih: 390, boxH: 230,
  caption: [],
}))
parts.push(card({
  x: 540, y: AY, w: 760, h: AH, color: C.blue,
  en: 'ISSUE', ko: '이슈로 추적한다',
  src: img('issues.png'), iw: 994, ih: 388, boxH: 230,
  caption: [],
}))

parts.push(`<rect x="1320" y="${AY}" width="480" height="${AH}" rx="18" fill="${C.band}"/>`)
parts.push(text(1352, AY + 56, '작업 하나가 한 바퀴를 돈다', { size: 24, weight: 700, fill: '#FFFFFF' }))
parts.push(text(1352, AY + 90, '이슈 → 브랜치 → PR → 검증 → 보드', { size: 19, fill: '#C3CCD6' }))
const facts = [['이슈', '51'], ['브랜치', '31'], ['머지된 PR', '52'], ['CI 실행', '22']]
facts.forEach(([k, v], i) => {
  const fx = 1352 + (i % 2) * 228
  const fy = AY + 168 + Math.floor(i / 2) * 76
  parts.push(
    `<text x="${fx}" y="${fy}" font-family="${FONT}">`
    + `<tspan font-size="36" font-weight="700" fill="#FFFFFF">${esc(v)}</tspan>`
    + `<tspan font-size="18" dx="9" fill="#AFBECB">${esc(k)}</tspan>`
    + `</text>`)
})
parts.push(text(1352, AY + 330, '3일 · 커밋 171건 · 넷이 고르게 나눔', { size: 18, fill: '#8FA0AF' }))

parts.push(text(120, AY + AH + 40, 'main + feat · fix · docs · ci · chore · test 접두사. 31개 전부 PR을 거쳐서만 main으로 들어갔다.', { size: 21, fill: C.sub }))
parts.push(text(120, AY + AH + 72, '이슈는 역할 라벨을 붙여 열고 닫힌 47 · 열린 4. 줄마다 붙은 ⑂1이 그 이슈를 끝낸 PR이다 — 이슈 하나에 PR 하나.', { size: 21, fill: C.sub }))

// --- 아랫줄: 보드 -------------------------------------------------------
const BY = 640
parts.push(card({
  x: 120, y: BY, w: 1680, h: 428, color: C.green,
  en: 'PROJECT', ko: '보드로 확인한다 — 담당자와 상태가 한 화면에 서고, 이슈가 닫히면 Done으로 바뀐다',
  src: img('board.png'), iw: 1055, ih: 295, boxH: 296,
  caption: [],
}))

// --- 꼬리말 -------------------------------------------------------------
parts.push(text(1800, 128, 'github.com/givpro22/main-secure-prompt-gateway-', { size: 20, fill: C.mute, anchor: 'end' }))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${parts.join('\n')}
</svg>
`

const out = join(HERE, 'evidence.svg')
writeFileSync(out, svg)
console.log('썼다:', out, `(${Math.round(svg.length / 1024)}KB)`)
