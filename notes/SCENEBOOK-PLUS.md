# 씬북+ 작업 기록 (다른 세션에서 이어서 하기)

> 새 세션에서는 이 파일을 먼저 읽고 시작하면 됩니다.
> 사용자는 개발자가 아니고 한국어로 대화합니다. 설명은 쉬운 말로, 전문 용어 없이.

> **현재 상태 (2026-11-27): 씬북+ 업데이트 잠시 멈춤.** 원작자가 원본 0.5.4에서 씬북+ 기능을 거의 전부 넣어 줘서,
> 사용자는 당분간 **원본 씬북을 쓰기로 함.** 지금 씬북+ 버전은 `0.6.2-add.1.2.0`.
> **버전 규칙(사용자 지시):** 수정하는 중에는 add 숫자를 올리지 않음. 사용자가 "끝냈다"고 할 때만 올림. (add.3·add.4는 이 규칙 전에 올렸던 것이고, 사용자가 `add.1.1.0`으로 정함. 1.1.0 뒤에 더한 것(갤러리 그림 형식·출력 규칙·이미지 읽기 프롬 고치기·저장한 지시문·지시문 세트·탭 표시)은 사용자 지시로 `add.1.2.0`.)
> 버전을 올릴 때마다 깡통 **업데이트 글꾸**(`notes/post/updates-src.html`)에도 새 버전을 적을 것 → 방법은 `notes/kkangtong-rules.md`의 '업데이트 글꾸'.
> 2026-11-28 add.3: 오류 수정 요청 — ① 씬북 창에서 그림체(look)를 바꾸고 재생성하면 안 바뀌던 것(프리셋을 고르지 않으면 그림 원래 그림체로 그렸음) → `restyle()`이 지금 설정의 그림체를 따름. ② 연필(그림 고치기)에서 고른 그림체 프리셋·그림체가 1회성이던 것 → 다시 그리기 할 때 기본 설정으로 고정(`pinQuickStyle`). 확인: `notes/test-kit/st-style.cjs`.
> 2026-11-28 프리셋 빠른 저장: 이미지 읽기 창에서 PNG를 불러오면 'PNG 선택' 옆에 버튼(`src/addon/import-preset.mjs`, 연결은 `src/import-ui.mjs`의 [add] 줄). 예/아니오 창 + 'PNG 파일 이름 그대로 사용' 체크(끄면 이름 입력칸). 저장 값은 원본 '설정에 적용'과 같은 설정. 확인: `notes/test-kit/st-import-preset.cjs <PNG> <스크린샷.png>` (Playwright는 이모지 파일 경로를 못 읽어 buffer로 넘김).
> 2026-11-28 갤러리 그림 형식 칸: `src/addon/gallery-format.mjs`(형식 판단: `job.cut`=웹툰 컷, `job.pageScene.pageFormat`=만화·세로 웹툰, 나머지=삽화). 다른 채팅 그림도 나뉘도록 형식 기록 `extensionSettings.autopic2_job_formats`(id→형식, 삽화는 안 적음; 그릴 때 attach 뒤·CHAT_CHANGED·갤러리 열 때 기록) + 기록 없는 서버 그림은 프롬프트 문장으로 짐작(manga/comic page, 'vertical webtoon strip'은 웹툰 컷·세로 웹툰 둘 다). 연결은 `src/gallery-ui.mjs`·`index.js` [add] 줄. '전체 삽화'는 원본대로 서버 최근 기록 100개 + 현재 채팅임(서버 플러그인 한도). 범위 칸과 AND로 걸러짐. 확인: `notes/test-kit/st-gfmt.cjs <스크린샷.png>`.
> 2026-11-28 이미지 읽기 메인·UC 프롬프트 고치기(`src/import-ui.mjs` [add] 줄, 고친 값은 `result.scene`에 바로 반영) + 출력 규칙 고치기(`src/addon/output-rules.mjs`·`output-rules-store.mjs`, 저장 키 `extensionSettings.autopic2_output_rules`={analysis,injection}, 비면 기본 자동 규칙. 연결: `src/injection.mjs` renderInjection·`src/prompts.mjs` renderAnalysis·`src/prompt-ui.mjs`의 [add] 줄). 규칙 글 자체(검열 관련 문구 포함)는 바꾸지 않고 '고칠 수 있게'만 함. 확인: `st-rules.cjs <스크린샷.png>`, `st-import-preset.cjs`.
> 2026-11-28 씬북 창 탭 표시가 늦게 따라오던 것: `studio.mjs`의 `frame()`이 rAF라 그리기 전에 페이지를 만들었음 → rAF+setTimeout으로 그린 뒤 만들기, 탭 버튼 `transition:none`(style.css [add]). 휴대폰 속도(CPU 6배)로 클릭→다음 그리기 264ms→80ms. 확인: `st-navlag.cjs`.
> 2026-11-28 지시문 저장(이름은 내가 추천: 안쪽 '저장한 지시문', 바깥 '지시문 세트'): `src/addon/prompt-presets.mjs`, 저장 키 `extensionSettings.autopic2_prompt_presets`={analysis,injection,sets}(prompt ''=기본 지시문, rules ''=기본 규칙, 세트는 저장 순간 복사). 연결: `prompt-ui.mjs`·`studio.mjs`(promptSetsOpen로 펼침 유지) [add] 줄, `output-rules.mjs` rulesEditor에 read/set. 확인: `st-prompt-presets.cjs <스크린샷.png>`.
> 2026-11-28 add.4: 사용자가 말한 건 '프리셋 빠른 선택'이었음 — 실제 기기에서 고른 뒤 재생성해도 안 바뀜. 테스트 환경에선 재현 안 됨. 원인 추정: 고른 프리셋 이름을 브라우저(localStorage)에만 저장하고, 재생성은 '이름 기록 + 설정 일치'일 때만 반영 → 기기·브라우저가 다르거나 기록이 없으면 무시됨(칸에는 설정 일치로 선택돼 보임). 수정: 재생성은 늘 지금 씬북 창 그림체 설정을 씀('사용 안 함'일 때만 그림 원래 그림체), 고른 이름은 `extensionSettings.autopic2_active_style`에 저장. 프리셋 빠른 선택을 그림 설정 탭 → 시작 탭(자동 삽화와 바로 하기 사이)으로 옮김.
> 다시 시작하면: 원본 최신을 병합(1번의 병합 원칙대로) → 테스트 → 버전 올리기.
> 원본으로 옮길 때 안내한 것: 둘 동시에 켜지 않기 / 설정·프리셋·삽화는 이어짐 /
> 씬북+만 따로 저장하던 '갤러리에서 숨긴 그림'·'분석 답 길이'는 원본에서 다시 정해야 함.

