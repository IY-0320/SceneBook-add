# 원본 씬북 업데이트 합치기

씬북+는 원본 씬북의 커밋 기록을 그대로 이어받고, 그 위에 추가 기능 커밋을 얹은 구조입니다.
그래서 원본이 업데이트되면 git으로 합칠 수 있습니다.

```bash
git remote add upstream https://github.com/tincansimagine/ST-SceneBook   # 처음 한 번만
git fetch upstream
git merge upstream/main
```

충돌이 나면 대부분 `[add]` 표시가 붙은 연결 줄입니다. 원본의 새 코드를 받아들인 뒤 `[add]` 줄을 다시 넣으면 됩니다.
추가 기능 대부분은 `src/addon/`에 따로 있어서 원본 변경과 거의 겹치지 않습니다.

합친 뒤 할 일

1. `manifest.json`의 `version`을 `원본버전-add.N`으로 올립니다. (예: `0.5.4-add.1`)
2. `ADD.md`의 기반 버전을 고칩니다.
3. 원본이 `placement`(그림 위치), 갤러리, 큰 그림 보기, 프리셋 부분을 바꿨다면 그 기능을 실리에서 한 번씩 확인합니다.
