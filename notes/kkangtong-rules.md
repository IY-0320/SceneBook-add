# 깡통 커뮤니티 글꾸 규칙 (씬북+ 작업에서 확인한 것 포함)

사용자가 준 기본 가이드 + 이번 작업에서 확인해 추가한 규칙.

## 기본 요구 사항 (사용자 요청)

- 디테일하고 깔끔하고 가독성 좋은 트렌디한 사이트 소개글 스타일. Neumorphism, Liquid Glass, Reveal/Cover 등 효과, 인터랙티브 요소.
- 색감·디자인은 글 분위기(씬북+는 씬북 UI처럼 흑백·회색)와 맞출 것.
- 명조·굴림·궁서체 금지. (Pretendard 등 고딕 계열 사용)
- 코드 블록 안에 적어서 전달.
- 모바일에서 잘리지 않게.
- 문체 "~합니다/~입니다", 어려운 용어 X. 다운로드 링크는 맨 끝(미괄식).

## 사이트 제약 (깡통 가이드 요약)

- 차단: `script`, `form`, `svg`, `link`, `meta`, `object/embed`, 모든 `on*` 이벤트 속성. (`input`도 허용 목록에 없음)
- 상호작용은 `details/summary`, `:hover`, `:focus`/`:focus-within` + `tabindex="0"`, CSS 애니메이션만.
- 자동 변환: `position:fixed→relative`, `overflow:hidden→visible`, `height/min-height:100vh→auto`, `touch-action:none→auto`.
- `body/html/:root{...}` → `.glitch-body{...}`로 바뀜. 배경은 `body{background:...}`로.
- iframe은 YouTube·Suno만. 이미지는 `max-width:100%` 자동. 테이블 border-radius 제거.

## 글자색 지정 규칙 (필수)

**원인:** 사이트에서 글 쓸 때 고른 글자색이 글자 채움색(`-webkit-text-fill-color`)으로 덮어씌워지는 것으로 보임. `color`만 지정하면 안 보임.

1. 글꾸 전체를 class로 감싸고 모든 요소의 글자 채움색이 글자색을 따르게 고정:
   ```css
   .wrap,.wrap *,.wrap *:before,.wrap *:after{-webkit-text-fill-color:currentColor !important;}
   ```
2. 선택자는 **id(#) 대신 class(.)**. (id를 쓴 글꾸는 글자색이 적용되지 않았음)
3. 바깥 상자에 기본 글자색, 다른 색은 바깥 class를 앞에 붙인 선택자로:
   ```css
   .wrap{color:#1d1d20;}
   .wrap .sub{color:#6b6b73;}
   .wrap .dark-box, .wrap .dark-box *{color:#f4f4f5;}
   ```
4. (선택, 가장 강함) 글자 요소마다 인라인으로 둘 다:
   ```html
   <b style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;">제목</b>
   ```
   씬북+ 글은 `notes/post/inline.cjs`로 브라우저에서 계산한 색을 자동으로 넣었음.

확인된 사실 / 추정 구분:
- 1번(채움색 고정 필수)은 성공·실패 글 비교로 가장 확실.
- 2번(id 금지)은 비교로 추론. 이유는 미확인(사이트가 id를 바꾸거나 지우는 것으로 추측).
- `color`의 `!important`는 문제 아님(원문 보기 글에서 정상 동작).

## 스크롤 등장 효과 (Reveal)

- `animation-timeline:view()` 사용 시 글 맨 끝 부분은 끝까지 내려도 충분히 올라오지 못해 **반쯤 투명하게 멈출 수 있음**.
- 완전히 선명해지는 시점: `animation-range:entry 0% entry 35%;` (X `cover 26%`)
- 맨 끝 1~2개 부분(다운로드 상자 등)에는 등장 효과를 넣지 않음.
- `@supports (animation-timeline: view()){...}` 안에 넣어, 지원 안 하는 브라우저는 바로 보이게.

## 가로 넘침 방지 (모바일)

- 사이트가 `overflow:hidden`을 풀어 버리므로 장식이 상자 밖으로 나가면 화면이 옆으로 밀림.
- 장식은 `top/left/right/bottom` 0 이상, 안쪽으로만 움직이게(음수 위치 X), 크기는 `min(220px,55%)`처럼.
- 모서리 자르기는 `overflow` 대신 `clip-path:inset(0 round 20px)`.
- 격자는 `grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))`, 글자 크기는 `clamp()`.
