// GitHub 활용 도해 1장. 발표자료(docs/slides)와 같은 색·여백을 쓴다.
//
//   node docs/github/build.mjs          → docs/github/workflow.svg
//   PNG는 시스템 Chrome으로 따로 렌더한다 (아래 주석)
//
// 숫자를 고칠 일이 생기면 STEPS·FOOT 배열만 손대면 된다. 값의 출처는 README에 적어 뒀다.

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 1920
const H = 1080

// 발표자료에서 뽑은 값이다. 슬라이드 배경 #F8F6F0, 하단 밴드 #3A4C5C.
const C = {
  bg: '#F8F6F0',
  card: '#FFFFFF',
  band: '#3A4C5C',
  ink: '#16202E',
  sub: '#5A6673',
  mute: '#8A939E',
  line: '#DCD8CF',
  blue: '#2F5D8A',
  purple: '#5B4B8A',
  green: '#2E7D5B',
  amber: '#B7791F',
  slate: '#435668',
}

const FONT = "Pretendard, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif"

/** 다섯 단계. 작업 하나가 도는 한 바퀴다. */
const STEPS = [
  {
    no: '01', en: 'ISSUE', ko: '이슈로 연다', color: C.blue,
    num: '51', unit: '건',
    lines: ['역할 라벨과 담당자를 붙여', '무엇을 왜 하는지 먼저 적는다'],
  },
  {
    no: '02', en: 'BRANCH', ko: 'main에서 가른다', color: C.purple,
    num: '31', unit: '개',
    lines: ['feat/* · fix/* · docs/*', 'develop·release는 두지 않았다'],
  },
  {
    no: '03', en: 'PULL REQUEST', ko: 'PR로만 돌아온다', color: C.green,
    num: '52', unit: '건',
    lines: ['main에 직접 push하지 않는다', '이슈 하나에 PR 하나가 붙는다'],
  },
  {
    no: '04', en: 'ACTIONS', ko: '검증이 막아선다', color: C.amber,
    num: '22', unit: '회',
    lines: ['테스트·빌드가 빨간불이면', '이미지도 배포도 멈춘다'],
  },
  {
    no: '05', en: 'PROJECT', ko: '보드에 남는다', color: C.slate,
    num: '51', unit: '항목',
    lines: ['이슈가 닫히면 Done으로 간다', '남은 4건이 지금 할 일이다'],
  },
]

