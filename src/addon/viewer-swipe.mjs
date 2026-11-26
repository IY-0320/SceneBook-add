// 씬북+ · 큰 그림 보기에서 좌우로 밀거나(터치) ←/→ 키로 갤러리의 이전·다음 그림으로 넘어갑니다.
// sequence: {jobs: 넘겨 볼 그림 목록, build: job => {actions, more}}
// show(target, index): 화면의 그림·제목·버튼을 target으로 바꾸는 원본 viewer 쪽 함수
export function enableSequence(dialog,{job,sequence,show,usable}){
    let at=Math.max(0,sequence.jobs.findIndex(x=>x.id===job.id));
    const go=step=>{
        let next=at+step;
        while(sequence.jobs[next]&&!usable(sequence.jobs[next].url))next+=step;
        const target=sequence.jobs[next];if(!target)return;
        at=next;show(target,at,step);
        for(const n of [at-1,at+1]){const around=sequence.jobs[n];if(around&&usable(around.url))new Image().src=around.url;}
    };
    let start=null;
    dialog.addEventListener('touchstart',e=>{start=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
    dialog.addEventListener('touchend',e=>{
        if(!start)return;const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;start=null;
        if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);
    },{passive:true});
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);});
    return at;
}
