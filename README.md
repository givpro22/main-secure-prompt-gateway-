<div align="center">

<img src="docs/slides/01_title.png" alt="사내 생성형 AI 입력 보안·감사 게이트웨이" width="100%">

# 사내 생성형 AI 입력 보안·감사 게이트웨이

**직원의 프롬프트를 부서별 정책으로 검사하고, 판정 근거까지 남기는 AI-Ready 통제 서비스**

[![라이브](https://img.shields.io/badge/라이브-직원_AI_챗-2F5D8A?style=flat-square)](http://15.164.215.132/chat)
[![감사 콘솔](https://img.shields.io/badge/라이브-감사_콘솔-5B4B8A?style=flat-square)](http://15.164.215.132/admin/audit)
[![Swagger](https://img.shields.io/badge/API-Swagger_UI-2E7D5B?style=flat-square)](http://15.164.215.132/swagger-ui/index.html)
[![발표자료](https://img.shields.io/badge/발표자료-PDF_31장-C2452D?style=flat-square)](docs/presentation.pdf)

`Spring Boot 3.5` · `Java 21` · `PostgreSQL 16` · `Vue 3` · `Docker Compose` · `GitHub Actions` · `Ollama`

SKALA AI 웹 서비스 설계 미니프로젝트 · 4반 5조 · 2026.09.02 – 09.04

</div>

---

사내 구성원이 생성형 AI에 보내는 프롬프트를 **전송 전에** 검사해 개인정보·자격증명·기밀 정보 유출을 막는 게이트웨이입니다.

핵심 설계는 책임 경계입니다. **규칙 엔진은 결정하고(허용/마스킹/차단), AI는 제안만 합니다.** AI가 제시한 후보는 보안 담당자가 감사 콘솔에서 확정하기 전까지 어떤 판정도 되지 않습니다. 이 경계는 화면에서도, 스키마에서도 강제됩니다 — `aiAssessment`에는 `decision`·`block`·`allow`·`confidence` 필드가 아예 없습니다.

## 팀

SKALA AI 웹 서비스 설계 미니프로젝트 · 4반 5조. 역할명이 아니라 **완료할 산출물**로 나눴습니다 — 4명이 7개 역할을 겸임하되, 2일차 오전부터 병렬 작업이 가능하도록 축을 분리했습니다.

<table>
<tr>
<td align="center" width="25%"><a href="https://github.com/siamin20"><img src="https://avatars.githubusercontent.com/u/118173500?v=4" width="88" alt="신민서"><br><b>신민서</b></a><br><sub><a href="https://github.com/siamin20">@siamin20</a></sub></td>
<td align="center" width="25%"><a href="https://github.com/develop-jw"><img src="https://avatars.githubusercontent.com/u/133128395?v=4" width="88" alt="조종원"><br><b>조종원</b></a><br><sub><a href="https://github.com/develop-jw">@develop-jw</a></sub></td>
<td align="center" width="25%"><a href="https://github.com/41ways"><img src="https://avatars.githubusercontent.com/u/282542136?v=4" width="88" alt="정한결"><br><b>정한결</b></a><br><sub><a href="https://github.com/41ways">@41ways</a></sub></td>
<td align="center" width="25%"><a href="https://github.com/givpro22"><img src="https://avatars.githubusercontent.com/u/73772126?v=4" width="88" alt="박영서"><br><b>박영서</b></a><br><sub><a href="https://github.com/givpro22">@givpro22</a></sub></td>
</tr>
<tr>
<td align="center"><b>PM + AI</b></td>
<td align="center"><b>DA + BE</b></td>
<td align="center"><b>API + BE</b></td>
<td align="center"><b>FE + DevOps</b></td>
</tr>
</table>

| 이름 | GitHub | 역할 | 맡은 산출물 |
|---|---|---|---|
| **신민서** | [@siamin20](https://github.com/siamin20) | PM + AI | 기획 범위 · Use Case · Figma 화면 설계 · `MockAiInspector` |
| **조종원** | [@develop-jw](https://github.com/develop-jw) | DA + BE | ERD · Flyway 마이그레이션 · JPA 엔티티 · REST 명세 · 발표자료 |
| **정한결** | [@41ways](https://github.com/41ways) | API + BE | REST 명세 · JSON 스키마 · `@Async` 비동기 검토 · Review API |
| **박영서** | [@givpro22](https://github.com/givpro22) | FE + DevOps | Vue 화면 · CI/CD · GitHub 세팅 · E2E 통합 검증 |

## 목차

| | | |
|---|---|---|
| [왜 만들었나](#왜-만들었나) | [책임 경계](#규칙은-결정하고-ai는-제안하며-사람이-확정합니다) | [판정 4경로](#판정은-네-갈래로-갈립니다) |
| [실제 서비스](#실제-서비스) | [화면 설계](#화면-설계--figma-목업-11장) | [아키텍처](#아키텍처) |
| [비동기 검토](#ai가-늦어도-화면은-멈추지-않습니다) | [AI 검사기 성능](#ai-검사기는-얼마나-잡아내는가) | [데이터 모델](#데이터-모델) |
| [API](#api) | [실행](#실행) | [배포와 CI/CD](#배포) |
| [환경변수](#환경변수) | [데모 케이스](#데모-케이스) | [팀과 협업](#팀과-협업) |
| [팀](#팀) | [로드맵](#로드맵) | [문서](#문서) |

---

## 왜 만들었나

업무 AI 사용은 통제보다 빠르게 늘고 있습니다. 사용자는 3배, 프롬프트 입력량은 6배 늘었는데 개인 계정 기반의 Shadow AI는 47%가 그대로 남아 있습니다.

<img src="docs/slides/02_problem_adoption.png" alt="AI 사용 확산" width="100%">

그 결과 민감정보 전송은 이미 반복적으로 발생하고 있습니다. 평균 기업에서 **월 223건**의 GenAI 데이터 정책 위반이 탐지됐고, 전년 대비 2배입니다. 그런데 강제 가능한 보호 정책을 가진 기업은 절반뿐입니다.

<img src="docs/slides/03_problem_exposure.png" alt="민감정보 노출" width="100%">

<sub>출처 · Netskope Cloud and Threat Report 2026 — 전년 대비 기업 관측 데이터</sub>

**따라서 전면 차단이 아니라, 내용과 부서에 따른 세분화된 통제가 필요합니다.** 다섯 개의 문제를 다섯 개의 기능으로 옮겼습니다.

<img src="docs/slides/04_requirement_to_feature.png" alt="요구사항 → 기능" width="100%">

## 규칙은 결정하고, AI는 제안하며, 사람이 확정합니다

세 주체의 권한을 분리해 AI 오판이 곧바로 최종 판정이 되는 것을 막습니다.

<img src="docs/slides/05_responsibility_boundary.png" alt="RULE / AI / HUMAN 책임 경계" width="100%">

| 주체 | 하는 일 | 하지 않는 일 | 산출 |
|---|---|---|---|
| **RULE ENGINE** | 정규식·키워드·명단으로 4가지 경로 결정 | 맥락을 추론하거나 사람 대신 검토하지 않음 | `finalDecision` · `ruleResult` |
| **AI INSPECTOR** | 맥락형 위험 후보와 evidence 제안 | `ALLOW`/`BLOCK` 등 최종 `decision`을 만들지 않음 | `aiResult` · `findings(PENDING)` |
| **HUMAN REVIEW** | 후보를 ACCEPT / REJECT하고 최종 확정 | 정책 근거 없이 과거 기록을 덮어쓰지 않음 | `reviewStatus` · `reviewedBy` · `finalDecision` |

이 경계는 프롬프트로 지키는 것이 아니라 **구조로 강제합니다.**

<img src="docs/slides/10_design_rationale.png" alt="설계 근거" width="100%">

## 판정은 네 갈래로 갈립니다

같은 프롬프트라도 적용 규칙과 위험도에 따라 전송 방식과 HTTP 응답이 달라집니다. 여러 규칙이 동시에 매칭되면 `BLOCK > REVIEW > MASK > ALLOW` 순으로 가장 강한 조치 하나만 적용합니다.

<img src="docs/slides/07_decision_routes.png" alt="판정 4경로" width="100%">

| 응답 | 조건 | 동작 |
|---|---|---|
| `200 ALLOW` | 활성 규칙 매칭 없음 | 원문을 사내 LLM으로 전송 |
| `200 MASK` | MASK 규칙이 민감 구간 탐지 | 해당 구간을 라벨로 치환한 뒤 전송 |
| `202 REVIEW` | 맥락 검토가 필요한 규칙 매칭 | AI 후보 생성 후 사람의 확정 대기 |
| `403 BLOCK` | 차단 규칙 또는 금지 표현 매칭 | LLM 호출 전 전송을 즉시 중단 |

현재 시드된 정책은 4종(`P-PII` v5 · `P-SEC` v7 · `P-CONF` v2 · `P-EMBARGO` v1), 규칙은 14종이고, 부서 5개에 N:M으로 매핑돼 있습니다.

| 규칙 유형 | 개수 | 예 |
|---|---|---|
| `REGEX` | 9 | `PII-RRN-01` 주민등록번호 · `SEC-DBURL-02` DB 접속 문자열 · `SEC-PRIVIP-03` 사설 IP |
| `KEYWORD` | 3 | `CONF-CLIENT-01` 고객사 프로젝트 · `EMB-NOVA-01` 엠바고 |
| `ROSTER` | 2 | `PII-CUST-07` 고객 명단 전체 일치 · `PII-CUST-08` 이름 부분 일치 |

부서마다 적용 범위가 다릅니다 — 개발팀 3정책 13규칙, 영업팀 4정책 14규칙, 정보보안팀 2정책 11규칙.

## 실제 서비스

**http://15.164.215.132/chat** — AWS EC2에 Docker Compose로 올라가 있습니다. 아래 캡처는 목업이 아니라 그 배포본을 브라우저로 직접 조작한 결과이고, 여기 보이는 판정은 감사 콘솔의 이력에 실제로 남아 있습니다.

### SCR-01 직원 AI 챗

<img src="docs/screenshots/01_chat_home.jpg" alt="직원 AI 챗 초기 화면" width="100%">

<sub>김OO · 영업팀 계정. 헤더가 적용 정책 4건 · 규칙 14종을 알려주고, 우측 레일에 이 부서에 적용되는 정책 공지가 붙습니다.</sub>

<table>
<tr>
<td width="50%"><img src="docs/screenshots/02_chat_allow.jpg" alt="200 ALLOW"></td>
<td width="50%"><img src="docs/screenshots/03_chat_mask.jpg" alt="200 MASK"></td>
</tr>
<tr>
<td><b>200 ALLOW</b> — 규칙 0건. 원문 그대로 사내 LLM으로 나가고, 돌아온 답변은 <b>답변 재검사</b>를 한 번 더 통과합니다.</td>
<td><b>200 MASK</b> — <code>SEC-PRIVIP-03</code>이 사설 IP를 잡아 <code>[내부IP]</code>로 치환했습니다. 모델에 나간 것은 치환본뿐입니다.</td>
</tr>
<tr>
<td><img src="docs/screenshots/04_chat_block_embargo.jpg" alt="403 BLOCK"></td>
<td><img src="docs/screenshots/05_chat_review_ai_candidate.jpg" alt="202 REVIEW"></td>
</tr>
<tr>
<td><b>403 BLOCK</b> — <code>EMB-NOVA-01</code> 엠바고. <b>언제 풀리는지</b>(2026-09-20 해제)까지 알려주고 입력 원문은 그대로 남깁니다.</td>
<td><b>202 REVIEW</b> — AI 후보 <code>CONF-CLIENT-PROJECT</code>가 <b>읽기 전용</b>으로 표시됩니다. 직원 화면에는 ACCEPT/REJECT가 없습니다.</td>
</tr>
</table>

**ALLOW와 REVIEW는 같은 문장입니다.** `A사 차세대 프로젝트 오픈 일정이 언제였지?` — 영업팀에는 고객사 정책(`P-CONF`)이 매핑돼 있고 개발팀에는 없어서 결과가 갈립니다. 부서별 정책 적용이 화면에서 증명되는 자리입니다.

### SCR-02 관리자 감사 콘솔

<img src="docs/screenshots/06_audit_list.jpg" alt="감사 콘솔 목록" width="100%">

<sub>박OO · 정보보안팀 계정에서만 열립니다. 캡처 시점 기준 누적 220건 — 허용 116 / 마스킹 67 / 차단 25 / 검토 대기 12.</sub>

<img src="docs/screenshots/07_audit_detail.jpg" alt="감사 콘솔 상세" width="100%">

<sub>규칙이 확정한 finding에는 <code>확정(규칙)</code> 배지만 붙고 버튼이 없습니다. <b>ACCEPT / REJECT는 AI 후보에만 달립니다</b> — 정규식이 확정한 위반까지 재량으로 열면 통제 기록이 의미를 잃기 때문입니다.</sub>

> 전체 캡처 목록과 각 화면이 증명하는 것은 [`docs/screenshots/README.md`](docs/screenshots/README.md)에 있습니다.

## 화면 설계 — Figma 목업 11장

구현 화면을 찍은 것이 아닙니다. `docs/screen-spec.md`(Figma 작업 지침)만 보고 **구현 전에 그린 설계본**입니다. 벡터 SVG로 만들어 [Figma 파일](https://www.figma.com/design/w28oqCfDnsTz3jPwHFKvFZ)에 그대로 올라가 있고, 프레임 위에 전이 화살표 오버레이가 얹혀 있습니다.

<img src="docs/figma-mockups/contact-sheet.png" alt="Figma 목업 11장 컨택트 시트" width="100%">

<table>
<tr>
<td width="50%"><img src="docs/figma-mockups/png/04_block.png" alt="S4 차단"></td>
<td width="50%"><img src="docs/figma-mockups/png/07_ai_candidate.png" alt="S5-b 검토 대기"></td>
</tr>
<tr>
<td><code>SCR-01 / S4 차단</code> — 차단과 마스킹 규칙이 한 카드에 섞여도 최종 판정은 차단입니다.</td>
<td><code>SCR-01 / S5-b 검토 대기</code> — 직원 화면에 확정 버튼이 없다는 것을 설계 단계에서 못박았습니다.</td>
</tr>
<tr>
<td><img src="docs/figma-mockups/png/09_audit_detail_before.png" alt="SCR-02 상세 확정 전"></td>
<td><img src="docs/figma-mockups/png/11_user_flow.png" alt="User Flow"></td>
</tr>
<tr>
<td><code>SCR-02 / 상세 · 확정 전</code> — 규칙 finding에는 버튼이 없고 AI 후보에만 붙습니다.</td>
<td><code>Flow / User Flow</code> — 마지막 전이만 점선입니다. 폴링이 아니라 사람이 새로고침해야 넘어갑니다.</td>
</tr>
</table>

| 목업 | 실제 앱 | 왜 |
|---|---|---|
| 좌측 네비게이션 없음 | 좌측 사이드바 있음 | 명세 1장이 "헤더 중앙 탭 2개"로 고정 |
| 우측 알림 레일 없음 | 알림 레일 있음 | 명세에 없다. 구현 중 추가된 것 |
| 세션 판정 집계 없음 | 있음 | 〃 |

목업이 명세와 어긋나는 게 아니라, **앱이 명세보다 앞서 나가 있습니다.** 11장 전체와 색상 토큰·재생성 방법은 [`docs/figma-mockups/README.md`](docs/figma-mockups/README.md)에 있습니다.

## 아키텍처

프론트는 AI를 직접 호출하지 않습니다. 모든 요청은 Spring Boot의 정책 검사 경로를 통과합니다.

<img src="docs/slides/06_architecture.png" alt="서비스 아키텍처" width="100%">

| 계층 | 스택 | 역할 |
|---|---|---|
| **Frontend** | Vue 3 · Vite · Pinia · vue-router · axios | 사용자·관리자 화면. REST로만 요청하고 AI를 직접 부르지 않는다 |
| **Application** | Spring Boot 3.5.3 · Java 21 | REST API를 지나 모든 요청이 게이트웨이로 모인다 |
| **Gateway Core** | RuleEngine · ConflictResolver · Masker · RosterExpander | 부서 정책과 규칙으로 판정하고 근거를 기록한다 |
| **Data & AI** | PostgreSQL 16 · Flyway · Ollama(qwen2.5:7b) | 판정 근거는 DB에 남고, 모델 호출은 교체 가능한 확장 지점 뒤에 둔다 |

`AiInspector`는 인터페이스입니다. 프로파일만 바꾸면 구현체가 갈립니다 — `mock`은 `MockAiInspector`, `llm`은 사내 호스팅 Ollama를 부르는 `LlmAiInspector`. **코드 변경은 없습니다.**

## AI가 늦어도 화면은 멈추지 않습니다

`202`로 접수와 결과 조회를 분리하고, 최종 결정은 보안 담당자가 수행합니다.

<img src="docs/slides/09_async_review_flow.png" alt="비동기 검토 흐름" width="100%">

Use-Case로 보면 누가 요청하고, 누가 판정하며, 누가 확정하는지가 이렇게 갈립니다.

<img src="docs/slides/08_use_case.png" alt="Use Case" width="100%">

## AI 검사기는 얼마나 잡아내는가

REVIEW(202) 경로에서 후보를 제안하는 그 `AiInspector`입니다. 실제로 측정했습니다.

<img src="docs/slides/11_llm_benchmark.png" alt="로컬 LLM 성능 측정" width="100%">

| 지표 | 값 |
|---|---|
| **F1 (홀드아웃)** | **0.925** |
| 정밀도 | 0.974 |
| 재현율 | 0.881 |
| 오탐률 | 1.5% (정상 66건 중 1건) |
| 지연 | 문장당 1.1s |
| 모델 | `qwen2.5:7b-instruct` · temperature 0 |

측정 방식이 결론만큼 중요합니다.

- **검증셋을 세 층으로 나눴습니다.** 개발셋 326문장으로 프롬프트 변형을 고르고, 홀드아웃 111문장은 보고용으로 **1회만** 돌렸습니다. 튜닝한 셋으로 낸 F1 0.972가 아니라 **홀드아웃 F1 0.925를 보고합니다.**
- **프롬프트 MD5를 파일에 박아 동결했습니다**(`_workspace/golden/PROMPT_FROZEN.md5`). 다르면 점수를 무효 처리합니다.
- **개선 전후를 같은 홀드아웃으로 비교했습니다.** 정밀도 0.885 → 0.974, 재현율 0.511 → 0.822. 보통은 한쪽이 오르면 다른 쪽이 내려가는데 함께 올랐습니다.

재현 스크립트와 원 결과는 [`_workspace/golden/`](_workspace/golden/)에, 설계 변경 근거는 [`_workspace/05_로컬LLM_검증과_설계변경.md`](_workspace/05_로컬LLM_검증과_설계변경.md)에 있습니다.

## 데이터 모델

엔터티는 **무엇을 지키려고 나눴는지**로 갈랐습니다.

<img src="docs/slides/12_erd_entities.png" alt="ERD 엔터티 설계" width="100%">

엔터티를 나눈 것보다 **어떻게 이었는지**가 더 많은 것을 결정합니다.

<img src="docs/slides/13_erd_relations.png" alt="ERD 관계 설계" width="100%">

| 관계 | 카디널리티 | 이유 |
|---|---|---|
| `department` — `app_user` | 1:N | 겸직을 허용하면 판정 시점에 어느 정책을 적용할지 결정할 수 없다 |
| `department` — `policy` | N:M | `policy`에 `dept_id`를 두면 같은 정책을 부서 수만큼 복제해야 한다 |
| `policy` — `policy_rule` | 1:N | 정책을 끄면 규칙도 함께 멈춰야 한다 |
| `message` — `inspection` | 1:N | 지금은 INPUT 검사만 있어 사실상 1:1이지만 OUTPUT 검사 자리를 남겼다 |
| `inspection` — `inspection_finding` | 1:N | 규칙별로 근거를 남겨야 나중에 소명이 된다 |
| `policy_rule` — `inspection_finding` | 1:N nullable | **nullable이 RULE과 AI 출처를 한 테이블에서 구분한다** |
| `app_user` — `inspection_finding` | 1:N (`reviewed_by`) | 확정한 사람을 남기지 않으면 감사 기록이 성립하지 않는다 |

전체 ERD는 [`docs/erd.png`](docs/erd.png)이고, dbdiagram.io 원본은 [`docs/erd.dbml`](docs/erd.dbml)입니다. 실제 DDL과 시드는 Flyway가 기동 시 적용합니다 — `V1`~`V8`, 도메인 테이블 10개.

## API

Base URL은 `/api/v1`이고 모든 요청에 `X-User-Id`가 필요합니다.

<img src="docs/slides/14_api_spec.png" alt="API 명세" width="100%">

| 그룹 | 엔드포인트 |
|---|---|
| **참조** | `GET /departments` · `GET /users` · `GET /policies` |
| **검사** | `POST /messages` · `GET /inspections` · `GET /inspections/{id}` |
| **답변·출력 검사** | `POST /messages/{id}/answer` · `GET /messages/answer/available` · `POST /messages/{id}/response` |
| **사람 확정** | `PATCH /inspections/{id}/findings/{findingId}` |
| **마스킹 해제** | `POST /messages/{id}/unmask-request` · `GET /messages/{id}/unmask-request` · `GET /unmask-requests` · `POST /unmask-requests/{id}/decision` |

계약 규칙 4가지 — 목록 응답은 `{ items, page, size, total }`, 비동기는 `202 + Location + pollAfterMs`, **정책 403에는 `error.code`가 없고 권한 403에만 있으며**, 필드는 `lowerCamelCase` · UTC ISO-8601 · `null`을 지웁니다.

- 실행 가능한 컬렉션: [`docs/ai-gateway-v1.postman_collection.json`](docs/ai-gateway-v1.postman_collection.json)
- 전체 명세: [`docs/api-spec.md`](docs/api-spec.md) · [Swagger UI](http://15.164.215.132/swagger-ui/index.html)

## 구성

모노레포 1개입니다.

| 디렉터리 | 내용 |
|---|---|
| `backend/` | Spring Boot 3.5.3 · Java 21 · PostgreSQL · Flyway |
| `frontend/` | Vue 3 · Vite · Pinia · vue-router · axios |
| `docs/` | API 명세, Postman 컬렉션, ERD, 화면 명세, Figma 목업, 실제 서비스 캡처, 발표자료, 데모 스크립트 |
| `_workspace/` | 팀 산출물 (계약 확정본, 골든셋, QA 경계 매트릭스, LLM 검증 노트) |

화면은 2개입니다.

- **SCR-01 직원 AI 챗** `/chat` — 프롬프트 제출과 판정 결과 (허용 / 마스킹 / 차단 / 검토 대기)
- **SCR-02 관리자 감사 콘솔** `/admin/audit` — 판정 이력 조회와 AI 후보 확정 (정보보안팀 계정 전용)

## 요구 환경

| 항목 | 버전 |
|---|---|
| Java | 21 (Temurin OpenJDK 21.0.11 검증) |
| Node | 26.5.1 / npm 12.0.2 |
| PostgreSQL | 16 (Docker) |
| Docker | 29.6.2 |

Gradle은 설치할 필요가 없습니다. `backend/gradlew` 래퍼를 씁니다.

## 실행

### 1. 데이터베이스

```bash
docker run -d --name gateway-pg \
  -e POSTGRES_DB=gateway -e POSTGRES_USER=gateway -e POSTGRES_PASSWORD=gateway \
  -p 55432:5432 postgres:16-alpine
```

스키마와 시드는 Flyway가 애플리케이션 기동 시 적용합니다 (`backend/src/main/resources/db/migration/`).

### 2. 백엔드

```bash
cd backend
./gradlew bootRun
```

`http://localhost:8080`에서 기동합니다. API base path는 `/api/v1`이고, Swagger UI는 `http://localhost:8080/swagger-ui/index.html`입니다. AI 검사는 기본값 `mock` 프로파일에서 `MockAiInspector`가 담당하며, 실제 LLM 호출로 바꾸려면 `SPRING_PROFILES_ACTIVE=llm`으로 전환합니다 — 코드 변경은 없습니다.

첫 `./gradlew` 실행은 의존성 내려받기로 수 분이 걸릴 수 있습니다.

### 3. 프론트엔드

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`npm run build`로 프로덕션 번들을, `npm run preview`로 그 번들을 확인합니다.

**백엔드 없이 화면만 보려면:**

```bash
cd frontend
npm run dev:fixtures
```

Vite dev 서버가 `/api/v1`을 직접 응답하는 개발 전용 픽스처 서버(`frontend/dev/fixture-server.js`)를 켭니다. 판정 규칙·엠바고 만료·중첩 억제·2.5초 AI 지연까지 실제 계약대로 흉내 내므로 아래 데모 케이스가 그대로 동작합니다. 엠바고 기준일은 `GATEWAY_EMBARGO_REFERENCE_DATE`로 픽스처 서버에도 똑같이 먹입니다. 이 서버는 프로덕션 번들에 포함되지 않습니다.

## 배포

AWS EC2(ap-northeast-2, t3.micro) 한 대에 Docker Compose로 올립니다. 컨테이너는 3개(`db` · `backend` · `frontend`)이고, 외부에 여는 포트는 **80뿐**입니다 — PostgreSQL과 백엔드는 컴포즈 내부 네트워크에만 있습니다.

| 대상 | 주소 |
|---|---|
| SCR-01 직원 AI 챗 | http://15.164.215.132/chat |
| SCR-02 관리자 감사 콘솔 | http://15.164.215.132/admin/audit |
| Swagger UI | http://15.164.215.132/swagger-ui/index.html |
| API base | http://15.164.215.132/api/v1 |

`main`에 푸시하면 GitHub Actions가 자동으로 배포합니다 (아래 CI/CD). 다음은 인스턴스를 처음 세팅할 때만 필요한 절차입니다.

```bash
git clone https://github.com/givpro22/main-secure-prompt-gateway-.git
cd main-secure-prompt-gateway-
cp .env.example .env        # DB_PASSWORD만 바꾸면 됩니다
docker compose up -d --build
docker compose logs -f backend      # "Started GatewayApplication"
```

재배포는 `git pull && docker compose up -d --build`입니다. DB는 `db-data` 볼륨에 남으므로 판정 이력이 유지됩니다. 초기 시드 상태로 되돌리려면 `docker compose down -v`로 볼륨을 비웁니다.

### CI/CD

`.github/workflows/ci-cd.yml` 하나가 검증과 배포를 모두 맡습니다.

| 트리거 | 하는 일 |
|---|---|
| PR | 백엔드 테스트(Postgres 서비스 컨테이너) + 프론트 빌드 |
| `main` 푸시 | 위 검증 → GHCR 이미지 빌드·푸시 → EC2 배포 → 헬스 체크 |
| 수동 실행 | `Actions` 탭에서 `Run workflow` |

**빌드는 러너가, 서버는 pull만 합니다.** t3.micro에서 Gradle과 npm 빌드를 돌리면 스왑까지 써도 OOM으로 죽기 때문에, 이미지를 GHCR(`ghcr.io/givpro22/secure-prompt-gateway-{backend,frontend}`)에 올리고 EC2는 `docker compose pull && up -d`만 합니다. 배포 자체는 30초대에 끝납니다.

테스트는 `@SpringBootTest`라 실제 DB가 필요합니다. 러너에 `postgres:16` 서비스 컨테이너를 `55432`로 띄워 `application.yml` 기본값을 그대로 쓰므로 테스트 전용 설정 파일이 없습니다. 데모 케이스가 여기서 검증되니, 이 워크플로가 빨간색이면 발표가 위험한 상태입니다.

**최초 1회 설정** — 저장소 `Settings → Secrets and variables → Actions`에 시크릿 2개를 등록합니다.

| 시크릿 | 값 |
|---|---|
| `EC2_HOST` | `15.164.215.132` |
| `EC2_SSH_KEY` | `gateway-key.pem` 파일 내용 전체 (`-----BEGIN`부터 `-----END`까지) |

`gh` CLI를 쓴다면 두 줄입니다.

```bash
gh secret set EC2_HOST --body "15.164.215.132"
gh secret set EC2_SSH_KEY < ~/.ssh/gateway-key.pem
```

GHCR 패키지는 private으로 두어도 됩니다 — 배포 스텝이 `GITHUB_TOKEN`으로 서버에서 로그인한 뒤 곧바로 로그아웃합니다.

**롤백**은 서버에서 태그만 바꿔 다시 올립니다. 이미지는 커밋 SHA로도 태깅됩니다.

```bash
IMAGE_TAG=<되돌릴 커밋 SHA> docker compose up -d
```

배포 스텝은 서버에서 `git reset --hard origin/main`을 실행합니다. `.env`는 추적 대상이 아니라 그대로 남지만, 서버에서 직접 고친 추적 파일은 덮어써집니다.

### 구성 메모

- **프론트 번들에 API 주소를 굽지 않습니다.** nginx가 같은 오리진에서 `/api/v1`을 백엔드로 프록시하므로 이미지 빌드 시 `VITE_API_BASE=/api/v1`이 들어갑니다 (`docker-compose.yml`의 build args). IP나 도메인이 바뀌어도 프론트를 다시 빌드할 필요가 없고, 브라우저가 CORS를 타지 않습니다.
- **nginx는 백엔드가 죽어 있어도 기동합니다.** `proxy_pass`에 호스트명을 직접 쓰면 nginx가 기동 시점에 이름을 풀고 실패해 화면 자체가 뜨지 않습니다. resolver와 변수를 써서 요청 시점에 풀게 했으므로 그 경우 502만 반환합니다.
- **메모리 상한을 명시했습니다.** t3.micro는 1GiB뿐이라 JVM 기본 힙(물리 메모리의 1/4)에 맡기면 빌드·기동 중 OOM이 납니다. Gradle은 `--no-daemon -Xmx512m`, 애플리케이션은 `-Xmx384m`로 묶었고, 인스턴스에 스왑 2GB를 잡아두었습니다.
- **보안 그룹은 22(SSH, 내 IP)와 80(HTTP, 전체)만 엽니다.** 80이 닫혀 있으면 컨테이너가 정상이어도 브라우저에서 접속되지 않습니다 — 서버에서 `curl -I http://localhost/chat`이 200이면 원인은 보안 그룹입니다.

## 환경변수

코드에는 키·엔드포인트·모델명·임계값이 없습니다. 정책과 규칙은 DB에, 나머지는 환경변수에 있습니다.

### 백엔드 — 기본

| 환경변수 | 기본값 | 용도 |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:55432/gateway` | JDBC 접속 문자열 |
| `DB_USER` | `gateway` | DB 사용자 |
| `DB_PASSWORD` | `gateway` | DB 비밀번호 |
| `SPRING_PROFILES_ACTIVE` | `mock` | AI 구현체 선택 (`mock` / `llm`) |
| `SERVER_PORT` | `8080` | 백엔드 포트. 바꾸면 `VITE_API_BASE`와 `CORS_ALLOWED_ORIGINS`도 함께 조정 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Vite dev / preview |

### 백엔드 — AI 입력 검사 (`AiInspector`)

| 환경변수 | 기본값 | 용도 |
|---|---|---|
| `AI_PROVIDER` | `mock` | 문서상 스위치. 실제 빈 선택은 프로파일이 한다 |
| `AI_ENDPOINT` | `http://localhost:11434/api/chat` | 사내망 Ollama. 외부로 나가는 요청이 없다 |
| `AI_API_KEY` | (빈 값) | `llm` 프로파일 전용 |
| `AI_MODEL` | `qwen2.5:7b-instruct` | 2b는 골든셋에서 탈락. **7b가 하한** |
| `AI_TEMPERATURE` | `0` | 판정 재현성을 위해 0 고정 |
| `AI_MAX_TOKENS` | `800` | |
| `AI_TIMEOUT_MS` | `60000` | 7b 배치 1회가 약 9초. 첫 호출은 모델 로딩까지 포함 |
| `AI_MAX_INPUT_CHARS` | `4000` | 초과분은 절단하고 `missingContext`에 기록 |
| `AI_BATCH_SIZE` | `1` | **한 호출에 문장 하나.** 묶으면 같은 문장이 이웃에 따라 다른 판정을 받는다 |
| `AI_MOCK_DELAY_MS` | `2500` | Mock 응답 지연. **줄이지 마세요** — 202 비동기 설계가 화면에 드러나는 자리입니다 |
| `AI_MOCK_FAIL_KEYWORD` | `__FAIL__` | 실패 경로 검증용 |

### 백엔드 — 답변 받기와 출력 검사

마스킹본을 모델에 보내고 돌아온 답변을 한 번 더 검사합니다. **키가 비어 있으면 이 기능은 꺼지고** 화면은 503을 보고 붙여넣기 방식으로 물러납니다. 나가는 것은 `message.submitted_text`(마스킹본)뿐이고 원문은 어떤 경로로도 실리지 않습니다.

| 환경변수 | 기본값 | 용도 |
|---|---|---|
| `ANSWER_PROVIDER` | (빈 값) | `claude` / `openai` / `ollama`. 비우면 `ANSWER_ENDPOINT` 유무로 정한다 |
| `ANSWER_ENDPOINT` | (빈 값) | `openai`·`ollama` 제공자용 base URL |
| `ANSWER_API_KEY` | `${ANTHROPIC_API_KEY}` | |
| `ANSWER_MODEL` | `claude-opus-5` | `openai` 제공자는 쉼표로 여러 개. 앞이 과부하면 다음으로 넘어간다 |
| `ANSWER_MAX_TOKENS` | `4096` | 생각(thinking) 모델은 생각 토큰까지 이 상한에 들어간다 |
| `ANSWER_EFFORT` | `medium` | `low` / `medium` / `high` |
| `ANSWER_TIMEOUT_MS` | `60000` | |

### 백엔드 — 게이트웨이 동작

| 환경변수 | 기본값 | 용도 |
|---|---|---|
| `GATEWAY_MAX_INPUT_CHARS` | `50000` | 검사 대상 텍스트 최대 길이. 초과 시 400. 파일은 프론트에서 텍스트로 추출돼 이 경로로 들어온다 |
| `GATEWAY_POLL_INTERVAL_MS` | `2000` | 202 응답의 `pollAfterMs`로 나갑니다 |
| `GATEWAY_POLL_MAX_ATTEMPTS` | `30` | 프론트엔드 폴링 상한 |
| `GATEWAY_EMBARGO_REFERENCE_DATE` | (빈 값) | 엠바고 만료 판정 기준일. 비우면 실제 오늘. **리허설 전용** — 운영에서는 반드시 비운다 |

클라우드 DB로 옮길 때 바꾸는 것은 `DB_URL`·`DB_USER`·`DB_PASSWORD` 셋뿐이고 코드 변경은 없습니다.

### 프론트엔드

Vite 규칙상 `VITE_` 접두사가 붙은 값만 클라이언트에 노출됩니다.

| 환경변수 | 파일 | 값 | 용도 |
|---|---|---|---|
| `VITE_API_BASE` | `.env.development` | `http://localhost:8080/api/v1` | `npm run dev`가 쓰는 값. 코드에 URL을 하드코딩하지 않으므로 이 한 줄로 Postman Mock ↔ 로컬 BE ↔ 배포 환경을 전환합니다 |
| `VITE_API_BASE` | `.env.production` | `http://localhost:8080/api/v1` | `npm run build` / `npm run preview`가 쓰는 값. 실제 배포 시에는 빌드 시점에 주입해 덮어씁니다 |
| `VITE_API_BASE` | `.env.fixtures` | `/api/v1` | 픽스처 모드 (`npm run dev:fixtures`) |
| `VITE_API_BASE` | (빌드 ARG) | `/api/v1` | 컨테이너 빌드가 쓰는 값. `frontend/Dockerfile`의 `ARG VITE_API_BASE`로 주입되어 `.env.production`보다 우선합니다 |
| `VITE_FIXTURES` | `.env.fixtures` | `1` | 픽스처 서버 활성화. 이 값이 `1`일 때만 플러그인이 등록됩니다 |

## 데모 케이스

같은 설계가 네 가지 상황에서 다르게 작동합니다.

<img src="docs/slides/16_demo_scenarios.png" alt="데모 시나리오" width="100%">

계정 전환은 좌측 하단 계정 메뉴 → **계정 변경**에서 합니다. **계정에 따라 결과가 갈리는 것이 부서별 정책 적용의 증명입니다.**

| 케이스 | 계정 | 입력 문자열 | 기대 결과 |
|---|---|---|---|
| **A** | 이OO · 개발팀 | `이 에러 좀 봐줘. DB_URL=postgres://admin:p%40ss@10.0.3.21/prod 로 붙었는데 담당자 주민번호 900101-1234567 기준으로 조회하면 타임아웃 나` | **차단** (403) · 규칙 2건 (`SEC-DBURL-02`, `PII-RRN-01`) · 입력창에 원문 복원 |
| **B** | 김OO · 영업팀 | `A사 차세대 프로젝트 오픈 일정이 언제였지?` | **검토 대기** (202) → 스피너 → AI 후보 1건 → 감사 콘솔에서 ACCEPT → **차단** |
| **C** | 이OO · 개발팀 | `A사 차세대 프로젝트 오픈 일정이 언제였지?` | **허용** (200) · 규칙 0건 |
| **D** | 정OO · 인사팀 | `지원자 연락처 010-1234-5678 로 면접 안내 문자 초안 써줘` | **마스킹** (200) · `[전화번호]`로 치환 후 전송 |
| **E** | 이OO · 개발팀 | `docs/demo-files/2026_4Q_릴리스_백로그.xlsx` 추출 텍스트 | **차단** (403) · `EMB-NOVA-01` · "2026-09-20부터 공개 가능" |

**B와 C는 완전히 같은 문장입니다.** 영업팀에는 고객사 정책(`P-CONF`)이 매핑돼 있고 개발팀에는 없어서 결과가 갈립니다.

Case A에서 정규식은 4건 매칭되지만 화면에 표시되는 규칙은 2건입니다. 사설 IP(`SEC-PRIVIP-03`)와 이메일(`PII-EMAIL-04`)이 DB 접속 문자열 구간에 완전히 포함돼 중첩 억제되기 때문입니다. 같은 문자열을 두 규칙이 이중으로 세면 감사 화면의 위험 건수가 부풀려집니다.

Case B의 전체 흐름:

1. 김OO 계정으로 Case B 문자열 전송 → 보라 스피너 "보안 검토 중"
2. AI 후보 `CONF-CLIENT-PROJECT`가 **읽기 전용**으로 표시 (직원 화면에는 ACCEPT/REJECT가 없습니다)
3. 감사 콘솔로 이동 → 최상단 행 클릭 → AI 제안 섹션에서 **ACCEPT**
4. 챗 화면으로 돌아와 **결과 새로고침** → "최종 판정 차단 · 확정 주체 담당자"

AI 검사 실패 경로를 보려면 입력에 `__FAIL__`을 함께 넣습니다 (예: `A사 차세대 프로젝트 일정 __FAIL__`). 검토 대기 상태는 유지되고 "자동 검토 실패 — 담당자 확인 중"이 표시됩니다.

### Case E — 홍보팀 엠바고

개발팀이 4분기 릴리스 백로그를 넣고 "스프린트 계획 정리해줘"라고 하는 장면입니다. **유출 의도도 개인정보도 없습니다.** 그런데 외부 AI에 넣는 순간 그것은 공개이고, 백로그에는 홍보팀이 아직 열지 않은 제품명과 런칭 일정이 섞여 있습니다.

같은 엑셀 안에 제품이 둘 들어 있는데 하나만 걸립니다.

- `SKALA NOVA` — 해제일 2026-09-20. 아직 안 왔으므로 **차단**
- `SKALA ATLAS` — 해제일 2026-09-04. 이미 지났으므로 **통과**

부서로 갈리는 B/C와 같은 증명을 시간 축에서 한 번 더 하는 자리입니다. `embargo_until`은 "그 날부터 공개 가능"이라 경계일 당일에는 이미 풀린 것입니다.

숨긴 시트(`런칭_일정`)에 해제일이 그대로 적혀 있습니다. 본문 셀만 봤으면 놓쳤을 자리인데, 추출기가 전 시트를 읽어서 함께 검사됩니다.

발표 당일(2026-09-04) 전에 이 장면을 리허설하려면 기준일을 고정합니다.

```bash
GATEWAY_EMBARGO_REFERENCE_DATE=2026-09-04 ./gradlew bootRun
```

시연 파일은 `docs/demo-files/make_demo_xlsx.py`가 생성합니다 (seed 고정, **데이터 전부 합성**). 파일 A는 추출 텍스트 약 17,000자로 통과하고, 파일 B(`전체_제품_백로그_아카이브.xlsx`, 약 203,000자)는 `GATEWAY_MAX_INPUT_CHARS`를 넘겨 **검사 전에 거절**됩니다.

파일을 여는 것은 프론트엔드입니다. 백엔드는 추출된 텍스트만 보므로 **파일 형식 검증은 방어가 아니라 사용자 안내**입니다.

## 로드맵

작은 범위를 완성하고, 교체 가능한 AI 연결점을 남겼습니다.

<img src="docs/slides/17_roadmap.png" alt="확장 로드맵" width="100%">

발표 시점의 `NEXT`였던 **실제 AI 연결**(`LlmAiInspector`·사내 호스팅 모델)과 **`phase=OUTPUT` 답변 재검사**는 이후 구현되어 현재 배포본에 올라가 있습니다.

## 팀과 협업

구성원과 역할은 [팀](#팀)에 있습니다. 여기서는 넷이 어떻게 합쳤는지만 적습니다.

3일 프로젝트에서는 기능 수보다 `main`의 안정성이 더 중요합니다. `develop`·`release` 브랜치까지 두면 머지 경로만 늘어나므로 **`main`과 `feat/*` 둘로만** 운영해 통합 지점을 하나로 유지했습니다.

<img src="docs/slides/15_git_flow.png" alt="GitHub Flow" width="100%">

| 항목 | 규칙 |
|---|---|
| `main` | 항상 데모 가능한 상태를 유지합니다 |
| `feat/*` | 기능별 브랜치. PR 1인 리뷰 후 머지 |
| Feature Freeze | 2일차 17:00 이후 `main` 머지 금지 (버그 픽스 제외) |

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/presentation.pdf`](docs/presentation.pdf) | **발표자료 31장.** 이 README의 도해가 나온 원본 |
| [`docs/slides/`](docs/slides/) | 위 발표자료에서 뽑은 장면 18장 (PNG) |
| [`docs/screenshots/`](docs/screenshots/) | 배포본 실제 화면 캡처 7장 |
| [`docs/github/`](docs/github/) | GitHub 활용 캡처 5장과 숫자 (이슈·Projects·Actions) |
| [`docs/figma-mockups/`](docs/figma-mockups/) | 구현 전에 그린 화면 설계본 11장 (SVG + PNG) |
| [`docs/api-spec.md`](docs/api-spec.md) · [`docs/ai-gateway-v1.postman_collection.json`](docs/ai-gateway-v1.postman_collection.json) | API 명세와 실행 가능한 컬렉션 |
| [`docs/erd.png`](docs/erd.png) | ERD 이미지 (테이블 10개 · `V1`~`V7` 기준) |
| [`docs/erd.dbml`](docs/erd.dbml) | dbdiagram.io 원본 (Core 9 + Future 4) |
| [`docs/screen-spec.md`](docs/screen-spec.md) | 화면 명세 (프레임 8개, 컴포넌트별 데이터 경로) |
| [`docs/use-cases.md`](docs/use-cases.md) | Use-Case 상세 |
| [`docs/demo-script.md`](docs/demo-script.md) | 발표 진행 대본 |
| [`docs/demo-files/`](docs/demo-files/) | Case E 시연 엑셀과 생성 스크립트 |
| [`_workspace/01_api-ai-architect_contract-freeze.md`](_workspace/01_api-ai-architect_contract-freeze.md) | **API 계약 확정본.** 코드가 이 문서와 어긋나면 코드가 틀린 것 |
| [`_workspace/05_로컬LLM_검증과_설계변경.md`](_workspace/05_로컬LLM_검증과_설계변경.md) | 로컬 LLM 측정 결과와 그로 인한 설계 변경 5건 |
| [`_workspace/golden/`](_workspace/golden/) | 골든셋·홀드아웃 데이터와 재현 스크립트 |

<div align="center">

---

**AI를 막는 것이 아니라, 안전하게 쓸 수 있도록 통제합니다.**

`RULE DECIDES` · `AI SUGGESTS` · `HUMAN CONFIRMS`

</div>
