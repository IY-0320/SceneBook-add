# 씬북+ 작업 기록 (다른 세션에서 이어서 하기)

> 새 세션에서는 이 파일을 먼저 읽고 시작하면 됩니다.
> 사용자는 개발자가 아니고 한국어로 대화합니다. 설명은 쉬운 말로, 전문 용어 없이.

## 0. 지금 상태 (2026-11-28 기준, 먼저 읽기)

- **씬북+ 작업 다시 진행 중.** (11-27에 잠시 멈췄다가 11-28에 사용자가 오류 수정·새 기능을 요청해 다시 시작)
- **지금 버전: `0.6.3-add.1.2.0`** (원본 씬북 0.6.3 기반). 마지막 커밋은 `git log -1`로 확인.
- **사용자 규칙 (꼭 지킬 것)**
  - **버전 숫자는 수정 중에 올리지 않음.** 사용자가 "끝냈다/버전 올려"라고 할 때만 올림. 형식은 `원본버전-add.1.X.0`. 원본을 합치면 앞부분만 원본 번호로 바꾸고 add 숫자는 그대로(사용자 결정, 0.6.3 때).
    올릴 곳: `manifest.json` version, `src/addon/info.mjs`, `ADD.md`, 이 파일, 그리고 **깡통 업데이트 글꾸**(7번).
  - **원본과 비교하는 말 금지**(글꾸·안내 모두): 더, ~보다, 달라졌다, 차이, 원본에 없는 …
  - **시키지 않은 것은 손대지 않기.** 특히 지시문 속 성인 장면 규칙 등 검열 관련 문구.
  - **원본 업데이트 규칙 (0.6.3 때 사용자가 강하게 지적함)**
    1. 원본이 업데이트되면 **먼저 무엇이 추가·변경됐는지 쉬운 말로 브리핑**하고, 사용자가 넣을지 정한 뒤에 합친다. 무조건 합치지 않는다.
    2. 넣기로 한 **원본 기능 변경은 씬북+ 코드에 그대로 따라 넣는다**(화면·디자인만 바뀐 것과 구분해서 설명). 씬북+ 편의 기능은 그대로 이어 간다.
    3. 계획·보고에는 버전 표기보다 **바뀐 코드가 무엇이고 어떻게 넣었는지**를 먼저 쓴다. **버전 표기만 바꾸는 일은 절대 없다**(사용자는 그걸 "사기"라고 함). 계획 글이 그렇게 읽히지 않게 쓸 것.
  - 고친 뒤에는 **실제 SillyTavern으로 확인**하고 결과를 쉬운 말로 알려 주기(6번).
