/*
 * ERD를 그린다 — 마이그레이션 V1~V7의 실제 스키마 기준.
 *
 * dbdiagram.io에 붙여넣는 `docs/erd.dbml`과 같은 내용을 그림으로 낸다. 둘을 함께 두는 이유는
 * 쓰임이 달라서다 — DBML은 편집용이고 이 SVG는 제출·발표용이다. **어긋나면 마이그레이션이
 * 기준이다.**
 *
 * 테이블 10종은 전부 DDL이 있는 실제 테이블이다. 기획서 6.5의 Future 엔티티(attachment 등
 * 4종)는 그리지 않는다 — 있는 것과 없는 것이 한 장에 섞이면 어느 쪽이 도는 스키마인지
 * 알 수 없다. 그쪽은 erd.dbml에 논리 모델로만 남는다.
 *
 * 실행: node docs/erd-build.mjs
 * PNG:  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
 *         --disable-gpu --screenshot="docs/erd.png" --window-size=1900,1250 \
 *         --force-device-scale-factor=2 --default-background-color=ffffff \
 *         "file://$PWD/docs/erd.svg"
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/* 색상 토큰 — screen-spec.md 1.1 표. 화면과 문서가 같은 색을 쓴다 */
const T = {
  navy: '#16202E',
  blue: '#2F5D8A',
  purple: '#5B4B8A',
  green: '#2E7D5B',
  amber: '#B7791F',
  gray: '#6B7280',
  line: '#C9D0D9',
  card: '#F4F6F9',
  soft: '#EFF2F6',
}

/* 묶음. 헤더 색이 곧 그 테이블이 무슨 축에 속하는지다 */
const GROUP = {
  org: { color: T.blue, label: '조직·계정' },
  policy: { color: T.purple, label: '정책' },
  record: { color: T.green, label: '판정 기록' },
  human: { color: T.amber, label: '사람 개입' },
  data: { color: T.gray, label: '참조 데이터' },
}

const W = 300        // 테이블 상자 폭
const ROW = 19       // 컬럼 한 줄 높이
const HEAD = 34      // 헤더 높이
const PAD = 7        // 아래 여백

/*
 * 테이블 정의. 컬럼은 [이름, 타입, 배지] 이고 배지는 PK · FK · U(UNIQUE) · J(JSONB) 다.
 * 마이그레이션의 CREATE TABLE / ALTER TABLE을 그대로 옮긴 것이라, 스키마가 바뀌면 여기도 바꾼다.
 */