## 1. 프로젝트 한눈에

- **무엇:** SillyTavern(실리) 확장 **씬북(ST-SceneBook)** 에 기능을 더한 개조판 **씬북+**.
  - 원본: https://github.com/tincansimagine/ST-SceneBook (원작자 허락 받음, GitHub 개조판 제작까지 허락 받음)
  - 이 저장소: https://github.com/IY-0320/SceneBook-add · 작업 브랜치 `claude/scenebook-extension-features-jxvwlo`
- **기반 버전:** 원본 0.6.2 (`upstream/main` = 8f26b7f). 씬북+ 버전 표기 `0.6.2-add.1.2.0`.
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
- 원본 파일 중 연결 줄이 있는 곳 (0.6.2 기준): `index.js`, `src/context.mjs`, `src/placement-rules.mjs`, `src/editor.mjs`, `src/studio.mjs`, `src/gallery-ui.mjs`(씬북+ 0.5.3판 + 원본 0.5.6·0.6.2 수정), `src/notifications.mjs`, `src/quick-edit.mjs`, `manifest.json`, `README.md`(맨 위 안내 두 줄).
- **`style.css`는 건드리지 않음** (원본이 자주 고치는 파일). 씬북+ 전용 CSS는 `src/addon/chat-helpers.mjs`에서 `<style id="ap2-tools-css">`로 넣음.
- 원본 설정 정리 함수(`cleanSettings`)는 DEFAULTS에 없는 키를 지움 → 씬북+ 전용 값은 `extensionSettings`의 별도 키에 저장:
  - `autopic2_hidden_jobs` (갤러리에서 숨긴 그림), `autopic2_analysis_length` (분석 답 길이)
  - 직접 고른 프리셋 이름은 `localStorage['scenebook-active-style']`

### src/addon 파일

| 파일 | 하는 일 |
|---|---|
| `host.mjs` | 원본 index.js의 함수(settings, saveSettings, scheduleRender, notice, KEY, safeImagePath)를 addon에서 쓰기 위한 연결점. `initialize()`에서 `connect()` |
| `info.mjs` | 화면 이름 `씬북+`, 버전 `${CLIENT_VERSION}-add.1.2.0` |
| `viewer.mjs` | 큰 그림 보기(원본 openViewer와 같은 모양으로 부름). 예전엔 ui.mjs의 viewer를 고쳐 썼으나 원본이 viewer를 src/viewer.mjs로 옮겨서 addon으로 가져옴 |
| `migrate.mjs` | 0.6.2-add.1이 원본 자리로 옮긴 갤러리 숨김·분석 답 길이를 씬북+ 자리로 되돌림 |
| `auto-placement.mjs` | 문단 뒤(자동): `autoPosition`(인용문→문단번호→2-gram 유사도), AI 지시 규칙, 번역 화면용 `anchorByOrder`(문단 수가 같을 때만) |
| `style-presets.mjs` | 프리셋 빠른 선택, 적용 중 표시, `restyle`(직접 고른 프리셋일 때만 재생성에 반영), 그림 고치기의 프리셋 칸, 최종 확인의 확인용 표시, 큰 그림 제목용 `styleName` |
| `gallery-delete.mjs` | 갤러리 삭제(실리에서만 숨기기 / 이미지 파일까지 완전 삭제, 모든 스와이프 기록 정리, 채팅 바뀌면 손대지 않음) |
| `viewer-swipe.mjs` | 큰 그림 좌우 넘기기·←/→ 키, 끝에서 처음으로 순환, 확대 중엔 넘기지 않음 |
| `zoom.mjs` | 큰 그림 확대(두 손가락·두 번 톡톡·휠·더블클릭·끌기·버튼·+/−/0 키) |
| `chat-helpers.mjs` | 씬북+ CSS, 터치 화면에서 도구 아이콘 탭해야 보이기, 버전 ‹ › 바로 넘기기 + 자체 저장 큐 |
| `analysis-response.mjs` | AI가 장면 쓰기 응답 읽기 보강(설명 문장·`<think>`·코드블록 섞여도), 분석 답 길이 설정(자동/직접 입력) |
| `update-reload.mjs` | manifest `hooks.update`로 업데이트 뒤 자동 새로고침(답변 받는 중엔 대기, 입력창에 글 있으면 안 함) |

