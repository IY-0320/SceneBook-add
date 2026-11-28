// 씬북+ · 갤러리 '그림 형식' 칸
// '이 채팅'·'전체 삽화' 칸 옆에서 그림 형식(삽화·웹툰 컷·흑백 만화·컬러 만화·세로 웹툰)만 골라 봅니다.
// 범위 칸과 함께 걸러지므로 '이 채팅' + '웹툰 컷'이면 이 채팅의 웹툰 컷만 보입니다.
import { PAGE_FORMATS } from '../comic.mjs';

const ALL='all';
let remembered=ALL; // 갤러리를 다시 그려도 고른 형식 유지

// 그림 한 장의 형식. 웹툰 컷은 job.cut, 만화 페이지는 job.pageScene.pageFormat에 남아 있습니다.
// 채팅에 없는 서버 기록처럼 표시가 없는 그림은 삽화로 봅니다.
export function formatOf(job){
    if(job?.cut)return 'cuts';
    const page=job?.pageScene?.pageFormat;
    return PAGE_FORMATS.some(([id])=>id===page)&&page!=='single'?page:'single';
}

export function formatFilter(el){
    const select=el('select');select.setAttribute('aria-label','그림 형식');select.className='ap2-plus-gallery-format';
    for(const [value,label]of [[ALL,'모든 형식'],...PAGE_FORMATS.map(([id,label])=>[id,label])]){const option=el('option','',label);option.value=value;select.append(option);}
    select.value=remembered;
    select.addEventListener('input',()=>{remembered=select.value;});
    return{
        select,
        matches:job=>select.value===ALL||formatOf(job)===select.value,
        label:()=>select.value===ALL?'':PAGE_FORMATS.find(([id])=>id===select.value)?.[1]??'',
    };
}
