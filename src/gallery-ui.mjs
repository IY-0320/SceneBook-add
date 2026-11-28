import { sceneLabel, sceneHint } from './scene-label.mjs';
import { el, button, iconButton, actionMenu, modal, inspect, notice } from './ui.mjs';
import { openViewer } from './addon/viewer.mjs'; // [add] 씬북+ 큰 그림 보기
import { formatFilter, rememberFormats } from './addon/gallery-format.mjs'; // [add] 씬북+ 그림 형식 칸

// The server's job list is read once and reused; it is read again on request
// or after a couple of minutes. New pictures of this chat come from the chat itself.
let serverJobs=null;
export async function galleryPage(page,{api,open,isCurrent,forced}) {
    const refresh=()=>open('gallery',true);
    const bar=el('div','ap2-gallery-toolbar'),search=el('input'),filter=el('select');
    search.type='search';search.placeholder='프롬프트 검색';search.setAttribute('aria-label','갤러리 검색');
    filter.setAttribute('aria-label','갤러리 범위');
    for(const [value,label]of [['done','전체 삽화'],['chat','이 채팅'],['failed','미완료']]){const option=el('option','',label);option.value=value;filter.append(option);}
    const plusFormat=formatFilter(el);rememberFormats(api.chatImages()); // [add] 그림 형식 칸 (이 채팅 그림 형식 기록)
    bar.append(search,filter,plusFormat.select,actionMenu([{label:'새로고침',icon:'fa-rotate-right',run:refresh},{label:'채팅 내보내기',icon:'fa-file-export',run:()=>api.exportChat()},{label:'삭제',icon:'fa-trash-can',danger:true,run:()=>startDelete()}])); // [add] 삭제
    const count=el('p','ap2-muted'),list=el('div','ap2-gallery'),pager=el('div','ap2-gallery-pager');count.setAttribute('role','status');
    page.append(bar,count,list,pager);count.textContent='그림을 불러오는 중…';
    // [add] 삭제: 팝업 없이 갤러리 안에서 방식 선택 → 그림 선택 → 확인 순서로 진행합니다.
    let deleteStage='',deleteMode='',loaded=false;const picked=new Map(),deleteBar=el('div','ap2-actions'),deleteInfo=el('p','ap2-muted'),deleteNote=el('p','ap2-muted');
    deleteBar.hidden=true;deleteBar.style.cssText='position:sticky;bottom:0;z-index:3;padding:10px;border:1px solid var(--ap2-line);border-radius:14px;background:var(--ap2-surface)';
    deleteInfo.style.cssText=deleteNote.style.cssText='flex-basis:100%;margin:0';
    page.append(deleteBar);
    const refreshBar=()=>{
        deleteBar.hidden=!deleteStage;if(!deleteStage){deleteBar.replaceChildren();return;}
        const full=deleteMode==='full',cancel=button('취소',()=>setStage(''));
        if(deleteStage==='choose'){
            deleteInfo.textContent='삭제 방식을 고르세요';
            deleteNote.textContent='실리에서만 삭제: 씬북 갤러리에서만 안 보이게 합니다. 이미지 파일은 그대로 남습니다. / 완전히 삭제: 갤러리에서 안 보이게 하고, 백업된 이미지 파일도 지웁니다. 되돌릴 수 없습니다.';
            const hide=button('실리에서만 삭제',()=>{deleteMode='hide';picked.clear();setStage('pick');},false,'fa-eraser');
            const wipe=button('완전히 삭제',()=>{deleteMode='full';picked.clear();setStage('pick');},false,'fa-trash-can');wipe.classList.add('ap2-danger');
            deleteBar.replaceChildren(deleteInfo,deleteNote,hide,wipe,cancel);
        }else if(deleteStage==='pick'){
            const next=button('삭제',()=>setStage('confirm'),true,'fa-trash-can');next.disabled=!picked.size;
            deleteInfo.textContent=`${full?'완전히 삭제':'실리에서만 삭제'} · ${picked.size}개 선택 · 지울 그림을 눌러 고르세요`;
            deleteBar.replaceChildren(deleteInfo,cancel,next);
        }else{
            deleteInfo.textContent=full?`선택한 ${picked.size}개를 갤러리에서 지우고 백업된 이미지 파일도 삭제합니다. 되돌릴 수 없으며, 지금 열린 채팅에서는 해당 그림이 사라집니다. 다른 채팅에 넣어 둔 그림은 깨져 보일 수 있습니다.`:`선택한 ${picked.size}개를 씬북 갤러리에서만 안 보이게 합니다. 채팅과 이미지 파일은 그대로 남습니다.`;
            const go=button(full?'완전히 삭제':'실리에서만 삭제',async()=>{go.disabled=true;try{await runDelete();}catch(e){go.disabled=false;throw e;}},true,'fa-trash-can');if(full)go.classList.add('ap2-danger');
            deleteBar.replaceChildren(deleteInfo,button('뒤로',()=>setStage('pick')),go);
        }
        if(deleteStage!=='pick')deleteBar.scrollIntoView({block:'nearest'});
    };
    const setStage=stage=>{deleteStage=stage;if(!stage){deleteMode='';picked.clear();}refreshBar();render();};
    const startDelete=()=>{if(!loaded)throw new Error('갤러리를 불러온 뒤 다시 시도하세요.');setStage('choose');};
    const runDelete=async()=>{
        const chosen=[...picked.values()];if(!chosen.length)throw new Error('삭제할 그림을 선택하세요.');
        const full=deleteMode==='full';
        if(scope!==api.contextKey())throw new Error('채팅이 바뀌었습니다. 갤러리를 새로고침해 주세요.');
        const result=await api.deleteImages(chosen,full);
        notice(full?`${result.deleted}개의 이미지 파일을 삭제했습니다.${result.failed?` ${result.failed}개는 파일을 지우지 못했습니다.`:''}${result.chatChanged?' 지우는 중 채팅이 바뀌어 원래 채팅의 삽화 기록은 그대로입니다.':''}`:`${result.hidden}개를 갤러리에서 숨겼습니다.`,!!result.failed||!!result.chatChanged);
        deleteStage='';deleteMode='';picked.clear();if(full)serverJobs=null;return refresh();
    };
    // 선택 표시: 고른 그림에는 오른쪽 위 체크 표시만 붙입니다.
    const mark=(card,job)=>{
        const on=(deleteStage==='pick'||deleteStage==='confirm')&&picked.has(job.id);
        card.querySelectorAll('.ap2-pick-mark').forEach(n=>n.remove());
        if(!on)return;
        if(getComputedStyle(card).position==='static')card.style.position='relative';
        const m=el('b','ap2-pick-mark','✓');m.style.cssText='position:absolute;top:6px;right:6px;z-index:3;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--ap2-fg);color:var(--ap2-on);font-size:.85em;pointer-events:none';
        card.append(m);
    };
    const scope=api.contextKey(),chatJobs=api.chatImages(),chatIds=new Set(chatJobs.map(j=>j.id));let recent=[],failure='';
    if(forced||!serverJobs||Date.now()-serverJobs.time>120000){try{serverJobs={time:Date.now(),jobs:await api.jobs()};}catch(e){failure=e.message;}}
    recent=serverJobs?.jobs??[];
    if(!isCurrent(page))return;
    if(scope!==api.contextKey()){count.textContent='채팅이 바뀌었습니다. 새로고침을 눌러 주세요.';return;}
    // Retain older images saved with this chat, even beyond the server's recent
    // 100-record window. Deduplicate regenerated images by their stable job ID.
    const hiddenIds=new Set(api.deletedJobs?.()??[]); // [add] 갤러리에서 숨긴 그림
    // The chat's copy adds what only the client knows, such as the preset and a page's panels.
    const byId=new Map(recent.map(job=>[job.id,job]));for(const job of chatJobs)byId.set(job.id,{...byId.get(job.id),...job});
    const jobs=[...byId.values()].filter(job=>!hiddenIds.has(job.id)).sort((a,b)=>new Date(b.created)-new Date(a.created));
    let pageIndex=0;const size=24;
    const previous=iconButton('이전 페이지','fa-chevron-left',()=>{pageIndex--;render();}),next=iconButton('다음 페이지','fa-chevron-right',()=>{pageIndex++;render();}),pageNumber=el('span','ap2-muted');pager.append(previous,pageNumber,next);
    function render(){
        const query=search.value.trim().toLocaleLowerCase();
        const matches=jobs.filter(job=>{
            const ready=job.status==='done'&&api.isImage(job.url);
            if(filter.value==='failed'?ready:!ready)return false;
            if(filter.value==='chat'&&!chatIds.has(job.id))return false;
            if(!plusFormat.matches(job))return false; // [add] 그림 형식
            return !query||[job.scene?.title,job.scene?.prompt,...(job.scene?.characters??[]).map(c=>c.name)].join(' ').toLocaleLowerCase().includes(query);
        });
        const pages=Math.max(1,Math.ceil(matches.length/size));pageIndex=Math.max(0,Math.min(pageIndex,pages-1));list.replaceChildren();
        count.textContent=`${matches.length}개 · ${plusFormat.label()?`${plusFormat.label()} · `:''/* [add] */}${filter.value==='chat'?'현재 채팅':`최근 서버 기록${recent.length>=100?' 100개':''} + 현재 채팅`}${failure?' · 서버 기록을 불러오지 못했습니다':''}`;count.title=failure;
        if(!matches.length)list.append(el('p','ap2-empty',query?'검색 결과가 없습니다.':'표시할 그림이 없습니다.'));
        for(const job of matches.slice(pageIndex*size,(pageIndex+1)*size)){
            const label=sceneLabel(job.scene),title=sceneHint(job.scene)||'삽화',ready=job.status==='done'&&api.isImage(job.url);
            const card=button('',()=>{
                if(deleteStage){if(deleteStage==='pick'&&ready){if(picked.has(job.id))picked.delete(job.id);else picked.set(job.id,job);mark(card,job);refreshBar();}return;} // [add] 삭제 선택
                if(!ready){const {body}=modal(label||'삽화');body.append(el('p','',job.error||'결과가 아직 확정되지 않았습니다.'),button('생성 기록',()=>inspect(job)));return;}
                const ensureScope=()=>{if(scope!==api.contextKey())throw new Error('채팅이 바뀌었습니다. 갤러리를 새로고침해 주세요.');};
                const build=target=>({actions:[
                    {label:'삽입',icon:'fa-plus',close:true,run:()=>{ensureScope();return api.recover(target);}},
                    {label:'편집',icon:'fa-sliders',close:true,run:()=>{ensureScope();return api.importScene(target.pageScene??target.plainScene??target.scene,target.config);}},
                ],more:[{label:'AI 검수',icon:'fa-magnifying-glass',run:()=>api.review(target)},{label:'생성 기록',icon:'fa-file-lines',run:()=>inspect(target)}]});
                // [add] 좌우로 밀면 갤러리의 이전·다음 그림으로 넘어갑니다.
                const shown=matches.filter(x=>x.status==='done'&&api.isImage(x.url));
                openViewer({items:shown,index:Math.max(0,shown.indexOf(job)),describe:build});
            });
            card.className='ap2-gallery-item';card.replaceChildren();card.title=title;card.setAttribute('aria-label',`${title} · ${ready?'이미지 보기':'작업 확인'}`);
            if(ready){const img=el('img');img.loading='lazy';img.decoding='async';img.alt='';img.src=job.url;card.append(img);}
            else card.append(el('span','ap2-gallery-failed',job.status==='failed'?'실패':job.status==='running'?'생성 중':'확인 필요'));
            // Only a title someone wrote is shown over the picture; the prompt is the tooltip.
            if(label)card.append(el('span','ap2-gallery-title',label));mark(card,job);list.append(card); // [add] mark
        }
        previous.disabled=pageIndex===0;next.disabled=pageIndex>=pages-1;pageNumber.textContent=`${pageIndex+1} / ${pages}`;pager.hidden=pages<2;
    }
    for(const control of [search,filter,plusFormat.select]/* [add] */)control.addEventListener('input',()=>{pageIndex=0;render();});render();loaded=true; // [add] loaded
}