- **버전별로 한 일** (사용자 기준 묶음)
  - `0.5.3-add.1` (11-26) 첫 버전: 문단 뒤(자동), 그림체 프리셋, 큰 그림 보기(확대·넘기기), 갤러리 삭제, 분석 답 길이, 터치 도구·업데이트 뒤 새로고침.
  - `0.6.2-add.1.1.0` (11-27~28, 예전 add.2·3·4 포함):
    - 원본 0.6.2 병합 (겹치는 기능은 씬북+ 코드, 새 기능만 원본에서 — 1번 참고)
    - **프리셋 빠른 선택**을 시작 탭(자동 삽화와 바로 하기 사이)으로 옮김
    - **재생성 그림체**: 재생성은 늘 지금 씬북 창 그림체 설정을 씀. '사용 안 함'일 때만 그 그림의 원래 그림체(그림체 look 칸은 그때도 지금 설정). 고른 프리셋 이름은 `extensionSettings.autopic2_active_style`(예전 localStorage는 한 번 옮김).
      - 원인 기록: 예전엔 '브라우저에 저장된 이름 + 설정 일치'일 때만 반영해서 실제 기기에서 무시됨(테스트 환경에선 재현 안 됨).
    - **연필 그림체 고정**: 그림 고치기(연필)에서 고른 그림체 프리셋·그림체가 다시 그리기 때 기본 설정으로 저장됨(`pinQuickStyle`).
    - **프리셋 빠른 저장**: 이미지 읽기에서 PNG를 불러오면 'PNG 선택' 옆 버튼 → 예/아니오 창 + 'PNG 파일 이름 그대로 사용' 체크(`src/addon/import-preset.mjs`).
  - `0.6.3-add.1.2.0` (11-28, 처음엔 0.6.2-add.1.2.0 — 원본 0.6.3을 합치며 한 버전으로 묶음):
    - **원본 0.6.3 병합**: 구도 규칙(`tag-rules.mjs` CAMERA_RULE·CAMERA_RULE_SHORT)에 '카메라가 설 수 있으면 극적인 각도(뒤에서·아래에서·위에서·멀리서·클로즈업)'. 원본과 한 글자도 다르지 않게 들어감(`git diff 7e905e1 -- src/tag-rules.mjs` 비어 있음). 이 규칙은 **기본 지시문 안**에 있으므로, 지시문을 직접 고쳐 저장한 사람에겐 안 들어감(출력 규칙과는 상관없음).
    - **갤러리 그림 형식 칸**(`gallery-format.mjs`): 범위 칸과 함께 걸러짐. 형식 기록 `extensionSettings.autopic2_job_formats`(id→형식, 삽화는 안 적음; 그릴 때·채팅 열 때·갤러리 열 때 기록), 기록 없는 서버 그림은 프롬프트 문장으로 짐작(웹툰 컷·세로 웹툰은 구분 안 돼 둘 다). '전체 삽화'는 서버 최근 100개 + 현재 채팅(서버 플러그인 한도, 늘리려면 플러그인 교체 필요 — 사용자에게 제안만 함).
    - **이미지 읽기 메인·UC 프롬프트 고치기**(`import-ui.mjs` [add] 줄, 고친 값이 설정 적용·장면 열기·프리셋 빠른 저장에 쓰임).
    - **출력 규칙 고치기**(`output-rules.mjs`, `output-rules-store.mjs`, 키 `extensionSettings.autopic2_output_rules`={analysis,injection}, 비면 기본 자동 규칙). 규칙 글은 안 바꾸고 고칠 수 있게만 함.
    - **저장한 지시문 · 지시문 세트**(`prompt-presets.mjs`, 키 `extensionSettings.autopic2_prompt_presets`={analysis,injection,sets}). 이름은 내가 추천해 사용자가 받아들임. 공통 프롬프트는 그림체 프리셋이 맡으므로 넣지 않음.
    - **탭 표시 지연 수정**: `studio.mjs` `frame()`을 rAF+setTimeout으로(그린 뒤 페이지 만들기), 탭 버튼 `transition:none`(`style.css`에 [add] 한 줄). 휴대폰 속도 264ms→80ms.
- **깡통 글 상태**: 본문 `notes/post/kkangtong-post.html`(1.2.0 기능까지 반영, 카드 7개), 업데이트 기록 `notes/post/kkangtong-updates.html`(따로 붙이는 블록). 둘 다 사용자에게 줬음.
- **다음에 할 수 있는 것**: 9번 참고.

## 1. 프로젝트 한눈에

- **무엇:** SillyTavern(실리) 확장 **씬북(ST-SceneBook)** 에 기능을 더한 개조판 **씬북+**.
  - 원본: https://github.com/tincansimagine/ST-SceneBook (원작자 허락 받음, GitHub 개조판 제작까지 허락 받음)
  - 이 저장소: https://github.com/IY-0320/SceneBook-add · 작업 브랜치 `claude/scenebook-extension-features-jxvwlo`
- **기반 버전:** 원본 0.6.3 (`upstream/main` = 7e905e1). 씬북+ 버전 표기 `0.6.3-add.1.2.0`.
- **병합 원칙 (사용자 결정, 0.6.2 병합 때):** 원본 0.5.4가 씬북+ 기능 거의 전부를 원본 방식으로 넣었음. **겹치는 기능은 씬북+ 코드를 쓰고, 원본에서는 새 기능만 가져온다.**
  - 처음엔 원본 방식으로 바꾼 0.6.2-add.1을 올렸다가 사용자가 되돌리라고 해서 0.6.2-add.2로 다시 만듦. add.1을 설치했던 사람을 위해 `src/addon/migrate.mjs`가 원본 자리(`galleryHidden`, `analysisLength`)의 값을 씬북+ 자리로 되돌림.
  - 원본에서 가져온 새 기능: 만화 페이지·웹툰 컷(comic.mjs), 답변 후 보조 모델(planSource 'separate'), 다른 탭 생성(persistChat), 구도 순서·시점 교정(viewpoint.mjs), 프롬프트 순서(prompt-order.mjs), 지시문 정리, 최대 응답 길이 안내.
  - 원본의 겹치는 구현은 지우지 않고 연결만 씬북+ 쪽으로 바꿈(병합이 쉽도록): `src/viewer.mjs`(안 씀), `presets.mjs`의 activePreset(원본 enqueue의 프리셋 기록에만), `analysis-reply.mjs`(안 씀), 원본 `chooseVersion`·`revealTools`·`deleteImages`·`hideFromGallery`·`reloadAfterSceneBookUpdate`(안 씀), 표시 탭의 '터치 화면의 그림 위 버튼'(숨김).
  - 웹툰 컷은 내부적으로 placement 'auto'를 씀 → 컷일 때는 원본 지시문(CUT_ORDER)을 그대로, 그 밖의 'auto'는 씬북+ 지시문(`placement-rules.mjs`의 [add] 줄).