const TABLES = [
  {
    id: 'customer', group: 'data', x: 60, y: 150,
    title: 'customer', note: 'V5 · V6',
    cols: [
      ['customer_id', 'bigserial', 'PK'],
      ['name', 'varchar(50)', 'U'],
      ['given_name', 'varchar(50)'],
      ['given_name_detectable', 'boolean'],
      ['company', 'varchar(100)', 'U'],
      ['source', 'varchar(100)'],
      ['is_active', 'boolean'],
      ['created_at', 'timestamptz'],
    ],
  },
  {
    id: 'department', group: 'org', x: 440, y: 150,
    title: 'department', note: 'V1',
    cols: [
      ['dept_id', 'bigserial', 'PK'],
      ['code', 'varchar(20)', 'U'],
      ['name', 'varchar(50)'],
    ],
  },
  {
    id: 'department_policy', group: 'policy', x: 820, y: 150,
    title: 'department_policy', note: 'V1 · 교차 테이블',
    cols: [
      ['dept_id', 'bigint', 'PK FK'],
      ['policy_id', 'bigint', 'PK FK'],
      ['applied_at', 'timestamptz'],
    ],
  },
  {
    id: 'policy', group: 'policy', x: 1200, y: 150,
    title: 'policy', note: 'V1 · V3',
    cols: [
      ['policy_id', 'bigserial', 'PK'],
      ['code', 'varchar(20)', 'U'],
      ['name', 'varchar(100)'],
      ['category', 'varchar(20)'],
      ['version', 'int'],
      ['scope', 'varchar(20)'],
      ['owner_dept_id', 'bigint', 'FK'],
      ['is_active', 'boolean'],
      ['created_at', 'timestamptz'],
    ],
  },
  {
    id: 'policy_rule', group: 'policy', x: 1580, y: 150,
    title: 'policy_rule', note: 'V1 · V3 · V5',
    cols: [
      ['rule_id', 'bigserial', 'PK'],
      ['policy_id', 'bigint', 'FK'],
      ['code', 'varchar(30)', 'U'],
      ['rule_type', 'varchar(20)'],
      ['pattern', 'text'],
      ['action', 'varchar(20)'],
      ['mask_label', 'varchar(30)'],
      ['severity', 'varchar(10)'],
      ['obligation', 'varchar(20)'],
      ['source', 'varchar(100)'],
      ['description', 'varchar(200)'],
      ['embargo_until', 'date'],
      ['is_active', 'boolean'],
    ],
  },
  {
    id: 'app_user', group: 'org', x: 440, y: 620,
    title: 'app_user', note: 'V1',
    cols: [
      ['user_id', 'bigserial', 'PK'],
      ['dept_id', 'bigint', 'FK'],
      ['name', 'varchar(50)'],
      ['email', 'varchar(100)', 'U'],
      ['role', 'varchar(20)'],
      ['created_at', 'timestamptz'],
    ],
  },
  {
    id: 'message', group: 'record', x: 820, y: 620,
    title: 'message', note: 'V1',
    cols: [
      ['message_id', 'bigserial', 'PK'],
      ['user_id', 'bigint', 'FK'],
      ['original_text', 'text'],
      ['submitted_text', 'text'],
      ['status', 'varchar(20)'],
      ['created_at', 'timestamptz'],
    ],
  },
  {
    id: 'inspection', group: 'record', x: 1200, y: 620,
    title: 'inspection', note: 'V1',
    cols: [
      ['inspection_id', 'bigserial', 'PK'],
      ['message_id', 'bigint', 'FK'],
      ['phase', 'varchar(10)'],
      ['policy_snapshot', 'jsonb', 'J'],
      ['rule_result', 'jsonb', 'J'],
      ['ai_status', 'varchar(20)'],
      ['ai_result', 'jsonb', 'J'],
      ['final_decision', 'varchar(20)'],
      ['decided_by', 'varchar(10)'],
      ['created_at', 'timestamptz'],
      ['completed_at', 'timestamptz'],
    ],
  },
  {
    id: 'inspection_finding', group: 'record', x: 1580, y: 620,
    title: 'inspection_finding', note: 'V1',
    cols: [
      ['finding_id', 'bigserial', 'PK'],
      ['inspection_id', 'bigint', 'FK'],
      ['source', 'varchar(10)'],
      ['rule_id', 'bigint', 'FK'],
      ['code', 'varchar(30)'],
      ['category', 'varchar(20)'],
      ['span_start', 'int'],
      ['span_end', 'int'],
      ['action', 'varchar(20)'],
      ['rationale', 'text'],
      ['evidence', 'jsonb', 'J'],
      ['review_status', 'varchar(20)'],
      ['reviewed_by', 'bigint', 'FK'],
      ['reviewed_at', 'timestamptz'],
    ],
  },
  {
    id: 'unmask_request', group: 'human', x: 820, y: 960,
    title: 'unmask_request', note: 'V7',
    cols: [
      ['request_id', 'bigserial', 'PK'],
      ['message_id', 'bigint', 'FK U'],
      ['requester_id', 'bigint', 'FK'],
      ['reason', 'text'],
      ['status', 'varchar(20)'],
      ['decided_by_id', 'bigint', 'FK'],
      ['decided_at', 'timestamptz'],
      ['decision_note', 'text'],
      ['created_at', 'timestamptz'],
    ],
  },
]

const byId = Object.fromEntries(TABLES.map((t) => [t.id, t]))
const height = (t) => HEAD + t.cols.length * ROW + PAD
const right = (t) => t.x + W
const bottom = (t) => t.y + height(t)

/* 컬럼 i의 세로 중심. 관계선을 컬럼 높이에 정확히 붙인다 */
const rowY = (t, i) => t.y + HEAD + i * ROW + ROW / 2
const colY = (id, name) => {
  const t = byId[id]
  const i = t.cols.findIndex((c) => c[0] === name)
  if (i < 0) throw new Error(`${id}에 ${name} 컬럼이 없다`)
  return rowY(t, i)
}

/*
 * 관계. `d`는 SVG path이고 카디널리티 라벨을 양 끝에 붙인다.
 * 직교로만 꺾는다 — 사선은 어느 컬럼에 붙는 선인지 눈으로 따라가기 어렵다.
 */
