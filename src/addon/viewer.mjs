// 씬북+ · 큰 그림 보기
// 원본 0.5.4부터 원본에도 큰 그림 보기(src/viewer.mjs)가 생겼지만, 씬북+는 자기 방식을 씁니다.
// - 좌우로 밀기 · ←/→ 키로 넘기기, 끝에서 처음으로 순환 (viewer-swipe.mjs)
// - 두 손가락 · 두 번 톡톡 · 휠 · 더블클릭 · 버튼 · +/−/0 키로 확대 (zoom.mjs)
// - 제목: 삽화 · 그림체 프리셋 이름
// 원본 openViewer와 같은 모양으로 불러 쓸 수 있게 만들었습니다: openViewer({items,index,describe,onShow}) → {dialog,show}
import { MODELS, safeImagePath } from '../../plugin/core.mjs';
import { el, button, iconButton, actionMenu, modal } from '../ui.mjs';
import { sceneLabel } from '../scene-label.mjs';
import { enableSequence } from './viewer-swipe.mjs';
import { enableZoom } from './zoom.mjs';
import { styleName } from './style-presets.mjs';

// 원본 style.css가 큰 그림 화면을 자기 구조에 맞게 바꿔서, 씬북+ 화면에 필요한 모양만 다시 정합니다.
const CSS=[
    '.ap2-dialog.ap2-viewer.ap2-plus-viewer .ap2-body{display:grid;place-items:center;padding:0;overflow:hidden}',
    '.ap2-dialog.ap2-viewer.ap2-plus-viewer .ap2-full{transition:none;transform-origin:0 0}',
].join('\n');
function addStyle(){if(document.getElementById('ap2-plus-viewer-css'))return;const css=document.createElement('style');css.id='ap2-plus-viewer-css';css.textContent=CSS;document.head.append(css);}

export function openViewer({items,index=0,describe=()=>({}),onShow=()=>{}}){
    addStyle();
    const job=items[index]??items[0];
    if(!job||!safeImagePath(job.url))throw new Error('이미지 경로를 확인할 수 없습니다.');
    const sequence=items.length>1?{jobs:items,build:target=>{onShow(target);return describe(target);}}:null;
    // sequence가 있으면 "n / 전체"를 함께 보여 주고 좌우로 넘길 수 있습니다.
    const info=(target,at=-1)=>[MODELS[target.config?.model]?.label,target.config?.width&&`${target.config.width} × ${target.config.height}`,target.seed!==undefined&&`Seed ${target.seed}`,sequence&&at>=0&&`${at+1} / ${sequence.jobs.length}`].filter(Boolean).join(' · ');
    const start=sequence?Math.max(0,items.indexOf(job)):-1;
    // 제목: 삽화 · 그림체 프리셋 이름
    const heading=target=>[sceneLabel(target.scene)||'삽화',target.preset||styleName(target.config)].filter(Boolean).join(' · ');
    const label=sceneLabel(job.scene)||'삽화',{dialog,body}=modal(heading(job),info(job,start));dialog.classList.add('ap2-viewer','ap2-plus-viewer');
    const img=el('img','ap2-full');img.src=job.url;img.alt=label;body.append(img);
    const zoom=enableZoom(body,img,iconButton);
    const footer=el('footer','ap2-footer ap2-viewer-footer');
    const run=item=>{if(item.close)dialog.close();return item.run();};
    const fill=(target,list,extra)=>{
        footer.replaceChildren();
        for(const item of list){const b=button(item.label,()=>run(item),false,item.icon??'');if(item.danger)b.classList.add('ap2-danger');footer.append(b);}
        const download=el('a','ap2-button');download.href=target.url;download.download=`${target.id}.png`;download.title='원본 PNG 저장';download.setAttribute('aria-label','원본 PNG 저장');
        const glyph=el('i','fa-solid fa-download');glyph.setAttribute('aria-hidden','true');download.append(glyph,el('span','','저장'));footer.append(download);
        if(extra.length)footer.append(actionMenu(extra.map(item=>({...item,run:()=>run(item)}))));
    };
    const first=describe(job);fill(job,first.actions??[],first.more??[]);dialog.append(footer);
    const show=(target,at,step)=>{
        zoom.reset();
        dialog.querySelector('.ap2-header-title h2').textContent=heading(target);
        const sub=dialog.querySelector('.ap2-header-title p');if(sub)sub.textContent=info(target,at);
        img.src=target.url;img.alt=sceneLabel(target.scene)||'삽화';
        img.animate?.([{opacity:0,transform:`translateX(${step*48}px)`},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
        const view=sequence.build(target);fill(target,view.actions??[],view.more??[]);
    };
    if(sequence)enableSequence(dialog,{job,sequence,usable:safeImagePath,canSwipe:()=>!zoom.isZoomed(),show});
    return{dialog,show:at=>{const target=items[at];if(target&&sequence)show(target,at,0);}};
}