- **왜 애드온/스크립트가 아니라 개조판인가:** 원본 index.js는 아무것도 export하지 않아 바깥에서 핵심 동작(문단 자동 배치, 재생성 그림체 등)을 바꿀 수 없음. 그래서 원본 전체 + 추가 코드 구조로 만들고, 원본 업데이트는 git 병합으로 따라감.
- **원본과 동시에 켜면 안 됨.** 같은 저장 키(`autopic2`), 같은 명령어(`/scenebook`, `/scenegen`), 같은 화면 요소를 씀. 대신 설정·프리셋·삽화가 그대로 이어짐.
- **이름:** 확장 목록·확장 칸 제목·알림·마법봉 메뉴 모두 "씬북+". (원본 메뉴의 나머지 글자는 그대로 둠)

## 2. 코드 구조 원칙

- 추가 기능 코드는 **`src/addon/`** 에 모으고, 원본 파일에는 **`[add]` 표시가 붙은 짧은 연결 줄만** 넣음.
- 원본 파일 중 연결 줄이 있는 곳: `index.js`, `src/context.mjs`, `src/placement-rules.mjs`, `src/editor.mjs`, `src/studio.mjs`, `src/gallery-ui.mjs`(씬북+ 0.5.3판 + 원본 0.5.6·0.6.2 수정), `src/notifications.mjs`, `src/quick-edit.mjs`, `src/import-ui.mjs`, `src/prompt-ui.mjs`, `src/injection.mjs`, `src/prompts.mjs`, `style.css`(탭 버튼 한 줄), `manifest.json`, `README.md`(맨 위 안내 두 줄).
- **`style.css`는 되도록 건드리지 않음** (원본이 자주 고치는 파일). 예외: 탭 버튼 `transition:none` [add] 한 줄. 씬북+ 전용 CSS는 addon 모듈에서 `<style>`로 넣음(`chat-helpers.mjs`, `import-preset.mjs` 등).
- 원본 설정 정리 함수(`cleanSettings`)는 DEFAULTS에 없는 키를 지움 → 씬북+ 전용 값은 `extensionSettings`의 별도 키에 저장:
  - `autopic2_hidden_jobs` (갤러리에서 숨긴 그림), `autopic2_analysis_length` (분석 답 길이)
  - `autopic2_active_style` (빠른 선택에서 고른 프리셋 이름, `\u0000none`=사용 안 함)
  - `autopic2_job_formats` (그림 id → 형식), `autopic2_output_rules` (직접 고친 출력 규칙), `autopic2_prompt_presets` (저장한 지시문·지시문 세트)

### src/addon 파일

