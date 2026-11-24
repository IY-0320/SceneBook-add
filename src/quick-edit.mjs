import { MODELS, safeImagePath } from '../plugin/core.mjs';
import { CAMERA_TAGS, ORIENTATIONS, LOOKS, hasCameraTag, toggleCameraTag } from './framing.mjs';
import { el, button, field, modal, segmented } from './ui.mjs';

// Camera shortcuts: one viewpoint and one shot size at a time.
export function cameraChips(camera){
    const chips=el('div','ap2-chips');chips.setAttribute('role','group');chips.setAttribute('aria-label','구도 바로 고르기');
    const sync=()=>{for(const chip of chips.children)chip.setAttribute('aria-pressed',String(hasCameraTag(camera.read(),chip.dataset.tag)));};
    for(const [tag,label,group]of CAMERA_TAGS){
        const chip=el('button','ap2-chip-button',label);chip.type='button';chip.dataset.tag=tag;chip.dataset.group=group;chip.title=tag;
        chip.addEventListener('click',()=>{camera.input.value=toggleCameraTag(camera.read(),tag);sync();camera.input.dispatchEvent(new Event('input',{bubbles:true}));});chips.append(chip);
    }
    camera.input.addEventListener('input',sync);sync();
    return{wrap:chips,sync};
}
// Everything that makes up one picture's prompt, on one screen: fix what is
// wrong and generate again into the same place. `config` is that picture's
// own main prompt, exclusions and look; they are not the saved defaults.
export function quickEdit({scene,config,seed,imageUrl,onRewrite,onGenerate,onDetail}){
    const {dialog,body}=modal('그림 고치기','고친 뒤 다시 그리면 새 그림이 같은 자리에 추가됩니다. 이전 그림은 버전으로 남습니다.');dialog.classList.add('ap2-quick-edit');
    let draft=structuredClone(scene),size='',cast=[],wasFinal=false;
    const layout=el('div','ap2-edit-layout'),main=el('div','ap2-edit-main');
    if(safeImagePath(imageUrl)){
        const preview=el('aside','ap2-edit-preview'),image=el('img');image.src=imageUrl;image.alt='지금 그림';
        preview.append(image,el('p','ap2-muted',[MODELS[config.model]?.label,`${config.width} × ${config.height}`,seed!==undefined&&`Seed ${seed}`].filter(Boolean).join(' · ')));layout.append(preview);
    }
    layout.append(main);body.append(layout);
    const block=(title,help='')=>{const box=el('section','ap2-edit-block'),head=el('header','');head.append(el('h3','',title));if(help)head.append(el('p','ap2-muted',help));box.append(head);main.append(box);return box;};
    const bare=f=>{f.wrap.classList.add('ap2-field-bare');return f;};

    // Ask in plain words: one line that grows, with its button beside it.
    const ask=bare(field('바꾸고 싶은 점을 말로 적기','',{multiline:true,rows:1,placeholder:'말로 고치기 · 예: 둘이 껴안은 모습이 옆에서 보이게, 배경은 노을 진 옥상'})),status=el('p','ap2-muted');status.setAttribute('role','status');
    const rewrite=button('AI로 고쳐 쓰기',async()=>{
        const request=ask.read().trim();if(!request)throw new Error('바꾸고 싶은 점을 먼저 적어 주세요.');
        status.textContent='AI가 장면을 고쳐 쓰는 중…';
        try{draft={...await onRewrite(read().scene,request)};fill();status.textContent='고쳐 썼습니다. 아래 내용을 확인하고 다시 그리기를 누르세요.';}
        catch(e){status.textContent='고쳐 쓰지 못했습니다. 아래 내용을 직접 고칠 수 있습니다.';throw e;}
    },false,'fa-wand-magic-sparkles');rewrite.title='적은 내용대로 AI가 장면·구도·인물 프롬프트를 고쳐 씁니다. AI 요청이 한 번 발생합니다.';
    const assist=el('section','ap2-quick-assist'),askRow=el('div','ap2-quick-ask');askRow.append(ask.wrap,rewrite);assist.append(askRow,status);main.append(assist);

    // A scene whose final prompt was typed by hand is sent exactly as written.
    const exact=el('p','ap2-note');exact.textContent='이 그림은 최종 프롬프트를 직접 고쳐 만들었습니다. 아래 내용이 그대로 전송되며 메인 프롬프트·그림체·구도는 따로 붙지 않습니다.';main.append(exact);
    const sceneBox=block('장면','이 그림의 배경·상황·행동입니다.'),prompt=bare(field('장면','',{multiline:true,rows:3}));sceneBox.append(prompt.wrap);
    const sceneExclude=field('이 장면에서만 제외','',{multiline:true,rows:2});sceneBox.append(sceneExclude.wrap);
    const styleBox=block('메인 프롬프트','이 그림에 쓴 화풍·공통 태그입니다. 여기서 고치면 이 그림에만 적용됩니다.');
    const look=field('그림체',LOOKS.some(([id])=>id===config.look)?config.look:'',{choices:LOOKS.map(([id,label])=>[id,label])});
    const style=bare(field('메인 프롬프트',config.style??'',{multiline:true,rows:3})),keep=field('앞으로 그릴 그림에도 적용',false,{type:'checkbox',help:'메인 프롬프트·제외할 요소·그림체를 기본 설정에도 저장합니다.'});
    styleBox.append(style.wrap,look.wrap);
    const excludeBox=block('제외할 요소 (UC)'),negative=bare(field('제외할 요소',config.negative??'',{multiline:true,rows:2}));excludeBox.append(negative.wrap,keep.wrap);
    const cameraBox=block('구도 · 화면 비율 · 시드'),camera=bare(field('구도','',{placeholder:'예: from side, upper body'})),chips=cameraChips(camera);
    const shape=segmented('화면 비율',[['','그대로'],...ORIENTATIONS.slice(1)],size,value=>{size=value;}),shapeRow=el('div','ap2-quick-shape');shapeRow.append(el('span','','화면 비율'),shape.wrap);
    // The same seed keeps the composition as close as it can, to judge a prompt change alone.
    const seedChoice=segmented('시드',[['new','새 시드'],['same','같은 시드']],'new'),seedRow=el('div','ap2-quick-shape');seedRow.append(el('span','','시드'),seedChoice.wrap);seedRow.title='같은 시드는 구도를 최대한 유지한 채 프롬프트 변화만 확인할 때 씁니다.';seedRow.hidden=seed===undefined;
    cameraBox.append(chips.wrap,camera.wrap,shapeRow,seedRow);
    const peopleBox=block('인물','인물마다 외형·복장·행동을 따로 적습니다.'),people=el('div','ap2-quick-people');peopleBox.append(people);

    function fill(){
        const final=!!draft.finalPrompt;
        exact.hidden=!final;cameraBox.querySelector('.ap2-chips').hidden=camera.wrap.hidden=final;styleBox.hidden=final;
        sceneBox.querySelector('h3').textContent=final?'최종 프롬프트':'장면';
        excludeBox.querySelector('h3').textContent=final?'최종 제외 요소 (UC)':'제외할 요소 (UC)';keep.wrap.hidden=final;
        camera.input.value=draft.camera??'';prompt.input.value=draft.prompt??'';
        // With a hand-written final prompt the scene's own exclusions are the whole UC.
        if(final){negative.input.value=draft.negative??'';sceneExclude.wrap.hidden=true;}
        else{if(wasFinal)negative.input.value=config.negative??'';sceneExclude.input.value=draft.negative??'';sceneExclude.wrap.hidden=!draft.negative;}
        wasFinal=final;
        people.replaceChildren();
        cast=(draft.characters??[]).map((c,i)=>{const f=field(c.name||`인물 ${i+1}`,c.prompt??'',{multiline:true,rows:3});people.append(f.wrap);return f;});
        peopleBox.hidden=!cast.length;chips.sync();
    }
    // The edited scene, and the picture-level prompts that go with it.
    function read(){
        const final=!!draft.finalPrompt,characters=(draft.characters??[]).map((c,i)=>({...c,prompt:cast[i].read()}));
        if(final)return{scene:{...draft,prompt:prompt.read().trim(),negative:negative.read().trim(),camera:'',finalPrompt:true,characters},edits:{}};
        return{scene:{...draft,camera:camera.read().trim(),prompt:prompt.read().trim(),negative:sceneExclude.wrap.hidden?'':sceneExclude.read().trim(),finalPrompt:false,characters},
            edits:{style:style.read().trim(),negative:negative.read().trim(),look:look.read()}};
    }
    fill();
    const footer=el('footer','ap2-footer ap2-editor-footer'),left=el('div','ap2-actions'),right=el('div','ap2-actions');
    left.append(button('인물 배치 · 설정',()=>{const value=read();dialog.close();return onDetail(value.scene,value.edits);},false,'fa-sliders'));
    right.append(button('다시 그리기',async()=>{const value=read();await onGenerate(value.scene,{...value.edits,size,keepSeed:seedChoice.read()==='same',saveDefault:!keep.wrap.hidden&&keep.read()});dialog.close();},true,'fa-rotate-right'));
    footer.append(left,right);dialog.append(footer);return dialog;
}
