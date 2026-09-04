// GitHub 활용 도해 — 실제 화면을 박아 넣은 판. 브랜치·이슈·프로젝트 세 축을 한 장에 둔다.
//
//   node docs/github/build-evidence.mjs   → docs/github/evidence.svg
//
// crops/*.png는 GitHub 화면에서 의미 있는 영역만 잘라낸 것이다. 슬라이드에 통짜 캡처를
// 올리면 글씨가 안 보인다. 여기서는 잘라낸 것을 다시 박스에 맞춰 잘라(slice) 쓴다 —
// 어느 영역을 보여줄지는 PANELS의 s(배율)·offX·offY가 정한다.

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

const dataUri = (name) =>
  'data:image/png;base64,' + readFileSync(join(HERE, 'crops', name)).toString('base64')

/**
 * 세 축. 폭이 다른 이유는 원본 캡처의 비율이 달라서다 — 브랜치와 이슈는 세로로 긴
 * 목록이고 보드는 가로로 넓은 표다. 같은 폭에 욱여넣으면 보드에서 담당자 칸이 잘린다.
 */
const PANELS = [
  {
    w: 440, color: C.purple, en: 'BRANCH', ko: '브랜치로 나눈다',
    img: 'branches.png', iw: 780, ih: 974, offX: 0, offY: 0,
    caption: ['main + feat · fix · docs · ci · chore · test.', '31개 전부 PR을 거쳐서만 main으로 들어갔다.'],
  },
  {
    w: 440, color: C.blue, en: 'ISSUE', ko: '이슈로 추적한다',
    img: 'issues.png', iw: 1456, ih: 820, offX: 0, offY: 0,
    caption: ['역할 라벨을 붙여 열고, 닫힌 47 · 열린 4.', '줄마다 붙은 ⑂1이 그 이슈를 끝낸 PR이다.'],
  },
  {
    w: 760, color: C.green, en: 'PROJECT', ko: '보드로 확인한다',
    img: 'board.png', iw: 1568, ih: 594, offX: 1, offY: 0,
    caption: ['담당자와 상태가 한 화면에 선다. 이슈가 닫히면 Done으로 바뀐다.', '넷이 11 · 11 · 13 · 12로 나눠 가졌다.'],
  },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const text = (x, y, s, o = {}) => {
  const { size = 24, weight = 400, fill = C.ink, anchor = 'start', spacing = 0 } = o
  const ls = spacing ? ` letter-spacing="${spacing}"` : ''
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`
}

const defs = []
const parts = []
parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`)

parts.push(text(120, 106, 'GITHUB — BRANCH · ISSUE · PROJECT', { size: 22, weight: 700, fill: C.mute, spacing: 3.5 }))
parts.push(text(120, 186, '브랜치로 나누고, 이슈로 추적하고, 보드로 확인했습니다', { size: 58, weight: 700 }))
parts.push(text(120, 238, 'main은 항상 데모 가능한 상태로 두고, 작업은 전부 브랜치와 PR을 지나게 했습니다. 아래는 실제 저장소 화면입니다.', { size: 26, fill: C.sub }))
parts.push(`<line x1="120" y1="284" x2="1800" y2="284" stroke="${C.line}" stroke-width="2"/>`)

const PY = 330
const PH = 590
const IMG_H = 336
const GAP = 20
let px = 120

PANELS.forEach((p, i) => {
  const id = `clip${i}`
  const bx = px + 24
  const by = PY + 132
  const bw = p.w - 48

  // 박스를 채우도록 확대한 뒤 넘치는 만큼 잘라낸다 (CSS의 object-fit: cover와 같다)
  const s = Math.max(bw / p.iw, IMG_H / p.ih)
  const sw = p.iw * s
  const sh = p.ih * s
  const ix = bx - (sw - bw) * p.offX
  const iy = by - (sh - IMG_H) * p.offY

  defs.push(`<clipPath id="${id}"><rect x="${bx}" y="${by}" width="${bw}" height="${IMG_H}" rx="10"/></clipPath>`)

  parts.push(`<rect x="${px}" y="${PY}" width="${p.w}" height="${PH}" rx="18" fill="${C.card}"/>`)
  parts.push(`<path d="M${px} ${PY + 18} a18 18 0 0 1 18 -18 h${p.w - 36} a18 18 0 0 1 18 18 v4 h-${p.w} z" fill="${p.color}"/>`)

  parts.push(text(px + 28, PY + 62, p.en, { size: 21, weight: 700, fill: p.color, spacing: 1.6 }))
  parts.push(text(px + 28, PY + 106, p.ko, { size: 32, weight: 700 }))

  parts.push(`<g clip-path="url(#${id})"><image x="${ix}" y="${iy}" width="${sw}" height="${sh}" href="${dataUri(p.img)}" preserveAspectRatio="none"/></g>`)
  parts.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${IMG_H}" rx="10" fill="none" stroke="${C.frame}" stroke-width="1.5"/>`)

  p.caption.forEach((l, k) => {
    parts.push(text(px + 28, by + IMG_H + 46 + k * 32, l, { size: 21, fill: C.sub }))
  })

  px += p.w + GAP
})

// 하단 밴드 — 숫자는 도해(workflow.png)와 같은 값이다
const BY = 950
parts.push(`<rect x="120" y="${BY}" width="${W - 240}" height="86" rx="16" fill="${C.band}"/>`)
const facts = [
  ['이슈', '51'], ['브랜치', '31'], ['머지된 PR', '52'], ['CI 실행', '22'], ['커밋', '171'], ['기간', '3일'],
]
let fx = 168
facts.forEach(([k, v], i) => {
  parts.push(
    `<text x="${fx}" y="${BY + 54}" font-family="${FONT}">`
    + `<tspan font-size="34" font-weight="700" fill="#FFFFFF">${esc(v)}</tspan>`
    + `<tspan font-size="20" dx="10" fill="#AFBECB">${esc(k)}</tspan>`
    + `</text>`)
  fx += 200
  if (i < facts.length - 1) {
    parts.push(`<line x1="${fx - 34}" y1="${BY + 26}" x2="${fx - 34}" y2="${BY + 60}" stroke="#5B6E80" stroke-width="1.5"/>`)
  }
})
parts.push(text(1760, BY + 54, 'github.com/givpro22/main-secure-prompt-gateway-', { size: 19, fill: '#8FA0AF', anchor: 'end' }))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
${defs.join('\n')}
</defs>
${parts.join('\n')}
</svg>
`

const out = join(HERE, 'evidence.svg')
writeFileSync(out, svg)
console.log('썼다:', out, `(${Math.round(svg.length / 1024)}KB)`)
