// 씬북+ · 갤러리 삭제
// 실리에서만 삭제: 씬북 갤러리에서만 숨깁니다. 채팅과 이미지 파일은 그대로입니다.
// 완전히 삭제: 이미지 파일을 지우고, 갤러리와 지금 열린 채팅에서도 뺍니다. (다른 채팅은 건드리지 않습니다.)
import { host } from './host.mjs';

const hiddenKey=()=>`${host.KEY}_hidden_jobs`;
const context=()=>SillyTavern.getContext();
export function deletedJobIds(){const value=context().extensionSettings[hiddenKey()];return Array.isArray(value)?value:[];}
function rememberDeleted(ids){if(!ids.length)return;const c=context();c.extensionSettings[hiddenKey()]=[...new Set([...deletedJobIds(),...ids])].slice(-2000);c.saveSettingsDebounced();}

async function removeFromCurrentChat(ids){
    const set=new Set(ids),ctx=context();let removed=0,dirty=false;
    for(const message of ctx.chat){
        const views=message.extra?.[host.KEY]?.views;if(!views)continue;let changed=false;
        for(const view of Object.values(views))for(const slot of view.slots??[]){
            const before=slot.versions?.length??0;if(!before)continue;
            const selectedId=slot.versions[slot.selected]?.id;
            slot.versions=slot.versions.filter(version=>!set.has(version.id));
            const gone=before-slot.versions.length;if(!gone)continue;
            removed+=gone;changed=true;
            if(!slot.versions.length){slot.deleted=true;slot.hidden=true;slot.selected=0;}
            else{const kept=slot.versions.findIndex(version=>version.id===selectedId);slot.selected=kept>=0?kept:slot.versions.length-1;}
        }
        if(changed&&message.swipe_info?.[message.swipe_id??0])message.swipe_info[message.swipe_id??0].extra=structuredClone(message.extra);
        // 다른 스와이프에 남은 기록도 지웁니다. (스와이프하면 그 기록이 되살아나 깨진 그림이 보입니다.)
        for(const [i,info] of (message.swipe_info??[]).entries()){
            if(i===(message.swipe_id??0))continue;
            const other=info?.extra?.[host.KEY]?.views;if(!other)continue;
            for(const view of Object.values(other))for(const slot of view.slots??[]){
                const before=slot.versions?.length??0;if(!before)continue;
                const selectedId=slot.versions[slot.selected]?.id;
                slot.versions=slot.versions.filter(version=>!set.has(version.id));
                if(slot.versions.length===before)continue;
                changed=true;
                if(!slot.versions.length){slot.deleted=true;slot.hidden=true;slot.selected=0;}
                else{const kept=slot.versions.findIndex(version=>version.id===selectedId);slot.selected=kept>=0?kept:slot.versions.length-1;}
            }
        }
        if(changed)dirty=true;
    }
    if(removed||dirty){await ctx.saveChat();host.scheduleRender();}
    return removed;
}

export async function deleteIllustrationImages(jobs,permanent){
    const ctx=context(),result={hidden:0,deleted:0,failed:0,chatChanged:false},chatId=ctx.getCurrentChatId?.();
    if(!permanent){rememberDeleted(jobs.map(job=>job.id));result.hidden=jobs.length;return result;}
    const done=[];
    for(const job of jobs){
        if(!host.safeImagePath(job.url)){result.failed++;continue;}
        try{
            let path=String(job.url).split('?')[0].replace(/^\//,'');try{path=decodeURIComponent(path);}catch{}
            const response=await fetch('/api/images/delete',{method:'POST',headers:ctx.getRequestHeaders(),body:JSON.stringify({path})});
            if(response.ok||response.status===404){done.push(job.id);result.deleted++;}else result.failed++;
        }catch{result.failed++;}
    }
    rememberDeleted(done);result.hidden=done.length;
    // 지우는 동안 다른 채팅으로 옮겼으면 그 채팅은 건드리지 않습니다.
    if(done.length){if(context().getCurrentChatId?.()===chatId)await removeFromCurrentChat(done);else result.chatChanged=true;}
    return result;
}
