# 시연 영상 6편

배포본(http://15.164.215.132/chat)을 실제로 조작해 녹화한 것이다. 여섯 편이 게이트웨이의 네 경로와 그 뒤에 붙는 사람 개입 두 가지를 한 번씩 덮는다.

| # | 장면 | 무엇을 증명하는가 | 길이 |
|---|---|---|---|
| 1 | [기본 통과](01-allow.gif) | 규칙에 걸리지 않으면 원문 그대로 나가고 답변이 돌아온다 | 13초 |
| 2 | [차단 후 수정해서 통과](02-block-then-fix.gif) | 차단은 막고 끝내지 않는다. 무엇이 걸렸는지 알려주고 고쳐서 다시 보내면 통과한다 | 20초 |
| 3 | [부서별 정책 차이](03-dept-policy-diff.gif) | **같은 문장인데 부서가 다르면 결과가 갈린다** | 23초 |
| 4 | [엠바고 차단·해제](04-embargo.gif) | 같은 표현이 해제일 전에는 차단, 지난 뒤에는 통과 | 25초 |
| 5 | [오탐 마스킹 해제 요청](05-unmask-request.gif) | 부품 코드를 전화번호로 오탐 → 직원이 해제 요청 → 담당자가 승인 | 38초 |
| 6 | [답변 재검사](06-output-recheck.gif) | 나갈 때 통과한 프롬프트라도 **돌아온 답변**에서 다시 걸릴 수 있다 | 39초 |

## 두 가지 형식

**GIF**는 README에서 클릭 없이 바로 돌아간다. 폭 1300px · 12fps · 160색으로 줄였다. 화면에 글자가 많아 폭을 더 낮추면 읽히지 않는다.

**MP4**는 같은 장면의 원본 화질이다(폭 1600px · H.264). GitHub에서 파일을 열면 플레이어로 재생된다. 발표에서 크게 틀 때 이쪽을 쓴다.

## 다시 만들기

원본은 레티나 화면 녹화(3160×1904 · 60fps)라 그대로는 못 쓴다.

```bash
ffmpeg -i 원본.mov \
  -vf "fps=12,scale=1300:-2:flags=lanczos,split[a][b];\
[a]palettegen=max_colors=160:stats_mode=diff[p];\
[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
  -loop 0 out.gif

ffmpeg -i 원본.mov -vf "scale=1600:-2:flags=lanczos" \
  -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -an out.mp4
```

`palettegen`/`paletteuse`를 빼면 GIF가 256색 기본 팔레트로 떨어져 글자 가장자리가 뭉갠다. `stats_mode=diff`는 움직이는 구간에 색을 몰아준다 — 화면 대부분이 정지해 있는 녹화에서 특히 차이가 크다.
