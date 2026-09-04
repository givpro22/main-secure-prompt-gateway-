# GitHub 활용 — 발표용 캡처와 숫자

"이슈랑 Projects를 썼다"는 말은 캡처 한 장으로는 증명이 안 된다. 이슈가 **PR로 이어졌고**, PR이 **CI를 통과해 main으로 갔고**, 그 결과가 **보드에 반영됐다**는 사슬이 보여야 한다. 아래 5장이 그 사슬을 순서대로 덮는다.

## 캡처 5장

| 파일 | 무엇이 보이는가 |
|---|---|
| `01_issue_detail.jpg` | 이슈 #118 하나. 역할 머리말·목표·구성·판단 구조, 담당자, 역할 라벨, **Projects 연결(Status Done)**, **Development에 연결된 PR** |
| `02_issue_list.jpg` | 이슈 51건 목록. Open 4 / Closed 47, 역할 라벨 색깔, 각 줄의 `⑂1`이 연결된 PR |
| `03_project_board.jpg` | Projects 보드. 담당자별로 갈린 51건과 Status |
| `04_actions.jpg` | Actions 실행 이력. PR마다 검증이 돌고 main 머지마다 파이프라인이 도는 것 |
| `05_contributors.jpg` | 사람별 커밋 수와 코드 증감 |

**한 장만 쓴다면 `01_issue_detail.jpg`다.** 이슈 하나에 역할·라벨·보드·PR이 전부 걸려 있어서 사슬 전체가 한 화면에 들어간다.

## 숫자

3일(2026-09-02 ~ 09-04) 기준이다.

| | |
|---|---|
| 이슈 | 51건 (닫힘 47 · 열림 4) |
| 머지된 PR | 52건 |
| 커밋 | 171건 (09-02 51 · 09-03 111 · 09-04 9) |
| 브랜치 | 31개. `main` + `feat/*`·`fix/*`·`docs/*`·`chore/*` |
| Actions 실행 | 22회 |
| 라벨 | 11종 (역할 7 · 영역 4) |

이슈 담당자는 41ways 13 · givpro22 12 · siamin20 11 · develop-jw 11로 갈렸다. **4명이 고르게 나눠 가졌다는 것이 R&R 슬라이드의 근거다** — 커밋 수는 사람마다 작업 성격이 달라 편차가 크지만 이슈 수는 그렇지 않다.

## 쓸 때 주의할 것 둘

**Projects의 Burn up 차트는 쓰지 않는다.** 보드를 3일차에 만들어서 51건이 전부 마지막 날 하루에 생기고 끝난 것처럼 그려진다. 실제 진행과 다르다.

**"PR 1인 리뷰" 문구는 근거가 없다.** 머지된 PR 52건 중 GitHub 리뷰 기록이 0건이다. 평가자가 PR 하나만 눌러도 리뷰 탭이 비어 있는 게 보인다. 슬라이드에서는 실제로 한 것 — 이슈로 나누고, 브랜치로 갈라고, PR로만 main에 넣고, CI가 막아섰다 — 로 바꿔 쓰는 편이 안전하다.

## 다시 찍기

전부 로그인 상태에서 아래 주소를 열어 찍은 것이다.

```
https://github.com/givpro22/main-secure-prompt-gateway-/issues/118
https://github.com/givpro22/main-secure-prompt-gateway-/issues?q=is%3Aissue+sort%3Acreated-asc
https://github.com/users/givpro22/projects/4
https://github.com/givpro22/main-secure-prompt-gateway-/actions
https://github.com/givpro22/main-secure-prompt-gateway-/graphs/contributors
```
