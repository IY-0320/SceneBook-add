import { MODELS, safeImagePath } from '../plugin/core.mjs';
import { el, button, iconButton, actionMenu, modal, setText } from './ui.mjs';

const MIN=1,MAX=6,STEP=1.5;
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
// Past an edge or a zoom limit the picture still follows the fingers, but only partly.
const resist=(value,limit,give=.35)=>Math.abs(value)<=limit?value:Math.sign(value)*(limit+(Math.abs(value)-limit)*give);
const soften=scale=>scale<MIN?MIN-(MIN-scale)*.45:scale>MAX?MAX+(scale-MAX)*.25:scale;

// Pan and zoom for one picture inside a stage. The picture keeps its fitted size
// in the layout; zoom and pan are one transform around its centre. Sizes are read
// once when a gesture starts, and the transform is written at most once a frame,
// so fingers never wait for the page to measure itself.
function zoomable(stage,img,onChange){
    let scale=1,tx=0,ty=0,frame=0,box=null,shown='';
    const measure=()=>{const r=stage.getBoundingClientRect();box={w:img.offsetWidth,h:img.offsetHeight,sw:stage.clientWidth,sh:stage.clientHeight,cx:r.left+r.width/2,cy:r.top+r.height/2};return box;};
    const limits=s=>{const b=box??measure();return[Math.max(0,(b.w*s-b.sw)/2),Math.max(0,(b.h*s-b.sh)/2)];};
    const write=()=>{
        frame=0;
        const value=scale===1&&!tx&&!ty?'':`translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
        if(value!==shown){img.style.transform=value;shown=value;}
        stage.classList.toggle('is-zoomed',scale>1.001);onChange(scale);
    };
    const paint=()=>{frame||=requestAnimationFrame(write);};
    const now=()=>{cancelAnimationFrame(frame);write();};
    // Back inside the limits; with transitions on, this glides into place.
    const settle=()=>{
        scale=clamp(scale,MIN,MAX);if(scale===MIN){tx=ty=0;}
        else{const [lx,ly]=limits(scale);tx=clamp(tx,-lx,lx);ty=clamp(ty,-ly,ly);}
        now();
    };
    // Keeps the point under (x,y) in place while the scale changes.
    const zoomAt=(next,x,y)=>{
        const b=measure();next=clamp(next,MIN,MAX);
        const px=(x??b.cx)-b.cx,py=(y??b.cy)-b.cy;
        tx=px-(px-tx)*(next/scale);ty=py-(py-ty)*(next/scale);scale=next;settle();
    };
    return{
        get scale(){return scale;},
        zoomAt,
        zoomBy:(factor,x,y)=>zoomAt(scale*factor,x,y),
        toggle:(x,y)=>scale>1?zoomAt(1):zoomAt(2.5,x,y),
        state:()=>({scale,tx,ty}),
        // A gesture: measure once, follow freely, settle at the end.
        begin:()=>{measure();img.classList.add('is-gesture');},
        pinch:(start,from,to,ratio)=>{
            scale=soften(start.scale*ratio);const r=scale/start.scale;
            const [lx,ly]=limits(scale);
            tx=resist(to.x-(from.x-start.tx)*r,lx,.6);ty=resist(to.y-(from.y-start.ty)*r,ly,.6);paint();
        },
        pan:(start,dx,dy)=>{const [lx,ly]=limits(scale);tx=resist(start.tx+dx,lx);ty=resist(start.ty+dy,ly);paint();},
        slide:dx=>{tx=dx;ty=0;paint();},
        finish:()=>{img.classList.remove('is-gesture');settle();},
        // Relative to the stage centre, from page coordinates.
        local:point=>({x:point.x-(box??measure()).cx,y:point.y-(box??measure()).cy}),
        reset:()=>{scale=1;tx=ty=0;box=null;now();},
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
        zoom.reset();
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

    // Gestures. One finger pans a zoomed picture or swipes to the next one; two
    // fingers pinch. While zoomed in, or after a pinch, a finger never changes the picture.
    const pointers=new Map();let gesture=null,lastTap=null;
    const distance=([a,b])=>Math.hypot(a.x-b.x,a.y-b.y),middle=([a,b])=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
    const startPinch=()=>{const points=[...pointers.values()].slice(0,2);gesture={kind:'pinch',distance:Math.max(1,distance(points)),start:zoom.state(),centre:zoom.local(middle(points))};};
    const startOne=(point,afterPinch)=>{gesture={kind:afterPinch||zoom.scale>1.001?'pan':'swipe',x:point.x,y:point.y,time:performance.now(),start:zoom.state(),moved:afterPinch};};
    stage.addEventListener('pointerdown',event=>{
        if(event.button>0)return;
        try{stage.setPointerCapture(event.pointerId);}catch{}
        if(!pointers.size)zoom.begin();
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(pointers.size===2)startPinch();
        else if(pointers.size===1)startOne({x:event.clientX,y:event.clientY},false);
    });
    stage.addEventListener('pointermove',event=>{
        if(!pointers.has(event.pointerId)||!gesture)return;
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(gesture.kind==='pinch'){
            if(pointers.size<2)return;
            const points=[...pointers.values()].slice(0,2);
            zoom.pinch(gesture.start,gesture.centre,zoom.local(middle(points)),distance(points)/gesture.distance);return;
        }
        const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
        if(Math.hypot(dx,dy)>8)gesture.moved=true;
        if(gesture.kind==='pan')zoom.pan(gesture.start,dx,dy);
        else if(items.length>1&&Math.abs(dx)>Math.abs(dy))zoom.slide(dx);
    });
    const end=event=>{
        if(!pointers.delete(event.pointerId))return;
        // One finger left after a pinch: it carries on panning from where the picture is.
        if(gesture?.kind==='pinch'){if(pointers.size>=2)startPinch();else if(pointers.size===1){const [p]=pointers.values();startOne(p,true);}else{gesture=null;zoom.finish();}return;}
        if(pointers.size)return;
        const current=gesture;gesture=null;
        if(!current){zoom.finish();return;}
        const dx=event.clientX-current.x,dy=event.clientY-current.y,quick=performance.now()-current.time;
        if(current.kind==='swipe'){
            const far=Math.abs(dx)>Math.max(60,stage.clientWidth*.18)||(Math.abs(dx)>30&&Math.abs(dx)/quick>.5);
            if(items.length>1&&far&&Math.abs(dx)>Math.abs(dy)*1.2){img.classList.remove('is-gesture');go(dx<0?1:-1);return;}
        }
        zoom.finish();
        // Two quick taps zoom in at that point, or back out.
        if(!current.moved&&event.pointerType!=='mouse'&&quick<300){
            const time=performance.now();
            if(lastTap&&time-lastTap.time<320&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<30){lastTap=null;zoom.toggle(event.clientX,event.clientY);}
            else lastTap={time,x:event.clientX,y:event.clientY};
        }
    };
    for(const name of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(name,end);
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