| 파일 | 하는 일 |
|---|---|
| `host.mjs` | 원본 index.js의 함수(settings, saveSettings, scheduleRender, notice, KEY, safeImagePath)를 addon에서 쓰기 위한 연결점. `initialize()`에서 `connect()` |
| `info.mjs` | 화면 이름 `씬북+`, 버전 `${CLIENT_VERSION}-add.1.2.0` |
| `viewer.mjs` | 큰 그림 보기(원본 openViewer와 같은 모양으로 부름). 예전엔 ui.mjs의 viewer를 고쳐 썼으나 원본이 viewer를 src/viewer.mjs로 옮겨서 addon으로 가져옴 |
| `migrate.mjs` | 0.6.2-add.1이 원본 자리로 옮긴 갤러리 숨김·분석 답 길이를 씬북+ 자리로 되돌림 |
| `auto-placement.mjs` | 문단 뒤(자동): `autoPosition`(인용문→문단번호→2-gram 유사도), AI 지시 규칙, 번역 화면용 `anchorByOrder`(문단 수가 같을 때만) |
| `style-presets.mjs` | 프리셋 빠른 선택(시작 탭), 적용 중 표시, `restyle`(재생성은 지금 그림체 설정, '사용 안 함'이면 그림 원래 그림체), `pinQuickStyle`(연필에서 고른 그림체 고정), 그림 고치기의 프리셋 칸, 최종 확인의 확인용 표시, 큰 그림 제목용 `styleName` |
| `gallery-delete.mjs` | 갤러리 삭제(실리에서만 숨기기 / 이미지 파일까지 완전 삭제, 모든 스와이프 기록 정리, 채팅 바뀌면 손대지 않음) |
| `viewer-swipe.mjs` | 큰 그림 좌우 넘기기·←/→ 키, 끝에서 처음으로 순환, 확대 중엔 넘기지 않음 |
| `zoom.mjs` | 큰 그림 확대(두 손가락·두 번 톡톡·휠·더블클릭·끌기·버튼·+/−/0 키) |
| `chat-helpers.mjs` | 씬북+ CSS, 터치 화면에서 도구 아이콘 탭해야 보이기, 버전 ‹ › 바로 넘기기 + 자체 저장 큐 |
| `analysis-response.mjs` | AI가 장면 쓰기 응답 읽기 보강(설명 문장·`<think>`·코드블록 섞여도), 분석 답 길이 설정(자동/직접 입력) |
| `update-reload.mjs` | manifest `hooks.update`로 업데이트 뒤 자동 새로고침(답변 받는 중엔 대기, 입력창에 글 있으면 안 함) |
| `import-preset.mjs` | 이미지 읽기의 '프리셋 빠른 저장' 버튼과 예/아니오 창 |
| `gallery-format.mjs` | 갤러리 '그림 형식' 칸, 그림 형식 기록·짐작 |
| `output-rules.mjs` · `output-rules-store.mjs` | 지시문 편집 창의 출력 규칙 고치기(칸·기본 규칙으로), 저장소(원본 injection/prompts가 읽음) |
| `prompt-presets.mjs` | 저장한 지시문(지시문 편집 창 탭마다) · 지시문 세트(프롬프트 탭 'AI 지시문 · 프롬프트 공유' 칸) |

## 3. 완성된 기능 (사용자에게 설명할 때 쓰는 말)

1. **문단 뒤(자동):** 표시 → 그림 위치. AI가 장면마다 어울리는 문단 뒤에 그림을 둠. 번역 화면에서도 문단 순서로 같은 자리를 찾음.
2. **그림체 프리셋:** 시작 탭 빠른 선택, 프리셋 · 백업의 "적용 중" 표시, 재생성은 지금 그림체로, 그림 고치기(연필)에서 고른 프리셋·그림체는 앞으로도 적용(크기·시드 유지), 이미지 읽기에서 PNG를 프리셋으로 빠른 저장, 큰 그림 제목 "삽화 · 프리셋 이름", 장면 편집 → 최종 확인에 확인용 표시.
7. **갤러리 그림 형식**, 8. **이미지 읽기 프롬 고치기**, 9. **출력 규칙 고치기**, 10. **저장한 지시문 · 지시문 세트** (0번 참고).
3. **큰 그림 보기:** 확대, 채팅 삽화는 같은 장면 버전끼리 넘기기(채팅도 그 버전으로 바뀜), 갤러리는 다른 그림으로, 끝↔처음 순환.
4. **갤러리 삭제:** ⋯ → 삭제 → 실리에서만 삭제 / 완전히 삭제. 고른 그림엔 체크 표시만(테두리 없음).
5. **AI 장면 쓰기:** 그림 설정 → 수동 분석 → 분석 답 길이(자동/직접 입력). 빈 답이면 안내.
6. **편의:** 터치 화면 도구 아이콘, 갤러리 닫아도 확장 칸 유지, 버전 ‹ › 바로 넘기기, 업데이트 뒤 자동 새로고침, 삽화 위 아이콘 흰색 고정.

### 원본 0.6.2와 다른 점 (11-27에 사용자에게 설명한 내용 — 내부 참고용, 글꾸에는 비교하는 말 쓰지 않기)

