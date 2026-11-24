import { MODELS, safeImagePath } from '../plugin/core.mjs';
import { HELP } from './guide.mjs';
import { notice,placeNotices } from './notifications.mjs';
export { notice } from './notifications.mjs';
export { composer } from './editor.mjs';

export function el(tag, className = '', value = '') {
    const node = document.createElement(tag); node.className = className;
    if (value) node.textContent = value;
    return node;
}
export function button(label, action, primary = false, icon = '') {
    // No SillyTavern button classes: themes restyle those in ways that break our layouts.
    const b = el('button', `ap2-button${primary ? ' ap2-primary' : ''}`); b.type = 'button';
    if(icon){const glyph=el('i',`fa-solid ${icon}`);glyph.setAttribute('aria-hidden','true');b.append(glyph);}
    b.append(el('span','',label));
    b.addEventListener('click', async () => {
        try { const result=action();if(result?.then){b.disabled=true;try{await result;}finally{b.disabled=false;}} } catch (e) { notice(e.message, true); }
    }); return b;
}
export function iconButton(label, icon, action) {
    const b=button('',action,false,icon);b.classList.add('ap2-icon-button');
    b.title=label;b.setAttribute('aria-label',label);return b;
}
// Native popovers stay above the scrolling dialog and dismiss on outside click.
export function actionMenu(actions,label='더 보기') {
    const wrap=el('div','ap2-action-menu'),panel=el('div','ap2-action-panel');panel.setAttribute('popover','auto');panel.setAttribute('role','group');panel.setAttribute('aria-label',label);
    const trigger=iconButton(label,'fa-ellipsis',()=>{
        if(panel.matches(':popover-open')){panel.hidePopover();return;}
        panel.showPopover();const r=trigger.getBoundingClientRect(),p=panel.getBoundingClientRect();
        panel.style.left=`${Math.max(8,Math.min(r.right-p.width,innerWidth-p.width-8))}px`;
        panel.style.top=`${Math.max(8,r.top>p.height+8?r.top-p.height-6:Math.min(r.bottom+6,innerHeight-p.height-8))}px`;
    });
    panel.id=`ap2-menu-${crypto.randomUUID()}`;trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
    let events;
    panel.addEventListener('toggle',()=>{
        events?.abort();const open=panel.matches(':popover-open');trigger.setAttribute('aria-expanded',String(open));
        if(open){events=new AbortController();window.addEventListener('resize',()=>panel.hidePopover(),{signal:events.signal});}
    });
    for(const item of actions){const b=button(item.label,()=>{panel.hidePopover();return item.run();},false,item.icon??'');if(item.danger)b.classList.add('ap2-danger');panel.append(b);}
    wrap.append(trigger,panel);return wrap;
}
// Two colours cannot be derived in CSS alone: an opaque surface (themes often use
// a translucent tint) and a readable text colour for fills made of the text colour.
export function syncTone() {
    const probe=document.createElement('span');probe.style.cssText='position:absolute;visibility:hidden;color:var(--SmartThemeBodyColor,#ddd);background-color:var(--SmartThemeBlurTintColor,#222)';document.body.append(probe);
    const style=getComputedStyle(probe),read=value=>(value.match(/[\d.]+/g)??[]).map(Number),fg=read(style.color),bg=read(style.backgroundColor);probe.remove();
    if(fg.length<3||bg.length<3)return;
    const light=(.299*fg[0]+.587*fg[1]+.114*fg[2])>140,root=document.documentElement.style;
    // A light text colour means a dark theme. Keep the surface on the same side.
    const base=light?[24,24,27]:[250,250,249],alpha=bg[3]??1,solid=bg.slice(0,3).map((v,i)=>Math.round(v*alpha+base[i]*(1-alpha)));
    const dark=(.299*solid[0]+.587*solid[1]+.114*solid[2])<128;
    root.setProperty('--ap2-surface-solid',`rgb(${(dark===light?solid:base).join(' ')})`);root.setProperty('--ap2-on-solid',light?'#141416':'#ffffff');
}
export function modal(title, subtitle = '') {
    syncTone();
    const previous = document.activeElement;
    const dialog = el('dialog', 'ap2-dialog');
    const header = el('header', 'ap2-header'), titleBox = el('div','ap2-header-title');
    const heading=el('h2','',title);heading.id=`ap2-title-${crypto.randomUUID()}`;dialog.setAttribute('aria-labelledby',heading.id);
    titleBox.append(heading);
    if (subtitle) titleBox.append(el('p', 'ap2-muted', subtitle));
    const close=iconButton('닫기','fa-xmark',()=>dialog.close());close.classList.add('ap2-close');header.append(titleBox, close);
    const body = el('div', 'ap2-body'); dialog.append(header, body); document.body.append(dialog);
    dialog.addEventListener('close', () => { placeNotices(); dialog.remove(); previous?.focus(); });
    for(const event of ['mousedown','pointerdown','click'])dialog.addEventListener(event,e=>e.stopPropagation());
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
    dialog.showModal();placeNotices(); return { dialog, body };
}
// Long prompts stay fully visible: a text box grows with what is typed in it.
// Browsers without `field-sizing` get the same result from this measurement.
const nativeGrow=globalThis.CSS?.supports?.('field-sizing','content')??false;
export function fitText(input) {
    if(nativeGrow||!input.isConnected||!input.clientWidth)return;
    input.style.height='auto';input.style.height=`${input.scrollHeight+2}px`;
}
function growing(input) {
    if(nativeGrow)return;
    input.addEventListener('input',()=>fitText(input));
    // Measured again whenever the box becomes visible: a new dialog, a tab, an opened group.
    new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))fitText(input);}).observe(input);
}
export function field(label, value, options = {}) {
    const wrap = el('label', 'ap2-field'); wrap.append(el('span', 'ap2-field-label', label));
    let input;
    if (options.choices) {
        input = el('select');
        for (const [id, caption] of options.choices) { const o = el('option', '', caption); o.value = id; input.append(o); }
    } else if (options.multiline) { input = el('textarea'); input.rows = options.rows ?? 3; input.style.setProperty('--ap2-rows',String(input.rows)); input.spellcheck = false; growing(input); }
    else { input = el('input'); input.type = options.type ?? 'text'; }
    if (options.type === 'checkbox') {
        // The real checkbox is kept for the keyboard and for forms but not shown;
        // the switch beside it is drawn here, so a theme's checkbox style cannot break it.
        input.checked = !!value; wrap.classList.add('ap2-check'); input.classList.add('ap2-switch-input'); input.setAttribute('role','switch');
        const knob=el('span','ap2-switch');knob.setAttribute('aria-hidden','true');wrap.append(input,knob);
    } else { input.value = value ?? ''; wrap.append(input); }
    if(options.multiline)wrap.classList.add('ap2-field-wide');
    if(options.choices)wrap.classList.add('ap2-field-select');
    for (const key of ['min', 'max', 'step', 'placeholder']) if (options[key] !== undefined) input.setAttribute(key, options[key]);
    if (options.help) wrap.append(el('small', 'ap2-muted', options.help));
    return { wrap, input, read: () => options.type === 'checkbox' ? input.checked : options.type === 'number' ? Number(input.value) : input.value };
}
export function addField(parent, map, key, label, value, options) {
    const f = field(label, value, options);if(HELP[key]){f.input.title=HELP[key];f.wrap.title=HELP[key];}map[key] = f; parent.append(f.wrap); return f.input;
}
export function readFields(map) { return Object.fromEntries(Object.entries(map).map(([key, f]) => [key, f.read()])); }
// A value on a track with the number beside it. The number can be typed too.
export function slider(label, value, {min=0,max=1,step=0.05,help=''}={}) {
    const wrap=el('div','ap2-field ap2-slider'),range=el('input'),number=el('input'),id=`ap2-range-${crypto.randomUUID()}`;
    const caption=el('label','ap2-field-label',label);caption.htmlFor=id;
    range.type='range';range.id=id;number.type='number';number.setAttribute('aria-label',`${label} 값`);
    const clamp=v=>Math.max(Number(range.min),Math.min(Number(range.max),Number.isFinite(v)?v:Number(range.min)));
    const limit=(low,high)=>{for(const input of [range,number]){input.min=low;input.max=high;input.step=step;}};
    limit(min,max);range.value=number.value=clamp(Number(value));
    range.addEventListener('input',()=>{number.value=range.value;});
    number.addEventListener('input',()=>{if(number.value!=='')range.value=clamp(Number(number.value));});
    number.addEventListener('change',()=>{number.value=range.value;});
    const controls=el('div','ap2-slider-controls');controls.append(range,number);wrap.append(caption,controls);
    if(help)wrap.append(el('small','ap2-muted',help));
    return{wrap,input:range,read:()=>Number(range.value),limit(low,high){limit(low,high);range.value=number.value=clamp(Number(range.value));}};
}
// A small set of mutually exclusive choices, shown side by side.
export function segmented(label,choices,value,onChange=()=>{}){
    const wrap=el('div','ap2-segmented');wrap.setAttribute('role','radiogroup');wrap.setAttribute('aria-label',label);
    const set=next=>{value=next;for(const b of wrap.children){const on=b.dataset.value===next;b.setAttribute('aria-checked',String(on));b.tabIndex=on?0:-1;}};
    for(const [id,caption]of choices){const b=el('button','ap2-segment',caption);b.type='button';b.dataset.value=id;b.setAttribute('role','radio');b.addEventListener('click',()=>{if(value===id)return;set(id);onChange(id);});wrap.append(b);}
    wrap.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const items=[...wrap.children],next=items[(items.findIndex(b=>b.dataset.value===value)+(event.key==='ArrowRight'?1:-1)+items.length)%items.length];next.focus();next.click();});
    set(value);return{wrap,set,read:()=>value,disable(off){for(const b of wrap.children)b.disabled=off;}};
}
// One choice out of many, as wrapping chips. `title` explains a chip on hover.
export function choiceChips(label,choices,value,onChange=()=>{}){
    const wrap=el('div','ap2-chips');wrap.setAttribute('role','radiogroup');wrap.setAttribute('aria-label',label);
    const set=next=>{value=next;for(const chip of wrap.children)chip.setAttribute('aria-checked',String(chip.dataset.value===next));};
    for(const [id,caption,title]of choices){const chip=el('button','ap2-chip-button',caption);chip.type='button';chip.dataset.value=id;chip.setAttribute('role','radio');if(title)chip.title=title;chip.addEventListener('click',()=>{if(value===id)return;set(id);onChange(id);});wrap.append(chip);}
    set(value);return{wrap,set,read:()=>value};
}
// A titled block of related settings.
export function section(parent,title,description=''){
    const box=el('section','ap2-section'),head=el('header','ap2-section-head');
    head.append(el('h3','',title));if(description)head.append(el('p','ap2-muted',description));
    box.append(head);parent.append(box);return box;
}
// Settings most people leave alone, folded away under a title.
export function foldout(parent,title,open=false){
    const group=el('details','ap2-group');group.open=open;group.append(el('summary','',title));
    const content=el('div','ap2-group-content');group.append(content);parent.append(group);return content;
}
// Every edit inside `page` is saved at once; the line below it says so.
export function saveBar(page,save){
    const row=el('div','ap2-savebar'),state=el('span','ap2-muted','');
    let revision=0;
    const commit=async()=>{const version=++revision;page.dataset.dirty='true';try{await save();if(version===revision){page.dataset.dirty='false';state.textContent='저장됨';row.dataset.state='saved';}}catch(e){if(version===revision){state.textContent=`저장 안 됨 · ${e.message}`;row.dataset.state='error';}}};
    // Commit values to ST's settings on every edit. ST batches disk writes; a
    // closed window, tab switch or extension update cannot discard form-only edits.
    page.addEventListener('input',commit);page.addEventListener('change',commit);
    state.textContent='바꾸면 바로 저장됩니다';state.setAttribute('role','status');row.append(state);page.append(row);
}
export function confirmAction(title,message,confirmLabel='삭제'){
    return new Promise(resolve=>{const {dialog,body}=modal(title);dialog.classList.add('ap2-compact');body.append(el('p','',message));const footer=el('footer','ap2-footer');footer.append(button('취소',()=>dialog.close()),button(confirmLabel,()=>{dialog.returnValue='confirm';dialog.close();},true));dialog.append(footer);dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});footer.querySelector('button').focus();});
}
export function downloadJson(value, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
    const a = el('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function inspect(job) {
    const {body}=modal('생성 기록',`Seed ${job.seed} · ${MODELS[job.config?.model]?.label??job.config?.model??''}`);
    const pre=el('pre','ap2-code',JSON.stringify({scene:job.scene,config:job.config,seed:job.seed,review:job.review},null,2));body.append(pre,button('다운로드',()=>downloadJson(job,'scenebook-image-record.json')));
}
export function viewer(job,{actions=[],more=[]}={}) {
    if(!safeImagePath(job.url))throw new Error('이미지 경로를 확인할 수 없습니다.');
    const meta=[MODELS[job.config?.model]?.label,job.config?.width&&`${job.config.width} × ${job.config.height}`,job.seed!==undefined&&`Seed ${job.seed}`].filter(Boolean).join(' · ');
    const {dialog,body}=modal(job.scene?.title??'삽화',meta);dialog.classList.add('ap2-viewer');
    const img=el('img','ap2-full');img.src=job.url;img.alt=job.scene?.title??'삽화';body.append(img);
    const footer=el('footer','ap2-footer ap2-viewer-footer');
    const run=item=>{if(item.close)dialog.close();return item.run();};
    for(const item of actions){const b=button(item.label,()=>run(item),false,item.icon??'');if(item.danger)b.classList.add('ap2-danger');footer.append(b);}
    const download=el('a','ap2-button');download.href=job.url;download.download=`${job.id}.png`;download.title='원본 PNG 저장';download.setAttribute('aria-label','원본 PNG 저장');
    const glyph=el('i','fa-solid fa-download');glyph.setAttribute('aria-hidden','true');download.append(glyph,el('span','','저장'));footer.append(download);
    if(more.length)footer.append(actionMenu(more.map(item=>({...item,run:()=>run(item)}))));
    dialog.append(footer);return dialog;
}
export function compareVersions(versions,currentIndex){
    const {body}=modal('결과 비교');
    if(versions.length<2){body.append(el('p','','비교할 이전 결과가 없습니다.'));return;}
    const choices=versions.map((j,i)=>[String(i),`${i+1} · Seed ${j.seed}`]);
    const grid=el('div','ap2-compare');body.append(grid);
    for(const [label,start]of [['이전 결과',currentIndex===0?1:currentIndex-1],['현재 결과',currentIndex]]){
        const pane=el('section'),select=field(label,String(start),{choices}),image=el('img','ap2-compare-image'),info=el('p','ap2-muted');
        const show=()=>{const job=versions[Number(select.read())];if(!safeImagePath(job.url)){image.removeAttribute('src');info.textContent='이미지 경로를 확인할 수 없습니다.';return;}image.src=job.url;image.alt=job.scene.title;info.textContent=`${MODELS[job.config.model]?.label??job.config.model} · ${job.config.width} × ${job.config.height} · ${job.config.steps} Steps`;};
        select.input.addEventListener('change',show);show();pane.append(select.wrap,image,info);grid.append(pane);
    }
}
