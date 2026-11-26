import { host } from './host.mjs';
// 씬북+ · 채팅 화면 편의 기능
// 0) 씬북+ 전용 스타일(적용 중 배지, 확대 버튼 등)을 넣습니다.
// 1) 터치 화면에서는 삽화 위 도구 아이콘(수정·재생성)을 숨겨 두고, 그림을 한 번 누르면 잠시 보여 줍니다.
// (예전의 '삽화 다시 붙이기'는 번역 확장과 서로 다시 그리기를 반복해 삽화가 사라지는 문제가 있어 뺐습니다.
//  원본 0.5.x는 번역된 채팅에서도 삽화를 잘 보여 줍니다.)

// 그림을 눌렀을 때: 도구를 보여 주기만 했으면 true (이번 누름으로 큰 화면을 열지 않음)
export function revealTools(figure){
    if(!matchMedia('(hover: none)').matches||figure.dataset.tools==='open')return false;
    figure.dataset.tools='open';clearTimeout(figure._toolsTimer);
    figure._toolsTimer=setTimeout(()=>{delete figure.dataset.tools;},4000);
    return true;
}

export function initChatHelpers(){
    if(!document.getElementById('ap2-tools-css')){
        const css=document.createElement('style');css.id='ap2-tools-css';
        // 씬북+ 전용 스타일은 원본 style.css를 건드리지 않도록 여기서 넣습니다.
        css.textContent=[
            '@media (hover: none){.ap2-figure .ap2-image-actions{opacity:0!important;pointer-events:none}.ap2-figure[data-tools=open] .ap2-image-actions{opacity:1!important;pointer-events:auto}}',
            // 삽화 위 연필·재생성 아이콘: 테마가 아이콘을 회색으로 칠해도 흰색으로 보이게 합니다.
            '.ap2-figure .ap2-image-actions .ap2-button,.ap2-figure .ap2-image-actions .ap2-button i{color:#fff!important}',
            '.ap2-figure .ap2-image-actions .ap2-button i{filter:drop-shadow(0 0 1px #000) drop-shadow(0 0 2px #0009)}',
            '.ap2-zoom-tools{position:absolute;right:10px;bottom:10px;z-index:2;display:flex;gap:6px}',
            '.ap2-dialog.ap2-viewer .ap2-zoom-tools .ap2-button i{color:#fff!important}',
            '.ap2-dialog.ap2-viewer .ap2-zoom-tools .ap2-button{width:38px;min-height:38px;padding:0;border-radius:50%;background:#000000a6;color:#fff;backdrop-filter:blur(8px)}',
            '.ap2-dialog.ap2-viewer .ap2-zoom-tools .ap2-button:hover{background:#000000d9}',
            '.ap2-active-badge{flex:none;display:inline-flex;align-items:center;min-height:22px;padding:0 9px;border-radius:999px;background:var(--ap2-fg);color:var(--ap2-on);font-size:.74em;font-weight:600;white-space:nowrap}',
        ].join('\n');
        document.head.append(css);
    }
    document.addEventListener('click',event=>{document.querySelectorAll('.ap2-figure[data-tools=open]').forEach(f=>{if(!f.contains(event.target))delete f.dataset.tools;});},true);
}

// 삽화 버전(‹ 2/4 ›)을 바꿀 때: 원본은 채팅 전체를 서버에 저장한 뒤에야 그림을 바꿔, 긴 채팅·휴대폰에서 늦게 넘어갔습니다.
// 그림은 바로 바꾸고 저장은 뒤에서(모아서) 합니다.
// 실리의 지연 저장(saveChatDebounced)은 앞 저장이 1초 넘게 걸리면 포기해 마지막 선택을 잃을 수 있어,
// 넘기기가 멈추면 저장하고, 저장 중에 또 바뀌면 끝난 뒤 한 번 더 저장합니다.
let saveTimer=0,saving=false,again=false,pendingChat=null;
async function flushSave(){
    const c=SillyTavern.getContext();
    if(pendingChat!==c.getCurrentChatId?.())return;// 그사이 다른 채팅으로 옮겼으면 저장하지 않습니다.
    if(saving){again=true;return;}
    saving=true;
    try{await c.saveChat();}catch(e){console.error('씬북+ 삽화 버전 저장 실패',e);}
    finally{saving=false;if(again){again=false;void flushSave();}}
}
export function showVersionNow(message){
    const swipe=message.swipe_info?.[message.swipe_id??0];if(swipe)swipe.extra=structuredClone(message.extra);
    host.scheduleRender();
    pendingChat=SillyTavern.getContext().getCurrentChatId?.();
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>void flushSave(),600);
}