그때 기준으로 원본에 아예 없는 기능은 사실상 없었음. 그 뒤 1.1.0·1.2.0에서 더한 것은 0번 참고. 차이는 동작 방식:
- 씬북+에만: 이름 "씬북+", '프리셋 · 백업' 펼침 유지, 프리셋 줄의 "적용 중" 배지, 그림 고치기 프리셋 칸 위치(AI로 고쳐 쓰기와 장면 사이)·최종 프롬프트 그림에서도 보임, "앞으로 그릴 그림에도 적용"은 메인 프롬프트·제외할 요소·그림체만 저장, 업데이트 뒤 새로고침은 답변 받는 중엔 기다리고 입력창에 글 있으면 안 함.
- 방식이 다름: 재생성 그림체(씬북+는 늘 지금 그림체 설정, '사용 안 함'이면 그림 원래 그림체 / 원본은 설정이 프리셋과 같을 때만), 큰 그림 제목(씬북+ "삽화 · 프리셋" / 원본 "모델 · 크기 · Seed · 프리셋"), 갤러리 삭제(씬북+ ⋯ → 삭제 / 원본 고르기 + 숨긴 그림 되살리기), 터치 버튼(씬북+ 늘 한 번 누르면 보이기 / 원본은 항상 보이기도 선택), 문단 뒤(자동)·확대·넘기기·분석 답 길이 화면·응답 읽기는 코드가 다름.

## 4. 지금까지 겪은 문제와 교훈 (같은 실수 반복 금지)

- **원본 코드는 한 줄에 여러 문장이 붙어 있음.** 줄 중간에 `// 주석`을 넣으면 뒤 코드가 주석이 됨 → 삽화가 빈 회색 칸으로 보였던 원인. 줄 중간엔 `/* */`만.
- **원본 파일 일부는 CRLF 줄바꿈.** 수정할 때 줄바꿈을 보존할 것(`notes/test-kit/patch.py` 참고, `newline=''`로 읽고 쓰기).
- **번역 확장과 다시 그리기 무한 반복:** 삽화가 지워지면 다시 붙이는 MutationObserver를 넣었다가 번역 확장과 서로 다시 그려 삽화가 사라짐 → 기능 제거. 원본은 번역 채팅에서도 잘 보여 줌.
- **실리는 휴대폰에서 `touchstart`로 열린 칸을 닫음.** 씬북 창(modal)이 mousedown만 막고 있어서 갤러리 그림을 닫으면 확장 칸도 닫혔음 → `ui.mjs` modal에서 touchstart도 막음. (원본 0.5.4부터 원본 modal에도 들어가 있어 지금은 원본 코드 그대로)
- **테마가 아이콘(`<i>`)을 회색으로 칠하고, 방금 누른 칸의 outline을 지움.** 아이콘 색은 `!important`로, 선택 표시는 outline에 의존하지 않기.
- **"AI가 장면 쓰기" 실패의 진짜 원인:** 생각하는 AI(gemini 계열)가 답 길이(장면 수 × 1800, 최대 6000)를 생각에 다 써서 `content:''`, `finish_reason:'length'`. 원본에서도 실패. → 분석 답 길이 설정. (16000 자동 재요청은 사용자가 원치 않아 제거)
- **실리 saveChatDebounced는 앞 저장이 길면 포기** → 버전 넘기기는 자체 저장 큐 사용.
- **실리 manifest hooks는 업데이트 전 manifest를 씀** → 새 hook은 그 버전을 받은 다음 업데이트부터 동작.
- **터묵스가 업데이트 중 꺼지는 문제:** 확장 문제 아님(테스트로 확인). 안드로이드 Phantom Process Killer 의심. 사용자가 다음에 꺼지면 로그를 보내기로 함.
- **병합 때 원본의 같은 기능으로 바꾸지 말 것.** 0.6.2-add.1에서 그렇게 했다가 사용자가 되돌리라고 함. 겹치면 씬북+ 코드, 새 기능만 원본에서.
- **시키지 않은 것은 손대지 않기.** 특히 지시문 안의 성인 장면 규칙 등 검열 관련 문구는 원본 그대로 둠(사용자가 확인함).
- **사용자가 말하는 '그림체'가 무엇인지 먼저 확인.** 씬북 창에는 '그림체'(look 칸)와 '그림체 프리셋'(프리셋 빠른 선택)이 따로 있음. add.3에서 look으로 알아들었는데 사용자가 말한 건 프리셋 빠른 선택이었음.
- **테스트 환경에서 재현 안 되는 실제 기기 버그**는 기기마다 따로인 저장(localStorage)이나 '조건이 다 맞을 때만' 같은 숨은 조건을 의심. 설정 값은 `extensionSettings`(서버 저장)에 둘 것.
- 원본 함수 `frame()`(requestAnimationFrame)은 **화면을 그리기 전에** 끝남. '그린 뒤에' 하려면 rAF 안에서 setTimeout.
- 코드 검토(/code-review)로 9건 수정함. "프리셋 빠른 선택은 자동 삽화를 끄지 않음"은 사용자에게 설명한 의도된 동작이라 유지.