const edges = [
  {
    from: 'department', to: 'app_user', a: '1', b: 'N', label: 'dept_id',
    d: () => {
      const x = byId.department.x + 110
      return `M ${x} ${bottom(byId.department)} V ${byId.app_user.y}`
    },
  },
  {
    from: 'department', to: 'department_policy', a: '1', b: 'N', label: 'dept_id',
    d: () => `M ${right(byId.department)} ${colY('department', 'dept_id')} H ${byId.department_policy.x}`,
  },
  {
    from: 'policy', to: 'department_policy', a: '1', b: 'N', label: 'policy_id',
    d: () => `M ${byId.policy.x} ${colY('policy', 'policy_id')} H ${right(byId.department_policy)}`,
  },
  {
    from: 'policy', to: 'policy_rule', a: '1', b: 'N', label: 'policy_id',
    d: () => `M ${right(byId.policy)} ${colY('policy', 'policy_id')} H ${byId.policy_rule.x}`,
  },
  {
    /* 소유 부서. 적용 부서(department_policy)와 방향이 반대라 위로 크게 돌린다 */
    from: 'policy', to: 'department', a: '0..N', b: '1', label: 'owner_dept_id · 만든 부서',
    dash: true,
    d: () => {
      const top = 118
      return `M ${byId.policy.x + 150} ${byId.policy.y} V ${top} H ${byId.department.x + 190} V ${byId.department.y}`
    },
  },
  {
    from: 'app_user', to: 'message', a: '1', b: 'N', label: 'user_id',
    d: () => `M ${right(byId.app_user)} ${colY('app_user', 'user_id')} H ${byId.message.x}`,
  },
  {
    from: 'message', to: 'inspection', a: '1', b: '1', label: 'message_id',
    d: () => `M ${right(byId.message)} ${colY('message', 'message_id')} H ${byId.inspection.x}`,
  },
  {
    from: 'inspection', to: 'inspection_finding', a: '1', b: 'N', label: 'inspection_id',
    d: () => `M ${right(byId.inspection)} ${colY('inspection', 'inspection_id')} H ${byId.inspection_finding.x}`,
  },
  {
    /* AI finding은 규칙을 참조하지 않는다 — 그래서 선택적 FK다 */
    from: 'policy_rule', to: 'inspection_finding', a: '1', b: '0..N', label: 'rule_id · RULE finding만',
    d: () => {
      const x = byId.policy_rule.x + 150
      return `M ${x} ${bottom(byId.policy_rule)} V ${byId.inspection_finding.y}`
    },
  },
  {
    /* 확정한 사람. 아래로 크게 돌아 붙는다 */
    from: 'app_user', to: 'inspection_finding', a: '1', b: '0..N', label: 'reviewed_by · 확정자',
    dash: true,
    d: () => {
      const low = 1240
      return `M ${byId.app_user.x + 200} ${bottom(byId.app_user)} V ${low} H ${byId.inspection_finding.x + 80} V ${bottom(byId.inspection_finding)}`
    },
  },
  {
    from: 'message', to: 'unmask_request', a: '1', b: '0..1', label: 'message_id · UNIQUE',
    d: () => {
      const x = byId.message.x + 120
      return `M ${x} ${bottom(byId.message)} V ${byId.unmask_request.y}`
    },
  },
  {
    from: 'app_user', to: 'unmask_request', a: '1', b: '0..N', label: 'requester_id · decided_by_id',
    d: () => {
      const y = colY('unmask_request', 'requester_id')
      return `M ${byId.app_user.x + 60} ${bottom(byId.app_user)} V ${y} H ${byId.unmask_request.x}`
    },
  },
]

/* ── 그리기 ─────────────────────────────────────────────────────────── */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function badge(kind, x, y) {
  const map = {
    PK: { fill: T.amber, text: 'PK' },
    FK: { fill: T.blue, text: 'FK' },
    U: { fill: T.gray, text: 'U' },
    J: { fill: T.purple, text: 'J' },
  }
  const b = map[kind]
  if (!b) return ''
  const w = b.text.length === 1 ? 13 : 19
  return `<rect x="${x}" y="${y - 7}" width="${w}" height="13" rx="2.5" fill="${b.fill}"/>`
    + `<text x="${x + w / 2}" y="${y + 2.5}" class="badge" text-anchor="middle">${b.text}</text>`
}

