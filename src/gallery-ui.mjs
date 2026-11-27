import { sceneLabel, sceneHint } from './scene-label.mjs';
import { el, button, iconButton, actionMenu, modal, inspect, confirmAction, notice, setText, setFlag } from './ui.mjs';
import { openViewer } from './viewer.mjs';

// The server's job list is read once and reused; it is read again on request
// or after a couple of minutes. New pictures of this chat come from the chat itself.
let serverJobs=null;
const VIEWS=[['done','전체 삽화'],['chat','이 채팅'],['hidden','숨긴 그림'],['failed','미완료']];
export async function galleryPage(page,{api,open,isCurrent,forced}) {
    const refresh=()=>open('gallery',true);
    const bar=el('div','ap2-gallery-toolbar'),search=el('input'),filter=el('select');
    search.type='search';search.placeholder='프롬프트 검색';search.setAttribute('aria-label','갤러리 검색');
    filter.setAttribute('aria-label','갤러리 범위');
    for(const [value,label]of VIEWS){const option=el('option','',label);option.value=value;filter.append(option);}
    const selectButton=button('고르기',()=>setSelecting(!selecting),false,'fa-check-double');selectButton.title='여러 장을 골라 숨기거나 삭제합니다.';
    bar.append(search,filter,selectButton,actionMenu([{label:'새로고침',icon:'fa-rotate-right',run:refresh},{label:'채팅 내보내기',icon:'fa-file-export',run:()=>api.exportChat()}]));
    // Shown while choosing: how many are chosen and what to do with them.
    const tray=el('div','ap2-gallery-tray'),trayCount=el('span','ap2-gallery-tray-count'),trayActions=el('div','ap2-actions');tray.append(trayCount,trayActions);tray.hidden=true;
    const count=el('p','ap2-muted'),list=el('div','ap2-gallery'),pager=el('div','ap2-gallery-pager');count.setAttribute('role','status');
    page.append(bar,tray,count,list,pager);count.textContent='그림을 불러오는 중…';
    const scope=api.contextKey(),chatJobs=api.chatImages(),chatIds=new Set(chatJobs.map(j=>j.id));let recent=[],failure='';
    if(forced||!serverJobs||Date.now()-serverJobs.time>120000){try{serverJobs={time:Date.now(),jobs:await api.jobs()};}catch(e){failure=e.message;}}
    recent=serverJobs?.jobs??[];
    if(!isCurrent(page))return;
    if(scope!==api.contextKey()){count.textContent='채팅이 바뀌었습니다. 새로고침을 눌러 주세요.';return;}
    // Retain older images saved with this chat, even beyond the server's recent
    // 100-record window. Deduplicate regenerated images by their stable job ID.
    // The chat's copy adds what only the client knows, such as the preset and a page's panels.
    const byId=new Map(recent.map(job=>[job.id,job]));for(const job of chatJobs)byId.set(job.id,{...byId.get(job.id),...job});
    let jobs=[...byId.values()].sort((a,b)=>new Date(b.created)-new Date(a.created));
    let pageIndex=0,selecting=false,matches=[];const size=24,chosen=new Set();
    const previous=iconButton('이전 페이지','fa-chevron-left',()=>{pageIndex--;render();}),next=iconButton('다음 페이지','fa-chevron-right',()=>{pageIndex++;render();}),pageNumber=el('span','ap2-muted');pager.append(previous,pageNumber,next);
    const ready=job=>job.status==='done'&&api.isImage(job.url);
    const hidden=()=>new Set(api.settings().galleryHidden??[]);
    // Hiding keeps the chat and the file; deleting removes the file and takes the picture out of this chat.
    async function hide(ids,value){
        await api.hideFromGallery(ids,value);
        notice(value?`갤러리에서 ${ids.length}장을 뺐습니다. 범위의 “숨긴 그림”에서 되살릴 수 있습니다.`:`${ids.length}장을 갤러리에 다시 보이게 했습니다.`);
        chosen.clear();render();
    }
    async function remove(items){
        const inChat=items.filter(job=>chatIds.has(job.id)).length;
        if(!await confirmAction('완전히 삭제',`${items.length}장의 이미지 파일을 지웁니다.${inChat?` 지금 채팅에 들어간 ${inChat}장도 채팅에서 빠집니다.`:''} 되돌릴 수 없습니다.`,'완전히 삭제'))return false;
        const done=await api.deleteImages(items);
        jobs=jobs.filter(job=>!done.includes(job.id));chosen.clear();render();
        notice(done.length===items.length?`${done.length}장을 삭제했습니다.`:`${done.length}장을 삭제했습니다. ${items.length-done.length}장은 지우지 못했습니다.`,done.length!==items.length);
        return true;
    }
    function setSelecting(value){selecting=value;chosen.clear();setFlag(selectButton,'aria-pressed',value);setText(selectButton.querySelector('span'),value?'고르기 끝':'고르기');render();}
    function renderTray(){
        tray.hidden=!selecting;if(!selecting)return;
        setText(trayCount,chosen.size?`${chosen.size}장 고름`:'그림을 눌러 고르세요');
        const items=jobs.filter(job=>chosen.has(job.id)),none=!items.length;
        trayActions.replaceChildren(
            button('이 쪽 모두',()=>{for(const job of matches.slice(pageIndex*size,(pageIndex+1)*size))chosen.add(job.id);render();},false,'fa-square-check'),
            filter.value==='hidden'?button('다시 보이기',()=>hide(items.map(j=>j.id),false),false,'fa-eye'):button('갤러리에서 빼기',()=>hide(items.map(j=>j.id),true),false,'fa-eye-slash'),
            button('완전히 삭제',()=>remove(items),false,'fa-trash-can'),
        );
        const [,toggle,erase]=trayActions.children;toggle.disabled=erase.disabled=none;erase.classList.add('ap2-danger');
    }
    function render(){
        const query=search.value.trim().toLocaleLowerCase(),gone=hidden(),view=filter.value;
        matches=jobs.filter(job=>{
            if(view==='failed'?ready(job):!ready(job))return false;
            if(view==='hidden'?!gone.has(job.id):gone.has(job.id))return false;
            if(view==='chat'&&!chatIds.has(job.id))return false;
            return !query||[job.scene?.title,job.scene?.prompt,...(job.scene?.characters??[]).map(c=>c.name)].join(' ').toLocaleLowerCase().includes(query);
        });
        const pages=Math.max(1,Math.ceil(matches.length/size));pageIndex=Math.max(0,Math.min(pageIndex,pages-1));list.replaceChildren();
        count.textContent=`${matches.length}개 · ${view==='chat'?'현재 채팅':view==='hidden'?'갤러리에서 뺀 그림':`최근 서버 기록${recent.length>=100?' 100개':''} + 현재 채팅`}${failure?' · 서버 기록을 불러오지 못했습니다':''}`;count.title=failure;
        if(!matches.length)list.append(el('p','ap2-empty',query?'검색 결과가 없습니다.':view==='hidden'?'갤러리에서 뺀 그림이 없습니다.':'표시할 그림이 없습니다.'));
        list.classList.toggle('is-selecting',selecting);
        for(const job of matches.slice(pageIndex*size,(pageIndex+1)*size)){
            const label=sceneLabel(job.scene),title=sceneHint(job.scene)||'삽화',isReady=ready(job);
            const card=button('',()=>{
                if(selecting){chosen.has(job.id)?chosen.delete(job.id):chosen.add(job.id);setFlag(card,'aria-pressed',chosen.has(job.id));renderTray();return;}
                if(!isReady){const {body}=modal(label||'삽화');body.append(el('p','',job.error||'결과가 아직 확정되지 않았습니다.'),button('생성 기록',()=>inspect(job)));return;}
                openGalleryViewer(job);
            });
            card.className='ap2-gallery-item';card.replaceChildren();card.title=title;card.setAttribute('aria-label',`${title} · ${selecting?'고르기':isReady?'이미지 보기':'작업 확인'}`);
            if(selecting)setFlag(card,'aria-pressed',chosen.has(job.id));
            if(isReady){const img=el('img');img.loading='lazy';img.decoding='async';img.alt='';img.src=job.url;card.append(img);}
            else card.append(el('span','ap2-gallery-failed',job.status==='failed'?'실패':job.status==='running'?'생성 중':'확인 필요'));
            // Only a title someone wrote is shown over the picture; the prompt is the tooltip.
            if(label)card.append(el('span','ap2-gallery-title',label));
            const tick=el('span','ap2-gallery-check');tick.setAttribute('aria-hidden','true');card.append(tick);
            list.append(card);
        }
        previous.disabled=pageIndex===0;next.disabled=pageIndex>=pages-1;pageNumber.textContent=`${pageIndex+1} / ${pages}`;pager.hidden=pages<2;
        renderTray();
    }
    function openGalleryViewer(job){
        const ensureScope=()=>{if(scope!==api.contextKey())throw new Error('채팅이 바뀌었습니다. 갤러리를 새로고침해 주세요.');};
        // The viewer moves through the same filtered list the grid shows, page after page.
        const shown=matches.filter(ready);
        const view=openViewer({items:shown,index:Math.max(0,shown.indexOf(job)),describe:item=>({actions:[
            {label:'삽입',icon:'fa-plus',close:true,run:()=>{ensureScope();return api.recover(item);}},
            {label:'편집',icon:'fa-sliders',close:true,run:()=>{ensureScope();return api.importScene(item.pageScene??item.scene,item.config);}},
        ],more:[
            {label:'AI 검수',icon:'fa-magnifying-glass',run:()=>api.review(item)},
            {label:'생성 기록',icon:'fa-file-lines',run:()=>inspect(item)},
            hidden().has(item.id)?{label:'갤러리에 다시 보이기',icon:'fa-eye',close:true,run:()=>hide([item.id],false)}:{label:'갤러리에서 빼기',icon:'fa-eye-slash',close:true,run:()=>hide([item.id],true)},
            {label:'완전히 삭제',icon:'fa-trash-can',danger:true,run:async()=>{if(await remove([item]))view.dialog.close();}},
        ]})});
    }
    for(const control of [search,filter])control.addEventListener('input',()=>{pageIndex=0;chosen.clear();render();});render();
}