## 5. 원본 업데이트 합치기

**순서: ① `git fetch upstream` 후 `git log`·`git diff`로 바뀐 것 확인 → ② 사용자에게 브리핑(기능 변경 / 설명·화면만 변경 구분, 씬북+와 겹치는지) → ③ 사용자가 정하면 합치기 → ④ 원본 파일과 똑같이 들어갔는지 diff로 확인 → ⑤ 실리 확인 → ⑥ 버전·문서·깡통 글.** (0번 '원본 업데이트 규칙')

`UPDATING.md` 참고. 요약:
```bash
git remote add upstream https://github.com/tincansimagine/ST-SceneBook   # 처음 한 번
git fetch upstream && git merge upstream/main
```
충돌은 대부분 `[add]` 줄. 합친 뒤 `manifest.json` version(`원본버전-add.N`), `ADD.md` 기반 버전, `src/addon/info.mjs`(CLIENT_VERSION 기반이라 보통 자동) 확인. 그리고 아래 테스트를 다시 돌림.

## 6. 테스트 방법 (실제 SillyTavern으로 확인 — 사용자가 직접 요청한 방식)

사용자는 "고칠 때마다 실제로 확인해 달라"고 요청함. 아래처럼 실리를 띄워 확인하고 결과를 말해 줄 것.

```bash
W=<작업 폴더>   # 예: 스크래치패드
git clone -q --depth 1 -b release https://github.com/SillyTavern/SillyTavern $W/st-app
cd $W/st-app && npm ci --no-audit --no-fund
timeout 40 node server.js --port 8000; true          # 처음 한 번 실행해 config.yaml·data 생성
sed -i 's/^enableServerPlugins: false/enableServerPlugins: true/' config.yaml
cp -r <저장소>/server-plugin/autopic2 plugins/
python3 - <<'PY'                                       # 첫 실행 안내 창 건너뛰기
import json;p='data/default-user/settings.json';d=json.load(open(p));d['firstRun']=False;json.dump(d,open(p,'w'),indent=4)
PY
mkdir -p data/default-user/extensions/SceneBook-add && (cd <저장소> && tar -c --exclude=.git .) | tar -x -C data/default-user/extensions/SceneBook-add
mkdir -p data/default-user/user/images/autopic2        # 테스트용 PNG를 <uuid>.png 이름으로 넣기
(setsid nohup node server.js --port 8000 > $W/st.log 2>&1 &)
```
- Playwright(Chromium)는 환경에 설치돼 있음. `notes/test-kit/st-*.cjs`는 `http://127.0.0.1:8000`, 확장 폴더 이름 `SceneBook-add` 기준.
  - `st-gen.cjs` AI 장면 쓰기 → 생성 → 문단 삽입(가짜 generateRaw·가짜 NovelAI 응답)
  - `st-len2.cjs` 분석 답 길이 설정 UI·저장·요청 길이
  - `st-ver.cjs`, `st-wrap.cjs` 버전 넘기기·순환·저장
  - `st-zoom.cjs` 휴대폰(Pixel 7) 확대·갤러리 닫기
  - `st-sel.cjs` 갤러리 선택 표시·아이콘 색, `st-qe.cjs` 그림 고치기 프리셋, `st-ed.cjs` 최종 확인 표시
  - `st-fix.cjs` 완전 삭제(스와이프 정리)·확대 중 키·업데이트 훅, `st-hook.cjs` 실제 업데이트 후 자동 새로고침
  - `st-merge.cjs` 병합 뒤 한 번에 확인(설정 되돌려 옮기기·이름·그림 고치기 프리셋 위치·재생성 설정·큰 그림 제목), `st-tabs.cjs` 씬북 창 모든 탭이 오류 없이 열리는지
  - `st-style.cjs` 씬북 창 프리셋·그림체 → 재생성 반영, 연필에서 고른 프리셋·그림체가 기본 설정에 고정되는지
  - `st-import-preset.cjs <PNG> <스크린샷.png>` 프리셋 빠른 저장·이미지 읽기 프롬 고치기 (PNG 이름에 이모지가 있으면 buffer로 넘기게 돼 있음)
  - `st-gfmt.cjs <스크린샷.png>` 갤러리 그림 형식(이 채팅/전체, 다른 채팅 기록·짐작)
  - `st-rules.cjs <스크린샷.png>` 출력 규칙 고치기·되돌리기, `st-prompt-presets.cjs <스크린샷.png>` 저장한 지시문·지시문 세트
  - `st-navlag.cjs` 탭 표시 지연(휴대폰 속도로 클릭→다음 그리기 ms)
  - 0.6.2-add.1.2.0에서 style·import-preset·gfmt·rules·prompt-presets·navlag·tabs·gen·sel·merge 통과.