function drawTable(t) {
  const h = height(t)
  const g = GROUP[t.group]
  const out = []

  out.push(`<g>`)
  out.push(`<rect x="${t.x}" y="${t.y}" width="${W}" height="${h}" rx="5" fill="#fff" stroke="${T.line}" stroke-width="1.2"/>`)
  out.push(`<path d="M ${t.x} ${t.y + 5} a 5 5 0 0 1 5 -5 H ${right(t) - 5} a 5 5 0 0 1 5 5 V ${t.y + HEAD} H ${t.x} Z" fill="${g.color}"/>`)
  out.push(`<text x="${t.x + 12}" y="${t.y + 22}" class="tname">${esc(t.title)}</text>`)
  out.push(`<text x="${right(t) - 12}" y="${t.y + 22}" class="tnote" text-anchor="end">${esc(t.note)}</text>`)

  t.cols.forEach(([name, type, tags], i) => {
    const y = rowY(t, i)
    if (i % 2 === 1) {
      out.push(`<rect x="${t.x + 1}" y="${y - ROW / 2}" width="${W - 2}" height="${ROW}" fill="${T.soft}" opacity="0.55"/>`)
    }
    const marks = (tags || '').split(' ').filter(Boolean)
    let bx = t.x + 11
    for (const m of marks) {
      out.push(badge(m, bx, y))
      bx += (m.length === 1 ? 13 : 19) + 3
    }
    const isKey = marks.includes('PK')
    out.push(`<text x="${bx + 2}" y="${y + 3.5}" class="col${isKey ? ' key' : ''}">${esc(name)}</text>`)
    out.push(`<text x="${right(t) - 11}" y="${y + 3.5}" class="type" text-anchor="end">${esc(type)}</text>`)
  })

  out.push(`</g>`)
  return out.join('\n')
}

/* 관계선의 라벨은 경로 중간이 아니라, 꺾이지 않는 가장 긴 구간의 중앙에 둔다 */
function labelPoint(d) {
  const pts = []
  let cx = 0
  let cy = 0
  for (const seg of d.match(/[MHV]\s*[-\d.]+(\s+[-\d.]+)?/g)) {
    const k = seg[0]
    const n = seg.slice(1).trim().split(/\s+/).map(Number)
    if (k === 'M') [cx, cy] = n
    else if (k === 'H') cx = n[0]
    else cy = n[0]
    pts.push([cx, cy])
  }
  let best = [pts[0], pts[1] || pts[0]]
  let bestLen = -1
  for (let i = 1; i < pts.length; i++) {
    const len = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1])
    if (len > bestLen) {
      bestLen = len
      best = [pts[i - 1], pts[i]]
    }
  }
  const horizontal = best[0][1] === best[1][1]
  return {
    x: (best[0][0] + best[1][0]) / 2,
    y: (best[0][1] + best[1][1]) / 2,
    horizontal,
    start: pts[0],
    end: pts[pts.length - 1],
    second: pts[1] || pts[0],
    penult: pts[pts.length - 2] || pts[pts.length - 1],
  }
}

function drawEdge(e) {
  const d = e.d()
  const p = labelPoint(d)
  const out = []
  out.push(`<path d="${d}" fill="none" stroke="${T.blue}" stroke-width="1.4"`
    + `${e.dash ? ' stroke-dasharray="5 3"' : ''} opacity="0.75"/>`)

  /* 카디널리티 — 부모 쪽 끝에 a, 자식 쪽 끝에 b */
  const off = (from, to) => {
    const dx = Math.sign(to[0] - from[0])
    const dy = Math.sign(to[1] - from[1])
    return [from[0] + dx * 16 + (dx === 0 ? 9 : 0), from[1] + dy * 16 + (dy === 0 ? -6 : 4)]
  }
  const [ax, ay] = off(p.start, p.second)
  const [bx, by] = off(p.end, p.penult)
  out.push(`<text x="${ax}" y="${ay}" class="card" text-anchor="middle">${e.a}</text>`)
  out.push(`<text x="${bx}" y="${by}" class="card" text-anchor="middle">${e.b}</text>`)

  /* 라벨 배경을 깔아 선 위에 얹는다 */
  const tw = e.label.length * 6.1 + 10
  out.push(`<rect x="${p.x - tw / 2}" y="${p.y - 9}" width="${tw}" height="15" rx="3" fill="#fff" opacity="0.94"/>`)
  out.push(`<text x="${p.x}" y="${p.y + 2.5}" class="elabel" text-anchor="middle">${esc(e.label)}</text>`)
  return out.join('\n')
}

const CANVAS_W = 1940
const CANVAS_H = 1330

