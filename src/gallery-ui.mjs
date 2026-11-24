import { sceneLabel, sceneHint } from './scene-label.mjs';
import { el, button, iconButton, actionMenu, modal, inspect, viewer } from './ui.mjs';

export async function galleryPage(page,{api,open,isCurrent}) {
    const refresh=()=>open('gallery',true);
    const bar=el('div','ap2-gallery-toolbar'),search=el('input'),filter=el('select');
    search.type='search';search.placeholder='제목·프롬프트 검색';search.setAttribute('aria-label','갤러리 검색');
    filter.setAttribute('aria-label','갤러리 범위');
    for(const [value,label]of [['done','전체 삽화'],['chat','이 채팅'],['failed','미완료']]){const option=el('option','',label);option.value=value;filter.append(option);}
    bar.append(search,filter,actionMenu([{label:'새로고침',icon:'fa-rotate-right',run:refresh},{label:'채팅 내보내기',icon:'fa-file-export',run:()=>api.exportChat()}]));
    const count=el('p','ap2-muted'),list=el('div','ap2-gallery'),pager=el('div','ap2-gallery-pager');count.setAttribute('role','status');
    page.append(bar,count,list,pager);count.textContent='그림을 불러오는 중…';
    const scope=api.contextKey(),chatJobs=api.chatImages(),chatIds=new Set(chatJobs.map(j=>j.id));let recent=[],failure='';
    try{recent=await api.jobs();}catch(e){failure=e.message;}
    if(!isCurrent(page))return;
    if(scope!==api.contextKey()){count.textContent='채팅이 바뀌었습니다. 새로고침을 눌러 주세요.';return;}
    // Retain older images saved with this chat, even beyond the server's recent
    // 100-record window. Deduplicate regenerated images by their stable job ID.
    const jobs=[...new Map([...chatJobs,...recent].map(job=>[job.id,job])).values()].sort((a,b)=>new Date(b.created)-new Date(a.created));
    let pageIndex=0;const size=24;
    const previous=iconButton('이전 페이지','fa-chevron-left',()=>{pageIndex--;render();}),next=iconButton('다음 페이지','fa-chevron-right',()=>{pageIndex++;render();}),pageNumber=el('span','ap2-muted');pager.append(previous,pageNumber,next);
    function render(){
        const query=search.value.trim().toLocaleLowerCase();
        const matches=jobs.filter(job=>{
            const ready=job.status==='done'&&api.isImage(job.url);
            if(filter.value==='failed'?ready:!ready)return false;
            if(filter.value==='chat'&&!chatIds.has(job.id))return false;
            return !query||[job.scene?.title,job.scene?.prompt,...(job.scene?.characters??[]).map(c=>c.name)].join(' ').toLocaleLowerCase().includes(query);
        });
        const pages=Math.max(1,Math.ceil(matches.length/size));pageIndex=Math.max(0,Math.min(pageIndex,pages-1));list.replaceChildren();
        count.textContent=`${matches.length}개 · ${filter.value==='chat'?'현재 채팅':`최근 서버 기록${recent.length>=100?' 100개':''} + 현재 채팅`}${failure?' · 서버 기록을 불러오지 못했습니다':''}`;count.title=failure;
        if(!matches.length)list.append(el('p','ap2-empty',query?'검색 결과가 없습니다.':'표시할 그림이 없습니다.'));
        for(const job of matches.slice(pageIndex*size,(pageIndex+1)*size)){
            const label=sceneLabel(job.scene),title=sceneHint(job.scene)||'삽화',ready=job.status==='done'&&api.isImage(job.url);
            const card=button('',()=>{
                if(!ready){const {body}=modal(label||'삽화');body.append(el('p','',job.error||'결과가 아직 확정되지 않았습니다.'),button('생성 기록',()=>inspect(job)));return;}
                const ensureScope=()=>{if(scope!==api.contextKey())throw new Error('채팅이 바뀌었습니다. 갤러리를 새로고침해 주세요.');};
                viewer(job,{actions:[
                    {label:'삽입',icon:'fa-plus',close:true,run:()=>{ensureScope();return api.recover(job);}},
                    {label:'편집',icon:'fa-sliders',close:true,run:()=>{ensureScope();return api.importScene(job.scene,job.config);}},
                ],more:[{label:'AI 검수',icon:'fa-magnifying-glass',run:()=>api.review(job)},{label:'생성 기록',icon:'fa-file-lines',run:()=>inspect(job)}]});
            });
            card.className='ap2-gallery-item';card.replaceChildren();card.title=title;card.setAttribute('aria-label',`${title} · ${ready?'이미지 보기':'작업 확인'}`);
            if(ready){const img=el('img');img.src=job.url;img.loading='lazy';img.decoding='async';img.alt='';card.append(img);}
            else card.append(el('span','ap2-gallery-failed',job.status==='failed'?'실패':job.status==='running'?'생성 중':'확인 필요'));
            // Only a title someone wrote is shown over the picture; the prompt is the tooltip.
            if(label)card.append(el('span','ap2-gallery-title',label));list.append(card);
        }
        previous.disabled=pageIndex===0;next.disabled=pageIndex>=pages-1;pageNumber.textContent=`${pageIndex+1} / ${pages}`;pager.hidden=pages<2;
    }
    for(const control of [search,filter])control.addEventListener('input',()=>{pageIndex=0;render();});render();
}