/** 하단 밴드 — 넷이 어떻게 나눠 가졌는지. */
const FOOT = [
  { name: '신민서', gh: '@siamin20', role: 'PM + AI', n: 11 },
  { name: '조종원', gh: '@develop-jw', role: 'DA + BE', n: 11 },
  { name: '정한결', gh: '@41ways', role: 'API + BE', n: 13 },
  { name: '박영서', gh: '@givpro22', role: 'FE + DevOps', n: 12 },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function text(x, y, s, { size = 24, weight = 400, fill = C.ink, anchor = 'start', spacing = 0 } = {}) {
  const ls = spacing ? ` letter-spacing="${spacing}"` : ''
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`
}

const parts = []
parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`)

// --- 머리말 -------------------------------------------------------------
parts.push(text(120, 108, 'GITHUB WORKFLOW', { size: 22, weight: 700, fill: C.mute, spacing: 3.5 }))
parts.push(text(120, 190, '이슈에서 시작해, 보드로 돌아옵니다', { size: 62, weight: 700 }))
parts.push(text(120, 244, '작업 하나가 이슈 · 브랜치 · PR · 검증 · 보드를 한 바퀴 돕니다. 3일 동안 51바퀴 돌았습니다.', { size: 27, fill: C.sub }))
parts.push(`<line x1="120" y1="292" x2="1800" y2="292" stroke="${C.line}" stroke-width="2"/>`)

// --- 다섯 단계 ----------------------------------------------------------
const CARD_Y = 350
const CARD_H = 372
const GAP = 40
const CARD_W = (W - 240 - GAP * 4) / 5

STEPS.forEach((s, i) => {
  const x = 120 + i * (CARD_W + GAP)
  parts.push(`<rect x="${x}" y="${CARD_Y}" width="${CARD_W}" height="${CARD_H}" rx="18" fill="${C.card}"/>`)
  // 카드 위 색 띠 — 단계마다 다른 색이 흐름을 읽게 한다
  parts.push(`<path d="M${x} ${CARD_Y + 18} a18 18 0 0 1 18 -18 h${CARD_W - 36} a18 18 0 0 1 18 18 v4 h-${CARD_W} z" fill="${s.color}"/>`)

  parts.push(`<circle cx="${x + 44}" cy="${CARD_Y + 68}" r="20" fill="${s.color}"/>`)
  parts.push(text(x + 44, CARD_Y + 76, s.no, { size: 19, weight: 700, fill: '#FFFFFF', anchor: 'middle' }))
  parts.push(text(x + 78, CARD_Y + 76, s.en, { size: 21, weight: 700, fill: s.color, spacing: 1.6 }))

  parts.push(text(x + 32, CARD_Y + 132, s.ko, { size: 30, weight: 700 }))

  parts.push(text(x + 32, CARD_Y + 232, s.num, { size: 74, weight: 700, fill: s.color }))
  const numW = String(s.num).length * 44
  parts.push(text(x + 32 + numW, CARD_Y + 232, s.unit, { size: 25, fill: C.mute }))

  parts.push(`<line x1="${x + 32}" y1="${CARD_Y + 266}" x2="${x + CARD_W - 32}" y2="${CARD_Y + 266}" stroke="${C.line}" stroke-width="1.5"/>`)
  s.lines.forEach((l, k) => {
    parts.push(text(x + 32, CARD_Y + 306 + k * 32, l, { size: 21, fill: C.sub }))
  })

  // 카드 사이 갈매기. 마지막 뒤에는 긋지 않는다
  if (i < STEPS.length - 1) {
    const cx = x + CARD_W + GAP / 2
    const cy = CARD_Y + CARD_H / 2
    parts.push(`<path d="M${cx - 7} ${cy - 11} l9 11 l-9 11" fill="none" stroke="${C.mute}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)
  }
})

// --- 하단 밴드 — R&R ----------------------------------------------------
const BY = 782
parts.push(`<rect x="120" y="${BY}" width="${W - 240}" height="180" rx="18" fill="${C.band}"/>`)
parts.push(text(160, BY + 52, '이슈를 넷이 고르게 나눠 가졌습니다', { size: 28, weight: 700, fill: '#FFFFFF' }))
parts.push(text(160, BY + 92, '커밋 수는 작업 성격에 따라 편차가 크지만, 이슈 수는 그렇지 않습니다. R&R의 근거는 이쪽입니다.', { size: 21, fill: '#C3CCD6' }))
parts.push(text(160, BY + 143, '라벨 11종 (역할 7 · 영역 4)   ·   커밋 171건   ·   2026.09.02 – 09.04', { size: 20, fill: '#8FA0AF' }))

const PW = 196
FOOT.forEach((p, i) => {
  const x = 1800 - (FOOT.length - i) * PW
  const w = PW - 16
  parts.push(`<rect x="${x}" y="${BY + 30}" width="${w}" height="120" rx="12" fill="#4B5F71"/>`)
  parts.push(text(x + 20, BY + 64, p.name, { size: 24, weight: 700, fill: '#FFFFFF' }))
  // 이슈 수는 이름 줄 오른쪽 끝에 붙인다. 계정 줄에 두면 긴 핸들과 겹친다
  parts.push(text(x + w - 20, BY + 64, p.n, { size: 26, weight: 700, fill: '#FFFFFF', anchor: 'end' }))
  parts.push(text(x + 20, BY + 92, p.role, { size: 18, fill: '#AFBECB' }))
  parts.push(text(x + w - 20, BY + 90, '이슈', { size: 15, fill: '#AFBECB', anchor: 'end' }))
  parts.push(text(x + 20, BY + 128, p.gh, { size: 17, fill: '#8FA0AF' }))
})

// --- 꼬리말 -------------------------------------------------------------
parts.push(text(120, 1024, '사내 생성형 AI 입력 보안·감사 게이트웨이  ·  github.com/givpro22/main-secure-prompt-gateway-', { size: 20, fill: C.mute }))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${parts.join('\n')}
</svg>
`

const out = join(dirname(fileURLToPath(import.meta.url)), 'workflow.svg')
writeFileSync(out, svg)
console.log('썼다:', out)

// PNG:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
//     --hide-scrollbars --force-device-scale-factor=2 --default-background-color=F8F6F0 \
//     --window-size=1920,1080 --screenshot=docs/github/workflow.png \
//     "file://$PWD/docs/github/workflow.svg"
