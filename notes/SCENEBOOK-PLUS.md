# 씬북+ 작업 기록 (다른 세션에서 이어서 하기)

> 새 세션에서는 이 파일을 먼저 읽고 시작하면 됩니다.
> 사용자는 개발자가 아니고 한국어로 대화합니다. 설명은 쉬운 말로, 전문 용어 없이.

## 1. 프로젝트 한눈에

- **무엇:** SillyTavern(실리) 확장 **씬북(ST-SceneBook)** 에 기능을 더한 개조판 **씬북+**.
  - 원본: https://github.com/tincansimagine/ST-SceneBook (원작자 허락 받음, GitHub 개조판 제작까지 허락 받음)
  - 이 저장소: https://github.com/IY-0320/SceneBook-add · 작업 브랜치 `claude/scenebook-extension-features-jxvwlo`
- **기반 버전:** 원본 0.6.2 (`upstream/main` = 8f26b7f). 씬북+ 버전 표기 `0.6.2-add.1`.
- **중요한 변화 (2026-11, 0.6.2 병합):** 원작자가 0.5.4에서 씬북+ 기능 거의 전부(문단 뒤 자동, 프리셋 빠른 선택·적용 중, 그림 고치기 프리셋, 갤러리 빼기·완전 삭제, 큰 그림 넘기기·확대·순환, 버전 바로 넘기기, 분석 답 길이·응답 읽기 보강, 터치 그림 버튼, 업데이트 뒤 새로고침, 갤러리 체크 표시, 아이콘 색)를 원본에 넣음. → 병합하면서 겹치는 `src/addon/` 모듈은 모두 지우고 원본 구현을 씀.
- **왜 애드온/스크립트가 아니라 개조판인가:** 원본 index.js는 아무것도 export하지 않아 바깥에서 핵심 동작(문단 자동 배치, 재생성 그림체 등)을 바꿀 수 없음. 그래서 원본 전체 + 추가 코드 구조로 만들고, 원본 업데이트는 git 병합으로 따라감.
- **원본과 동시에 켜면 안 됨.** 같은 저장 키(`autopic2`), 같은 명령어(`/scenebook`, `/scenegen`), 같은 화면 요소를 씀. 대신 설정·프리셋·삽화가 그대로 이어짐.
- **이름:** 확장 목록·확장 칸 제목·알림·마법봉 메뉴 모두 "씬북+". (원본 메뉴의 나머지 글자는 그대로 둠)

## 2. 코드 구조 원칙

- 추가 기능 코드는 **`src/addon/`** 에 모으고, 원본 파일에는 **`[add]` 표시가 붙은 짧은 연결 줄만** 넣음.
- 원본 파일 중 연결 줄이 있는 곳 (0.6.2 기준): `index.js`(설정 옮기기·마법봉 이름·예전 훅 이름), `src/studio.mjs`(이름·버전), `src/quick-edit.mjs`(프리셋 칸 위치), `src/notifications.mjs`(알림 제목), `manifest.json`, `README.md`(맨 위 안내 두 줄).
- **`style.css`는 건드리지 않음** (원본이 자주 고치는 파일).

### src/addon 파일

| 파일 | 하는 일 |
|---|---|
| `info.mjs` | 화면 이름 `씬북+`, 버전 `${CLIENT_VERSION}-add.1` |
| `migrate.mjs` | 예전 씬북+(0.5.3-add)가 따로 저장하던 `autopic2_hidden_jobs` → `autopic2.galleryHidden`, `autopic2_analysis_length` → `autopic2.analysisLength`로 한 번 옮기고 옛 키 삭제. `localStorage['scenebook-active-style']` 삭제 |

- 업데이트 훅: manifest는 원본 이름 `reloadAfterSceneBookUpdate`. 예전 씬북+ manifest의 `onSceneBookUpdate`도 index.js에서 같은 함수로 내보냄(옛 버전에서 업데이트할 때 대비).
- 예전(0.5.3-add) 씬북+ 코드는 git 기록 `bbe167e` 이전 커밋에 있음.

## 3. 씬북+에만 있는 것 (사용자에게 설명할 때 쓰는 말)

