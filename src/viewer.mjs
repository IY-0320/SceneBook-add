import { MODELS, safeImagePath } from '../plugin/core.mjs';
import { el, button, iconButton, actionMenu, modal, setText } from './ui.mjs';

const MIN=1,MAX=6,STEP=1.5;
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));

// Pan and zoom for one picture inside a stage. The picture keeps its fitted
// size in the layout; zoom and pan are a transform around its centre.
function zoomable(stage,img,onChange){
    let scale=1,tx=0,ty=0;
    const limits=()=>{
        const w=img.offsetWidth*scale,h=img.offsetHeight*scale;
        return[Math.max(0,(w-stage.clientWidth)/2),Math.max(0,(h-stage.clientHeight)/2)];
    };
    const apply=()=>{
        const [lx,ly]=limits();tx=clamp(tx,-lx,lx);ty=clamp(ty,-ly,ly);
        img.style.transform=scale===1&&!tx&&!ty?'':`translate(${tx}px, ${ty}px) scale(${scale})`;
        stage.classList.toggle('is-zoomed',scale>1);onChange(scale);
    };
    // Keeps the point under (x,y) in place while the scale changes.
    const zoomAt=(next,x,y)=>{
        next=clamp(next,MIN,MAX);
        const box=stage.getBoundingClientRect(),px=(x??box.left+box.width/2)-(box.left+box.width/2),py=(y??box.top+box.height/2)-(box.top+box.height/2);
        tx=px-(px-tx)*(next/scale);ty=py-(py-ty)*(next/scale);scale=next;
        if(scale===1)tx=ty=0;apply();
    };
    return{
        get scale(){return scale;},
        zoomAt,
        zoomBy:(factor,x,y)=>zoomAt(scale*factor,x,y),
        toggle:(x,y)=>scale>1?zoomAt(1):zoomAt(2.5,x,y),
        panBy:(dx,dy)=>{tx+=dx;ty+=dy;apply();},
        set:(s,x,y)=>{scale=s;tx=x;ty=y;apply();},
        state:()=>({scale,tx,ty}),
        reset:()=>{scale=1;tx=ty=0;apply();},
    };
}

function defaultMeta(job){
    return[MODELS[job.config?.model]?.label,job.config?.width&&`${job.config.width} × ${job.config.height}`,job.seed!==undefined&&`Seed ${job.seed}`,job.preset&&`프리셋 ${job.preset}`].filter(Boolean).join(' · ');
}

