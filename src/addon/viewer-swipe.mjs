// 씬북+ · 큰 그림 보기에서 좌우로 밀거나(터치) ←/→ 키로 이전·다음 그림으로 넘어갑니다. 끝에서는 처음으로 돌아갑니다.
// sequence: {jobs: 넘겨 볼 그림 목록, build: job => {actions, more}}
// show(target, index): 화면의 그림·제목·버튼을 target으로 바꾸는 원본 viewer 쪽 함수
// canSwipe: 그림을 확대해 끌고 있을 때는 넘기지 않도록 false를 돌려줍니다.
export function enableSequence(dialog,{job,sequence,show,usable,canSwipe=()=>true}){
    let at=Math.max(0,sequence.jobs.findIndex(x=>x.id===job.id));
    // 끝에서 한 번 더 밀면 처음으로, 처음에서 반대로 밀면 마지막으로 돌아갑니다.
    // 그림 목록은 열린 동안에도 늘어날 수 있어(새 버전 완성) 매번 길이를 다시 읽습니다.
    const wrap=n=>{const count=sequence.jobs.length;return((n%count)+count)%count;};
    const go=step=>{
        const count=sequence.jobs.length;if(count<2)return;
        let next=wrap(at+step),tries=0;
        while(!usable(sequence.jobs[next]?.url)&&tries++<count)next=wrap(next+step);
        if(next===at||!usable(sequence.jobs[next]?.url))return;
        at=next;show(sequence.jobs[at],at,step);
        for(const n of [wrap(at-1),wrap(at+1)]){const around=sequence.jobs[n];if(around&&usable(around.url))new Image().src=around.url;}
    };
    let start=null;
    dialog.addEventListener('touchstart',e=>{start=e.touches.length===1&&canSwipe()?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
    dialog.addEventListener('touchend',e=>{
        if(!start||!canSwipe()){start=null;return;}const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;start=null;
        if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);
    },{passive:true});
    dialog.addEventListener('keydown',e=>{if(!canSwipe())return;if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);});
    return at;
}
