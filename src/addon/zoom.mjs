// 씬북+ · 큰 그림 보기에서 그림 확대
// 휴대폰: 두 손가락으로 벌리기 · 두 번 톡톡 · 확대한 뒤 한 손가락으로 끌기
// PC: 마우스 휠 · 더블클릭 · 확대한 뒤 끌기 · +/−/0 키
// 화면 오른쪽 아래의 +, −, 원래 크기 버튼으로도 조절합니다.
const MIN=1,MAX=6,STEP=1.6,DOUBLE=2.5;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

// area: 그림이 보이는 영역(.ap2-body), img: 확대할 그림
// makeButton(label, icon, action): 원본 ui.mjs의 iconButton
export function enableZoom(area,img,makeButton){
    let scale=1,tx=0,ty=0;
    img.style.transformOrigin='0 0';img.style.willChange='transform';img.draggable=false;
    area.style.touchAction='none';area.style.position='relative';
    const apply=(smooth=false)=>{
        img.style.transition=smooth?'transform .18s ease-out':'none';
        img.style.transform=scale===1?'':`translate(${tx}px,${ty}px) scale(${scale})`;
        area.style.cursor=scale>1?'grab':'';
        if(minus)minus.disabled=scale<=MIN;if(plus)plus.disabled=scale>=MAX;if(reset)reset.hidden=scale===1;
    };
    // 확대하지 않았을 때 그림의 위치와 크기
    const base=()=>{const r=img.getBoundingClientRect();return{left:r.left-tx,top:r.top-ty,width:r.width/scale,height:r.height/scale};};
    // 그림이 화면 밖으로 다 빠져나가지 않게 이동 범위를 제한합니다.
    const bound=()=>{
        const view=area.getBoundingClientRect(),b=base(),w=b.width*scale,h=b.height*scale;
        tx=w<=view.width?view.left+(view.width-w)/2-b.left:clamp(tx,view.right-w-b.left,view.left-b.left);
        ty=h<=view.height?view.top+(view.height-h)/2-b.top:clamp(ty,view.bottom-h-b.top,view.top-b.top);
    };
    // 화면의 (x, y) 지점을 고정한 채로 배율을 바꿉니다.
    const zoomAt=(next,x,y,smooth=false)=>{
        next=clamp(next,MIN,MAX);const b=base();
        const lx=(x-b.left-tx)/scale,ly=(y-b.top-ty)/scale;
        scale=next;tx=x-b.left-lx*scale;ty=y-b.top-ly*scale;
        if(scale<=1.01){scale=1;tx=ty=0;}else bound();
        apply(smooth);
    };
    const center=()=>{const r=area.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];};
    const resetZoom=(smooth=false)=>{scale=1;tx=ty=0;apply(smooth);};

    // 손가락·마우스
    const pointers=new Map();let pinch=null,pan=null,lastTap=null,moved=false;
    area.addEventListener('pointerdown',event=>{
        if(event.target.closest('button'))return;
        // 새 손길의 첫 손가락이면, 끝 신호를 못 받고 남은 손가락 기록을 비웁니다.
        if(event.isPrimary){pointers.clear();pinch=pan=null;}
        area.setPointerCapture?.(event.pointerId);
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});moved=false;
        if(pointers.size===2){
            const [a,b]=[...pointers.values()];
            pinch={distance:Math.hypot(a.x-b.x,a.y-b.y)||1,scale,mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};pan=null;
        }else if(pointers.size===1&&scale>1){pan={x:event.clientX,y:event.clientY};area.style.cursor='grabbing';}
    });
    area.addEventListener('pointermove',event=>{
        const point=pointers.get(event.pointerId);if(!point)return;
        if(Math.hypot(event.clientX-point.x,event.clientY-point.y)>6)moved=true;
        point.x=event.clientX;point.y=event.clientY;
        if(pinch&&pointers.size>=2){
            const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
            tx+=mid.x-pinch.mid.x;ty+=mid.y-pinch.mid.y;pinch.mid=mid;
            zoomAt(pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance,mid.x,mid.y);
        }else if(pan){
            tx+=event.clientX-pan.x;ty+=event.clientY-pan.y;pan={x:event.clientX,y:event.clientY};bound();apply();
        }
    });
    const release=event=>{
        if(!pointers.has(event.pointerId))return;
        const single=pointers.size===1&&!pinch;pointers.delete(event.pointerId);
        if(pointers.size<2)pinch=null;
        if(!pointers.size){pan=null;apply();}
        // 두 번 톡톡(더블클릭): 확대 ↔ 원래 크기
        if(single&&!moved&&event.type==='pointerup'){
            const now=Date.now();
            if(lastTap&&now-lastTap.time<320&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<30){
                lastTap=null;if(scale>1)resetZoom(true);else zoomAt(DOUBLE,event.clientX,event.clientY,true);
            }else lastTap={time:now,x:event.clientX,y:event.clientY};
        }
    };
    for(const type of ['pointerup','pointercancel'])area.addEventListener(type,release);
    area.addEventListener('wheel',event=>{event.preventDefault();zoomAt(scale*Math.exp(-event.deltaY*0.0015),event.clientX,event.clientY);},{passive:false});
    area.addEventListener('dblclick',event=>event.preventDefault());

    // 버튼
    const tools=document.createElement('div');tools.className='ap2-zoom-tools';
    const minus=makeButton('축소','fa-magnifying-glass-minus',()=>zoomAt(scale/STEP,...center(),true));
    const plus=makeButton('확대','fa-magnifying-glass-plus',()=>zoomAt(scale*STEP,...center(),true));
    const reset=makeButton('원래 크기','fa-expand',()=>resetZoom(true));
    tools.append(reset,minus,plus);area.append(tools);

    // 키보드: + 확대, − 축소, 0 원래 크기
    const keys=event=>{
        if(event.target.closest?.('input,textarea,select'))return;
        if(['+','='].includes(event.key)){event.preventDefault();zoomAt(scale*STEP,...center(),true);}
        else if(['-','_'].includes(event.key)){event.preventDefault();zoomAt(scale/STEP,...center(),true);}
        else if(event.key==='0'){event.preventDefault();resetZoom(true);}
    };
    const dialog=area.closest('dialog'),resize=()=>{if(scale>1){bound();apply();}};
    dialog?.addEventListener('keydown',keys);addEventListener('resize',resize);
    dialog?.addEventListener('close',()=>removeEventListener('resize',resize),{once:true});
    apply();
    return{isZoomed:()=>scale>1||pointers.size>1,reset:()=>resetZoom()};
}
