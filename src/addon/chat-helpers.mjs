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
            '.ap2-zoom-tools{position:absolute;right:10px;bottom:10px;z-index:2;display:flex;gap:6px}',
            '.ap2-dialog.ap2-viewer .ap2-zoom-tools .ap2-button{width:38px;min-height:38px;padding:0;border-radius:50%;background:#000000a6;color:#fff;backdrop-filter:blur(8px)}',
            '.ap2-dialog.ap2-viewer .ap2-zoom-tools .ap2-button:hover{background:#000000d9}',
            '.ap2-active-badge{flex:none;display:inline-flex;align-items:center;min-height:22px;padding:0 9px;border-radius:999px;background:var(--ap2-fg);color:var(--ap2-on);font-size:.74em;font-weight:600;white-space:nowrap}',
        ].join('\n');
        document.head.append(css);
    }
    document.addEventListener('click',event=>{document.querySelectorAll('.ap2-figure[data-tools=open]').forEach(f=>{if(!f.contains(event.target))delete f.dataset.tools;});},true);
}
