// 씬북+ · 업데이트 뒤 자동 새로고침
// 실리는 확장 하나를 업데이트하면 '새로고침하세요' 알림만 띄웁니다. manifest.json의 hooks.update로
// 업데이트가 끝나면 이 함수가 불리고, 잠깐 알림을 보여 준 뒤 페이지를 새로고침합니다.
// 실리는 업데이트 전의 manifest를 쓰므로, 이 기능이 들어간 버전을 받은 다음 업데이트부터 동작합니다.
export function reloadAfterUpdate(){
    try{toastr.info('잠시 후 페이지를 새로고침합니다.','씬북+ 업데이트 완료',{timeOut:1500});}catch{}
    setTimeout(()=>location.reload(),1500);
}