1. **이름:** 어디서나 "씬북+", 버전 뒤에 `-add.N`.
2. **그림 고치기(연필)의 그림체 프리셋 칸 위치:** AI로 고쳐 쓰기와 장면 사이 (사용자 요청). 원본은 메인 프롬프트 칸 안 맨 위. 최종 프롬프트를 직접 고친 그림에선 숨김(원본과 같음).
3. **예전 설정 옮기기:** 갤러리에서 뺀 그림·분석 답 길이.

원본에 들어가며 사용자 요청과 조금 달라진 점: 큰 그림 제목은 "삽화 · 프리셋"이 아니라 원본식 "모델 · 크기 · Seed · 프리셋 이름"(프리셋 이름은 보임). 장면 편집 최종 확인/프롬프트 탭의 프리셋 표시는 원본에 있음.

## 4. 지금까지 겪은 문제와 교훈 (같은 실수 반복 금지)

- **원본 코드는 한 줄에 여러 문장이 붙어 있음.** 줄 중간에 `// 주석`을 넣으면 뒤 코드가 주석이 됨 → 삽화가 빈 회색 칸으로 보였던 원인. 줄 중간엔 `/* */`만.
- **원본 파일 일부는 CRLF 줄바꿈.** 수정할 때 줄바꿈을 보존할 것(`notes/test-kit/patch.py` 참고, `newline=''`로 읽고 쓰기).
- **번역 확장과 다시 그리기 무한 반복:** 삽화가 지워지면 다시 붙이는 MutationObserver를 넣었다가 번역 확장과 서로 다시 그려 삽화가 사라짐 → 기능 제거. 원본은 번역 채팅에서도 잘 보여 줌.
- **실리는 휴대폰에서 `touchstart`로 열린 칸을 닫음.** 씬북 창(modal)이 mousedown만 막고 있어서 갤러리 그림을 닫으면 확장 칸도 닫혔음 → `ui.mjs` modal에서 touchstart도 막음.
- **테마가 아이콘(`<i>`)을 회색으로 칠하고, 방금 누른 칸의 outline을 지움.** 아이콘 색은 `!important`로, 선택 표시는 outline에 의존하지 않기.
- **"AI가 장면 쓰기" 실패의 진짜 원인:** 생각하는 AI(gemini 계열)가 답 길이(장면 수 × 1800, 최대 6000)를 생각에 다 써서 `content:''`, `finish_reason:'length'`. 원본에서도 실패. → 분석 답 길이 설정. (16000 자동 재요청은 사용자가 원치 않아 제거)
- **실리 saveChatDebounced는 앞 저장이 길면 포기** → 버전 넘기기는 자체 저장 큐 사용.
- **실리 manifest hooks는 업데이트 전 manifest를 씀** → 새 hook은 그 버전을 받은 다음 업데이트부터 동작.
- **터묵스가 업데이트 중 꺼지는 문제:** 확장 문제 아님(테스트로 확인). 안드로이드 Phantom Process Killer 의심. 사용자가 다음에 꺼지면 로그를 보내기로 함.
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
  - 아래 스크립트 중 일부는 예전 씬북+ 구조 기준이라 0.6.2에선 선택자가 다를 수 있음. `st-merge.cjs`(0.6.2 병합 확인: 설정 옮기기·이름·그림 고치기 프리셋 위치·재생성 설정·큰 그림 제목)가 최신.
  - `st-gen.cjs` AI 장면 쓰기 → 생성 → 문단 삽입(가짜 generateRaw·가짜 NovelAI 응답)
  - `st-len2.cjs` 분석 답 길이 설정 UI·저장·요청 길이
  - `st-ver.cjs`, `st-wrap.cjs` 버전 넘기기·순환·저장
  - `st-zoom.cjs` 휴대폰(Pixel 7) 확대·갤러리 닫기
  - `st-sel.cjs` 갤러리 선택 표시·아이콘 색, `st-qe.cjs` 그림 고치기 프리셋, `st-ed.cjs` 최종 확인 표시
  - `st-fix.cjs` 완전 삭제(스와이프 정리)·확대 중 키·업데이트 훅, `st-hook.cjs` 실제 업데이트 후 자동 새로고침
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
- 원본 씬북이 업데이트되면 병합 + 테스트. (0.6.2까지 병합 완료)
- 저장소 기본 브랜치가 `claude/scenebook-extension-features-jxvwlo` 하나뿐 → 필요하면 `main`으로 정리하는 것 제안해 둠(사용자 결정 대기).
