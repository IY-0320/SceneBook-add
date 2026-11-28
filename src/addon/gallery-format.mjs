// 씬북+ · 갤러리 '그림 형식' 칸
// '이 채팅'·'전체 삽화' 칸 옆에서 그림 형식(삽화·웹툰 컷·흑백 만화·컬러 만화·세로 웹툰)만 골라 봅니다.
// 범위 칸과 함께 걸러지므로 '이 채팅' + '웹툰 컷'이면 이 채팅의 웹툰 컷만 보입니다.
import { PAGE_FORMATS } from '../comic.mjs';

const ALL='all';
let remembered=ALL; // 갤러리를 다시 그려도 고른 형식 유지

// 그림 형식 기록: 채팅에 남은 표시(job.cut, job.pageScene)는 그 채팅이 열려 있을 때만 보이므로,
// 다른 채팅 그림도 '전체 삽화'에서 형식별로 고를 수 있게 그림 ID별 형식을 설정 파일에 적어 둡니다.
// 삽화(single)는 적지 않습니다(기록이 없으면 삽화). 저장 키: extensionSettings.autopic2_job_formats
const STORE='autopic2_job_formats',LIMIT=20000;
const stContext=()=>{try{return SillyTavern.getContext();}catch{return null;}};
const saved=()=>{const v=stContext()?.extensionSettings?.[STORE];return v&&typeof v==='object'&&!Array.isArray(v)?v:{};};
// 채팅에 남은 표시로 아는 형식 (모르면 '')
function knownFormat(job){
    if(job?.cut)return 'cuts';
    const page=job?.pageScene?.pageFormat;
    if(page&&page!=='single'&&PAGE_FORMATS.some(([id])=>id===page))return page;
    return job?.pageScene||job?.plainScene?'single':'';
}
// 지금 채팅의 그림(또는 방금 그린 그림)의 형식을 적어 둡니다.
export function rememberFormats(jobs){
    const c=stContext();if(!c?.extensionSettings)return;
    const next={...saved()};let changed=false;
    for(const job of jobs??[]){
        const format=knownFormat(job);if(!job?.id||!format)continue;
        if(format==='single'){if(next[job.id]){delete next[job.id];changed=true;}continue;}
        if(next[job.id]!==format){next[job.id]=format;changed=true;}
    }
    if(!changed)return;
    const ids=Object.keys(next);for(const id of ids.slice(0,Math.max(0,ids.length-LIMIT)))delete next[id];
    c.extensionSettings[STORE]=next;c.saveSettingsDebounced?.();
}
// 기록도 표시도 없는 예전 그림: 서버에 남은 프롬프트의 페이지 문장으로 짐작합니다.
// 웹툰 컷과 세로 웹툰은 같은 문장을 써서 구분이 안 되므로 둘 다 해당하는 것으로 봅니다.
function guessFormats(job){
    const prompt=String(job?.scene?.prompt??'').toLowerCase();
    if(/black and white manga page/.test(prompt))return['manga'];
    if(/full color comic page/.test(prompt))return['comic'];
    if(/vertical webtoon strip/.test(prompt))return['cuts','webtoon'];
    return['single'];
}
// 그림 한 장이 해당하는 형식들
export function formatsOf(job){
    const known=knownFormat(job);if(known)return[known];
    const recorded=saved()[job?.id];if(recorded)return[recorded];
    return guessFormats(job);
}
export function formatFilter(el){
    const select=el('select');select.setAttribute('aria-label','그림 형식');select.className='ap2-plus-gallery-format';
    for(const [value,label]of [[ALL,'모든 형식'],...PAGE_FORMATS.map(([id,label])=>[id,label])]){const option=el('option','',label);option.value=value;select.append(option);}
    select.value=remembered;
    select.addEventListener('input',()=>{remembered=select.value;});
    return{
        select,
        matches:job=>select.value===ALL||formatsOf(job).includes(select.value),
        label:()=>select.value===ALL?'':PAGE_FORMATS.find(([id])=>id===select.value)?.[1]??'',
    };
}