- 실리 서버가 꺼져 있으면(컨테이너 재시작 등) `st-app` 폴더에서 `(setsid nohup node server.js --port 8000 > $W/st.log 2>&1 &)`로 다시 켬. 고친 확장은 매번 `data/default-user/extensions/SceneBook-add/`에 다시 복사해야 반영됨.
- 인자로 스크린샷 경로를 받는 스크립트는 `.png`로 끝나는 경로를 넘길 것.
- 깡통(kkangtong.xyz)은 이 작업 환경에서 접속이 안 됨.

## 7. 깡통 소개 글(글꾸)

- 본문: `notes/post/kkangtong-post.html` (사용자가 올린 글 기준으로 맞춤: 자주 묻는 질문은 `details open` + `<div>`, @import·주석 없음. 1.2.0 기능까지 반영)
- **업데이트 기록(따로 붙이는 블록):** 원본 `notes/post/updates-src.html` → `node notes/post/updates-inline.cjs notes/post` → 완성본 `notes/post/kkangtong-updates.html`. class 앞머리 `.sbpu`. **사용자는 어두운 최신 상자 디자인을 좋아함.** 쓰는 법은 `notes/kkangtong-rules.md`의 '업데이트 글꾸'.
- 기능이 바뀌면 본문(카드·자주 묻는 질문)과 업데이트 기록을 둘 다 고치고, 두 블록은 **따로** 코드 블록으로 줌.
- 디자인: 씬북처럼 흑백·회색 단계, 어두운 히어로·다운로드 상자, 덮개(Cover) 카드, 유리(Liquid Glass), 은은한 뉴모피즘, 스크롤 등장(Reveal), 접기/펼치기 Q&A. 다운로드 링크는 글 맨 끝(미괄식).
- 글 문체: "~합니다/~입니다", 쉬운 말, 원본과 비교하는 표현 쓰지 않기(더~, ~보다, 달라졌다, 차이 등).
- 글꾸 규칙: `notes/kkangtong-rules.md`
- 확인 스크립트: `notes/post/*.cjs` (`check`=사이트가 글자색을 덮어써도 유지되는지, `wide`=가로 넘침, `bottom`/`mid`=등장 효과가 흐리게 멈추지 않는지, `same`=색 비교, `inline`=글자마다 인라인 색 넣기)

## 8. 라이선스·문서

- `LICENSE`: 씬북+ 추가 부분에만 적용. 비영리만, 영리 엄금, **수정 재업로드는 오직 '깡통' 사이트에서만**. "배포" 표현 쓰지 않음.
- `ADD.md`: 기능 안내·설치·라이선스. 첫 문단에 원작자와 오토픽(AutoPic) 제작자 감사.
- 원본 README 본문은 건드리지 않음.

## 9. 남은 일 / 다음에 할 수 있는 것

- 터묵스가 업데이트 중 꺼지면 로그 받아서 원인 확인.
- 원본 씬북이 새로 나오면: 병합(1번 원칙) + 테스트 + 사용자 확인 뒤 버전 올리기 + 깡통 글 2개 갱신.
- '전체 삽화'를 서버 최근 100개보다 많이 보이게 하려면 서버 플러그인(`server-plugin/autopic2/service.mjs` list의 100)을 바꾸고 사용자가 플러그인 교체·재시작해야 함 — 제안만 해 둔 상태(사용자 답 없음).
- 저장소 기본 브랜치가 `claude/scenebook-extension-features-jxvwlo` 하나뿐 → 필요하면 `main`으로 정리하는 것 제안해 둠(사용자 결정 대기).