const legend = () => {
  const items = Object.values(GROUP)
  const parts = [`<g transform="translate(60, 60)">`]
  items.forEach((g, i) => {
    const x = i * 132
    parts.push(`<rect x="${x}" y="0" width="12" height="12" rx="2.5" fill="${g.color}"/>`)
    parts.push(`<text x="${x + 18}" y="10" class="legend">${esc(g.label)}</text>`)
  })
  const bx = items.length * 132 + 20
  const badges = [['PK', '기본키'], ['FK', '외래키'], ['U', 'UNIQUE'], ['J', 'JSONB']]
  let cx = bx
  badges.forEach(([k, label]) => {
    parts.push(badge(k, cx, 6))
    cx += (k.length === 1 ? 13 : 19) + 4
    parts.push(`<text x="${cx}" y="10" class="legend">${esc(label)}</text>`)
    cx += label.length * 12 + 14
  })
  parts.push(`</g>`)
  return parts.join('\n')
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
<style>
  text { font-family: "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif; fill: ${T.navy}; }
  .title { font-size: 25px; font-weight: 700; letter-spacing: -0.4px; }
  .sub { font-size: 13px; fill: ${T.gray}; }
  .legend { font-size: 12px; fill: ${T.gray}; }
  .tname { font-size: 14.5px; font-weight: 700; fill: #fff; font-family: "SF Mono", Menlo, monospace; }
  .tnote { font-size: 10.5px; fill: #fff; opacity: 0.72; }
  .col  { font-size: 12px; font-family: "SF Mono", Menlo, monospace; }
  .col.key { font-weight: 700; }
  .type { font-size: 10.5px; fill: ${T.gray}; font-family: "SF Mono", Menlo, monospace; }
  .badge { font-size: 8.5px; font-weight: 700; fill: #fff; font-family: "SF Mono", Menlo, monospace; }
  .card { font-size: 11.5px; font-weight: 700; fill: ${T.blue}; font-family: "SF Mono", Menlo, monospace; }
  .elabel { font-size: 10.5px; fill: ${T.blue}; }
  .note { font-size: 11.5px; fill: ${T.gray}; }
  .noteb { font-size: 11.5px; fill: ${T.navy}; font-weight: 700; }
</style>
<rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#fff"/>

<text x="60" y="38" class="title">ERD — 사내 생성형 AI 게이트웨이</text>
<text x="470" y="38" class="sub">테이블 10종 · 마이그레이션 V1~V7 기준 · 2026-09-03</text>
${legend()}

${edges.map(drawEdge).join('\n')}
${TABLES.map(drawTable).join('\n')}

<g transform="translate(60, ${bottom(byId.customer) + 26})">
  <rect x="0" y="0" width="300" height="76" rx="5" fill="${T.card}" stroke="${T.line}" stroke-width="1"/>
  <text x="14" y="21" class="noteb">FK가 없다</text>
  <text x="14" y="39" class="note">ROSTER 규칙(PII-CUST-07·08)의 pattern에</text>
  <text x="14" y="55" class="note">컬럼명만 있고, PolicyService가 판정 직전에</text>
  <text x="14" y="71" class="note">명단을 읽어 정규식으로 펼친다.</text>
</g>

<g transform="translate(1200, ${bottom(byId.unmask_request) - 96})">
  <rect x="0" y="0" width="330" height="96" rx="5" fill="${T.card}" stroke="${T.line}" stroke-width="1"/>
  <text x="14" y="21" class="noteb">JSONB 3개가 확장 지점이다</text>
  <text x="14" y="39" class="note">policy_snapshot이 판정 시점의 근거를 보존하고,</text>
  <text x="14" y="55" class="note">rule_result·ai_result가 원본 응답을 담는다.</text>
  <text x="14" y="75" class="noteb">AI 스키마가 바뀌어도 컬럼을 추가하지 않는다.</text>
</g>

<text x="60" y="${CANVAS_H - 22}" class="note">기획서 6.5의 Future 엔티티(attachment · knowledge_source · policy_audit · ai_provider_config)는 DDL이 없어 그리지 않았다 — 논리 모델은 docs/erd.dbml에 있다.   생성: node docs/erd-build.mjs</text>
</svg>
`

await writeFile(path.join(HERE, 'erd.svg'), svg, 'utf8')
console.log(`erd.svg — 테이블 ${TABLES.length}종 · 관계 ${edges.length}개`)