## 3. 완성된 기능 (사용자에게 설명할 때 쓰는 말)

1. **문단 뒤(자동):** 표시 → 그림 위치. AI가 장면마다 어울리는 문단 뒤에 그림을 둠. 번역 화면에서도 문단 순서로 같은 자리를 찾음.
2. **그림체 프리셋:** 그림 설정 맨 위 빠른 선택, 프리셋 · 백업의 "적용 중" 표시, 직접 고른 프리셋으로 재생성, 그림 고치기(연필)에서 그 그림만 다른 프리셋으로(크기·시드 유지), 큰 그림 제목 "삽화 · 프리셋 이름", 장면 편집 → 최종 확인에 확인용 표시.
3. **큰 그림 보기:** 확대, 채팅 삽화는 같은 장면 버전끼리 넘기기(채팅도 그 버전으로 바뀜), 갤러리는 다른 그림으로, 끝↔처음 순환.
4. **갤러리 삭제:** ⋯ → 삭제 → 실리에서만 삭제 / 완전히 삭제. 고른 그림엔 체크 표시만(테두리 없음).
5. **AI 장면 쓰기:** 그림 설정 → 수동 분석 → 분석 답 길이(자동/직접 입력). 빈 답이면 안내.
6. **편의:** 터치 화면 도구 아이콘, 갤러리 닫아도 확장 칸 유지, 버전 ‹ › 바로 넘기기, 업데이트 뒤 자동 새로고침, 삽화 위 아이콘 흰색 고정.

### 원본 0.6.2와 다른 점 (사용자에게 설명한 내용)

원본에 아예 없는 기능은 사실상 없음. 차이는 동작 방식:
- 씬북+에만: 이름 "씬북+", '프리셋 · 백업' 펼침 유지, 프리셋 줄의 "적용 중" 배지, 그림 고치기 프리셋 칸 위치(AI로 고쳐 쓰기와 장면 사이)·최종 프롬프트 그림에서도 보임, "앞으로 그릴 그림에도 적용"은 메인 프롬프트·제외할 요소·그림체만 저장, 업데이트 뒤 새로고침은 답변 받는 중엔 기다리고 입력창에 글 있으면 안 함.
- 방식이 다름: 재생성 그림체(씬북+는 직접 고른 프리셋일 때만 / 원본은 설정이 프리셋과 같기만 하면), 큰 그림 제목(씬북+ "삽화 · 프리셋" / 원본 "모델 · 크기 · Seed · 프리셋"), 갤러리 삭제(씬북+ ⋯ → 삭제 / 원본 고르기 + 숨긴 그림 되살리기), 터치 버튼(씬북+ 늘 한 번 누르면 보이기 / 원본은 항상 보이기도 선택), 문단 뒤(자동)·확대·넘기기·분석 답 길이 화면·응답 읽기는 코드가 다름.

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
- 코드 검토(/code-review)로 9건 수정함. "프리셋 빠른 선택은 자동 삽화를 끄지 않음"은 사용자에게 설명한 의도된 동작이라 유지.

## 5. 원본 업데이트 합치기

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
  - 0.6.2-add.2에서 st-gen·ver·wrap·zoom·sel·ed·len2·fix·merge·tabs 모두 통과함. add.3·add.4에서 style·merge·tabs 통과.
- 인자로 스크린샷 경로를 받는 스크립트는 `.png`로 끝나는 경로를 넘길 것.
- 깡통(kkangtong.xyz)은 이 작업 환경에서 접속이 안 됨.

## 7. 깡통 소개 글(글꾸)

- 최종본: `notes/post/kkangtong-post.html` (맨 위 소개 문장은 사용자가 고친 대로 반영함. 실제 올린 글과 다를 수 있으니 확인할 것)
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
- **업데이트 멈춤 중.** 사용자가 다시 원하면 원본 최신 병합 + 테스트. (0.6.2까지 병합 완료, 원칙은 위 1번)
- 저장소 기본 브랜치가 `claude/scenebook-extension-features-jxvwlo` 하나뿐 → 필요하면 `main`으로 정리하는 것 제안해 둠(사용자 결정 대기).