// The picture viewer. With several items it moves between them by swiping,
// with the arrow keys or with the buttons, and wraps around at either end.
// `describe(item, index)` returns {actions, more} for the item on screen;
// `onShow(item, index)` is told whenever another item is shown.
export function openViewer({items,index=0,describe=()=>({}),onShow=()=>{},meta=defaultMeta}){
    items=items.filter(item=>safeImagePath(item?.url));
    if(!items.length)throw new Error('이미지 경로를 확인할 수 없습니다.');
    index=clamp(index,0,items.length-1);
    // No titles: the header names the model, size and seed of the picture on screen.
    const {dialog,body}=modal(meta(items[index])||'그림');dialog.classList.add('ap2-viewer');
    const heading=dialog.querySelector('.ap2-header h2'),subtitle=dialog.querySelector('.ap2-header p')??el('p','ap2-muted');
    if(!subtitle.isConnected)dialog.querySelector('.ap2-header-title').append(subtitle);
    const stage=el('div','ap2-viewer-stage'),img=el('img','ap2-full');img.draggable=false;stage.append(img);body.append(stage);
    stage.setAttribute('aria-label','그림. 두 손가락이나 휠로 확대, 좌우로 밀어 넘기기');
    // Navigation and zoom sit in a thin row under the picture, never over it.
    const bar=el('div','ap2-viewer-bar'),navigation=el('div','ap2-viewer-group'),counter=el('span','ap2-viewer-count');
    const zoomGroup=el('div','ap2-viewer-group'),zoomLabel=el('button','ap2-viewer-zoom');zoomLabel.type='button';zoomLabel.title='원래 크기';
    const previous=iconButton('이전 그림 (←)','fa-chevron-left',()=>go(-1)),next=iconButton('다음 그림 (→)','fa-chevron-right',()=>go(1));
    navigation.append(previous,counter,next);navigation.hidden=items.length<2;
    const out=iconButton('축소 (−)','fa-minus',()=>zoom.zoomBy(1/STEP)),into=iconButton('확대 (+)','fa-plus',()=>zoom.zoomBy(STEP));
    zoomLabel.addEventListener('click',()=>zoom.reset());zoomGroup.append(out,zoomLabel,into);
    bar.append(navigation,zoomGroup);
    const footer=el('footer','ap2-footer ap2-viewer-footer');dialog.append(bar,footer);
    const zoom=zoomable(stage,img,scale=>{setText(zoomLabel,`${Math.round(scale*100)}%`);out.disabled=scale<=MIN;into.disabled=scale>=MAX;});

    function render(){
        const item=items[index];
        img.classList.remove('is-sliding');img.style.transform='';zoom.reset();
        if(img.getAttribute('src')!==item.url)img.src=item.url;img.alt='그림';
        setText(heading,meta(item)||'그림');subtitle.hidden=true;
        setText(counter,`${index+1} / ${items.length}`);
        const {actions=[],more=[]}=describe(item,index)??{};
        const run=entry=>{if(entry.close)dialog.close();return entry.run(item,index);};
        footer.replaceChildren();
        for(const entry of actions){const b=button(entry.label,()=>run(entry),false,entry.icon??'');if(entry.danger)b.classList.add('ap2-danger');footer.append(b);}
        const download=el('a','ap2-button');download.href=item.url;download.download=`${item.id??'scenebook'}.png`;download.title='원본 PNG 저장';download.setAttribute('aria-label','원본 PNG 저장');
        const glyph=el('i','fa-solid fa-download');glyph.setAttribute('aria-hidden','true');download.append(glyph,el('span','','저장'));footer.append(download);
        if(more.length)footer.append(actionMenu(more.map(entry=>({...entry,run:()=>run(entry)}))));
        // The neighbours load while this one is looked at.
        for(const near of [items[(index+1)%items.length],items[(index-1+items.length)%items.length]])if(near&&near!==item){const pre=new Image();pre.src=near.url;}
    }
    function go(delta){
        if(items.length<2)return;
        index=(index+delta+items.length)%items.length;render();
        try{onShow(items[index],index);}catch{}
    }

    // Gestures. One finger pans a zoomed picture or swipes to the next one;
    // two fingers pinch. While zoomed in, a swipe never changes the picture.
    const pointers=new Map();let gesture=null,lastTap=null;
    const distance=([a,b])=>Math.hypot(a.x-b.x,a.y-b.y),middle=([a,b])=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    stage.addEventListener('pointerdown',event=>{
        if(event.button>0)return;
        stage.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        const points=[...pointers.values()],start=zoom.state();
        if(points.length===2){const centre=middle(points),box=stage.getBoundingClientRect();gesture={kind:'pinch',distance:distance(points),start,centre:{x:centre.x-(box.left+box.width/2),y:centre.y-(box.top+box.height/2)}};img.classList.add('is-gesture');return;}
        if(points.length===1)gesture={kind:start.scale>1?'pan':'swipe',x:event.clientX,y:event.clientY,time:performance.now(),start,moved:false};
        img.classList.add('is-gesture');
    });
    stage.addEventListener('pointermove',event=>{
        if(!pointers.has(event.pointerId)||!gesture)return;
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...pointers.values()];
        if(gesture.kind==='pinch'&&points.length===2){
            const box=stage.getBoundingClientRect(),now=middle(points),scale=clamp(gesture.start.scale*distance(points)/gesture.distance,MIN,MAX),cx=now.x-(box.left+box.width/2),cy=now.y-(box.top+box.height/2);
            const ratio=scale/gesture.start.scale;
            zoom.set(scale,cx-(gesture.centre.x-gesture.start.tx)*ratio,cy-(gesture.centre.y-gesture.start.ty)*ratio);return;
        }
        const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
        if(Math.hypot(dx,dy)>8)gesture.moved=true;
        if(gesture.kind==='pan')zoom.set(gesture.start.scale,gesture.start.tx+dx,gesture.start.ty+dy);
        else if(gesture.kind==='swipe'&&items.length>1&&Math.abs(dx)>Math.abs(dy))img.style.transform=`translateX(${dx}px)`;
    });
    const end=event=>{
        if(!pointers.delete(event.pointerId))return;
        img.classList.remove('is-gesture');
        if(!gesture){return;}
        if(gesture.kind==='pinch'){if(pointers.size===0)gesture=null;else{const [p]=pointers.values();gesture={kind:zoom.scale>1?'pan':'swipe',x:p.x,y:p.y,time:performance.now(),start:zoom.state(),moved:true};}return;}
        const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y,quick=performance.now()-gesture.time,kind=gesture.kind,moved=gesture.moved;gesture=null;
        if(kind==='swipe'){
            const far=Math.abs(dx)>Math.max(60,stage.clientWidth*.18)||(Math.abs(dx)>30&&Math.abs(dx)/quick>.5);
            if(items.length>1&&far&&Math.abs(dx)>Math.abs(dy)*1.2){go(dx<0?1:-1);return;}
            img.classList.add('is-sliding');img.style.transform='';
        }
        // Two quick taps zoom in at that point, or back out.
        if(!moved&&event.pointerType!=='mouse'&&quick<300){
            const now=performance.now();
            if(lastTap&&now-lastTap.time<320&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<30){lastTap=null;zoom.toggle(event.clientX,event.clientY);}
            else lastTap={time:now,x:event.clientX,y:event.clientY};
        }
    };
    for(const name of ['pointerup','pointercancel'])stage.addEventListener(name,end);
    stage.addEventListener('dblclick',event=>{event.preventDefault();zoom.toggle(event.clientX,event.clientY);});
    stage.addEventListener('wheel',event=>{event.preventDefault();zoom.zoomBy(Math.exp(-event.deltaY*.0018),event.clientX,event.clientY);},{passive:false});
    dialog.addEventListener('keydown',event=>{
        if(event.target.closest?.('input,textarea,select,[contenteditable]'))return;
        const key=event.key;
        if(key==='ArrowLeft'||key==='ArrowRight'){event.preventDefault();go(key==='ArrowLeft'?-1:1);}
        else if(key==='+'||key==='='){event.preventDefault();zoom.zoomBy(STEP);}
        else if(key==='-'||key==='_'){event.preventDefault();zoom.zoomBy(1/STEP);}
        else if(key==='0'){event.preventDefault();zoom.reset();}
    });
    window.addEventListener('resize',()=>zoom.reset(),{signal:closeSignal(dialog)});
    render();
    return{dialog,show:i=>{index=clamp(i,0,items.length-1);render();}};
}
function closeSignal(dialog){const c=new AbortController();dialog.addEventListener('close',()=>c.abort(),{once:true});return c.signal;}
// One picture, as before.
export function viewer(job,{actions=[],more=[]}={}){
    return openViewer({items:[job],describe:()=>({actions,more})}).dialog;
}
