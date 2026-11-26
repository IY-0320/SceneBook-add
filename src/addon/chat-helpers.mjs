// 씬북+ · 채팅 화면 편의 기능
// 0) 씬북+ 전용 스타일(적용 중 배지 등)을 넣습니다.
// 1) 터치 화면에서는 삽화 위 도구 아이콘(수정·재생성)을 숨겨 두고, 그림을 한 번 누르면 잠시 보여 줍니다.
// 2) 번역 등 다른 확장이 답변 본문을 다시 그려 삽화가 지워지면 삽화를 다시 붙입니다.

// 그림을 눌렀을 때: 도구를 보여 주기만 했으면 true (이번 누름으로 큰 화면을 열지 않음)
export function revealTools(figure){
    if(!matchMedia('(hover: none)').matches||figure.dataset.tools==='open')return false;
    figure.dataset.tools='open';clearTimeout(figure._toolsTimer);
    figure._toolsTimer=setTimeout(()=>{delete figure.dataset.tools;},4000);
    return true;
}

export function initChatHelpers(scheduleRender){
    if(!document.getElementById('ap2-tools-css')){
        const css=document.createElement('style');css.id='ap2-tools-css';
        // 씬북+ 전용 스타일은 원본 style.css를 건드리지 않도록 여기서 넣습니다.
        css.textContent=[
            '@media (hover: none){.ap2-figure .ap2-image-actions{opacity:0!important;pointer-events:none}.ap2-figure[data-tools=open] .ap2-image-actions{opacity:1!important;pointer-events:auto}}',
            '.ap2-active-badge{flex:none;display:inline-flex;align-items:center;min-height:22px;padding:0 9px;border-radius:999px;background:var(--ap2-fg);color:var(--ap2-on);font-size:.74em;font-weight:600;white-space:nowrap}',
        ].join('\n');
        document.head.append(css);
    }
    document.addEventListener('click',event=>{document.querySelectorAll('.ap2-figure[data-tools=open]').forEach(f=>{if(!f.contains(event.target))delete f.dataset.tools;});},true);
    const chatBox=document.getElementById('chat');
    if(chatBox){
        const hasFigure=node=>node.nodeType===1&&(node.classList.contains('ap2-figure')||!!node.querySelector('.ap2-figure'));
        new MutationObserver(records=>{if(records.some(r=>[...r.removedNodes].some(hasFigure)))scheduleRender();}).observe(chatBox,{childList:true,subtree:true});
    }
}
