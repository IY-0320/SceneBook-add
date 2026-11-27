// 씬북+ · 업데이트 뒤 자동 새로고침
// 실리는 확장 하나를 업데이트하면 '새로고침하세요' 알림만 띄웁니다. manifest.json의 hooks.update로
// 업데이트가 끝나면 이 함수가 불리고, 잠깐 알림을 보여 준 뒤 페이지를 새로고침합니다.
// 실리는 업데이트 전의 manifest를 쓰므로, 이 기능이 들어간 버전을 받은 다음 업데이트부터 동작합니다.
// 답변을 받는 중이면 끝날 때까지 기다리고, 입력창에 쓰던 글이 있으면 새로고침하지 않고 알림만 띄웁니다.
const busy=()=>{try{const c=SillyTavern.getContext();return !!c.streamingProcessor&&!c.streamingProcessor.isFinished;}catch{return false;}};
const typing=()=>!!document.getElementById('send_textarea')?.value?.trim();
export function reloadAfterUpdate(){
    const say=(message,title)=>{try{toastr.info(message,title,{timeOut:4000});}catch{}};
    if(typing()){say('입력창에 쓰던 글이 있어 자동으로 새로고침하지 않았습니다. 새로고침하면 적용됩니다.','씬북+ 업데이트 완료');return;}
    say('잠시 후 페이지를 새로고침합니다.','씬북+ 업데이트 완료');
    const started=Date.now();
    const tryReload=()=>{if(busy()&&Date.now()-started<120000){setTimeout(tryReload,1000);return;}if(!typing())location.reload();};
    setTimeout(tryReload,1500);
}
