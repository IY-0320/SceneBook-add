import { MODELS, buildPayload, normalizeScene, usableReferences } from '../plugin/core.mjs';
import { activePreset } from './presets.mjs';
import { PAGE_FORMATS, PAGE_GRIDS, STRIP_HEIGHTS, gridFor, compilePage } from './comic.mjs';
import { compileScene } from './prompt-order.mjs';
import { positionEditor } from './position.mjs';
import { sceneBundle, readSceneBundle } from './editor-data.mjs';
import { showGuide } from './guide.mjs';
import { generationEditor } from './generation-ui.mjs';
import { paragraphPosition } from './paragraph-ui.mjs';
import { ORIENTATIONS, LOOKS, withLook } from './framing.mjs';
import { cameraChips, viewWarning } from './quick-edit.mjs';
import { el, button, field, addField, readFields, modal, notice, confirmAction, downloadJson, actionMenu, segmented } from './ui.mjs';

export function composer({context,scenes,config,onAnalyze,onGenerate,onDraft,previewUrl}){
    const {dialog,body}=modal('장면 편집');dialog.classList.add('ap2-editor');
    let drafts=structuredClone(scenes),selected=0,person=0,tab='scene',dirty=false,editing=false;
    const undo=[];const snapshot=()=>{undo.push({drafts:structuredClone(drafts),config:structuredClone(config),selected,person});if(undo.length>20)undo.shift();dirty=true;};
    const toolbar=el('div','ap2-editor-toolbar'),sceneSelect=field('장면','',{choices:[]}),tools=el('div','ap2-actions');
    const iconButton=(label,icon,fn)=>{const b=button('',fn,false,icon);b.setAttribute('aria-label',label);b.title=label;b.classList.add('ap2-icon-button');return b;};
    toolbar.append(sceneSelect.wrap,tools);body.append(toolbar);
    const scene=()=>drafts[selected];
    const moveScene=delta=>{const to=selected+delta;if(to<0||to>=drafts.length)return;snapshot();[drafts[selected],drafts[to]]=[drafts[to],drafts[selected]];selected=to;render();};
    const sceneBack=iconButton('장면 앞으로','fa-arrow-left',()=>moveScene(-1)),sceneNext=iconButton('장면 뒤로','fa-arrow-right',()=>moveScene(1));
    const addScene=button('추가',()=>{if(drafts.length>=config.maxScenes)throw new Error(`최대 ${config.maxScenes}개 장면입니다.`);snapshot();drafts.push({title:'',prompt:'',camera:'',negative:'',after:context.blocks.at(-1).index,evidence:'',characters:[]});selected=drafts.length-1;person=0;render();},false,'fa-plus');
    const deleteScene=iconButton('장면 삭제','fa-trash-can',async()=>{const target=scene();if(!target||!await confirmAction('장면 삭제',`장면 ${selected+1}을 삭제할까요? 되돌리기로 복구할 수 있습니다.`))return;snapshot();drafts.splice(selected,1);selected=Math.max(0,selected-1);person=0;render();});
    tools.append(sceneBack,sceneNext,addScene,deleteScene);
    sceneSelect.input.addEventListener('change',()=>{selected=Number(sceneSelect.read());person=0;render();});
    const nav=el('div','ap2-editor-tabs'),content=el('div','ap2-editor-content'),status=el('p','ap2-muted');status.setAttribute('role','status');nav.setAttribute('aria-label','장면 편집 항목');
    for(const [key,label]of [['scene','장면 · 프롬프트'],['cast','인물 · 배치'],['final','최종 확인']]){const b=button(label,()=>{tab=key;renderContent();});b.classList.remove('menu_button','menu_button_icon');b.dataset.tab=key;nav.append(b);}
    dialog.querySelector('.ap2-header-title').append(status);body.append(nav,content);
    const footer=el('footer','ap2-footer ap2-editor-footer'),secondary=el('div','ap2-actions'),primary=el('div','ap2-actions');footer.append(secondary,primary);dialog.append(footer);
    const undoButton=iconButton('되돌리기','fa-rotate-left',()=>{const last=undo.pop();if(!last)return;drafts=last.drafts;Object.assign(config,last.config);selected=last.selected;person=last.person;dirty=true;render();});
    const input=el('input');input.type='file';input.accept='.json,application/json';input.hidden=true;
    secondary.append(undoButton,actionMenu([
        {label:'내보내기',icon:'fa-file-export',run:()=>downloadJson(sceneBundle(drafts,config),'scenebook-scenes.json')},
        {label:'가져오기',icon:'fa-file-import',run:()=>input.click()},
        {label:'사용법',icon:'fa-circle-question',run:showGuide},
    ],'더 보기',{compact:true}),input);
    input.addEventListener('change',async()=>{try{const file=input.files?.[0];if(!file)return;if(file.size>300000)throw new Error('300KB 이하 장면 파일을 선택하세요.');const value=readSceneBundle(JSON.parse(await file.text()),config,context.blocks.at(-1).index);snapshot();drafts=value.scenes;Object.assign(config,value.config);selected=person=0;render();notice('장면을 불러왔습니다.');}catch(e){notice(e.message,true);}finally{input.value='';}});
    const save=button('초안 저장',async()=>{await onDraft(drafts);dirty=false;status.textContent='초안 저장됨';},false,'fa-floppy-disk');
    const generate=button('생성',async()=>{await onGenerate(drafts);dirty=false;dialog.close();},true,'fa-wand-magic-sparkles');primary.append(save,generate);
    const headerClose=dialog.querySelector('.ap2-header button'),headerActions=el('div','ap2-actions ap2-header-actions');headerActions.append(button('설정',()=>generationEditor(config,next=>{for(const s of drafts)if(s.characters.length>MODELS[next.model].characters)throw new Error(`이 모델은 인물 ${MODELS[next.model].characters}명까지 지원합니다.`);snapshot();if(next.width!==config.width||next.height!==config.height)for(const s of drafts)delete s.size;Object.assign(config,next);render();}),false,'fa-sliders'),(()=>{const b=iconButton('닫기','fa-xmark',()=>closeEditor());b.classList.add('ap2-close');return b;})());headerClose.replaceWith(headerActions);
    async function closeEditor(){if(editing)return;editing=true;try{if(dirty){const {dialog:ask,body:askBody}=modal('편집 내용');ask.classList.add('ap2-compact');askBody.append(el('p','','저장하지 않은 변경 사항이 있습니다.'));const f=el('footer','ap2-footer');f.append(button('계속 편집',()=>ask.close()),button('저장 없이 닫기',()=>{ask.close();dirty=false;dialog.close();}),button('저장 후 닫기',async()=>{await onDraft(drafts);ask.close();dirty=false;dialog.close();},true));ask.append(f);await new Promise(resolve=>ask.addEventListener('close',resolve,{once:true}));}else dialog.close();}finally{editing=false;}}
    dialog.addEventListener('cancel',e=>{e.preventDefault();void closeEditor();});
    // This editor deliberately ignores backdrop clicks: an accidental click must not discard a draft.
    dialog.addEventListener('click',e=>{if(e.target===dialog)e.stopImmediatePropagation();},true);
    body.addEventListener('input',()=>{dirty=true;});
    function render(){
        selected=Math.max(0,Math.min(selected,drafts.length-1));sceneSelect.input.replaceChildren();
        drafts.forEach((s,i)=>{const o=el('option','',`장면 ${i+1} / ${drafts.length}`);o.value=i;sceneSelect.input.append(o);});sceneSelect.input.value=selected;sceneSelect.wrap.hidden=!drafts.length;sceneBack.hidden=sceneNext.hidden=drafts.length<2;
        sceneBack.disabled=selected===0||!drafts.length;sceneNext.disabled=selected>=drafts.length-1;deleteScene.disabled=!scene();undoButton.disabled=!undo.length;generate.disabled=!drafts.length;renderContent();
    }
    function renderContent(){
        for(const b of nav.children)b.setAttribute('aria-pressed',String(b.dataset.tab===tab));content.replaceChildren();status.textContent=`${MODELS[config.model].label} · ${config.width} × ${config.height} · ${config.steps} Steps`;
        if(!scene()){content.append(el('p','ap2-empty','장면을 추가하거나 파일을 가져오세요.'));return;}
        if(tab==='scene')renderScene();if(tab==='cast')renderCast();if(tab==='final')renderFinal();
    }
    function bind(parent,key,label,options={}){const f=field(label,scene()[key],options);parent.append(f.wrap);f.input.addEventListener('input',()=>{scene()[key]=f.read();});return f;}
    function renderScene(){
        if(config.placement==='inline'||config.placement==='auto')content.append(paragraphPosition(context.blocks,Number(scene().after),index=>{snapshot();scene().after=index;scene().evidence=context.blocks.find(block=>block.index===index)?.content.slice(0,2000)??'';undoButton.disabled=false;}));
        // Scene on one side, the job's shared prompts on the other; stacked on a narrow screen.
        const columns=el('div','ap2-edit-columns'),sceneSide=el('div',''),commonSide=el('div','');columns.append(sceneSide,commonSide);content.append(columns);
        const part=(side,title,help='')=>{const box=el('section','ap2-edit-block'),head=el('header','');head.append(el('h3','',title));if(help)head.append(el('p','ap2-muted',help));box.append(head);side.append(box);return box;};
        const bare=f=>{f.wrap.classList.add('ap2-field-bare');return f;},exact=!!scene().finalPrompt;
        const sceneBox=part(sceneSide,exact?'최종 프롬프트':'장면',exact?'직접 고친 최종 프롬프트입니다. 이 내용이 그대로 전송됩니다.':'이 그림의 배경·상황·행동입니다. 인물은 인물 · 배치에서 따로 적습니다.');
        bare(bind(sceneBox,'prompt','장면 프롬프트',{multiline:true,rows:4,placeholder:'배경, 조명, 장면의 시각적 상황을 입력하세요.'}));
        bind(sceneBox,'negative',exact?'최종 제외 요소 (UC)':'이 장면에서만 제외',{multiline:true,rows:2});
        if(exact){const direct=field('최종 프롬프트 직접 사용',true,{type:'checkbox',help:'끄면 이 내용을 장면으로 쓰고 메인 프롬프트·그림체·구도·품질 태그를 다시 붙입니다. 겹치는 태그는 직접 지워 주세요.'});direct.input.addEventListener('input',()=>{scene().finalPrompt=direct.read();renderContent();});sceneBox.append(direct.wrap);}
        // A page of panels: what all panels share is the scene prompt above; each panel is edited here.
        const page=!exact&&scene().page;
        if(page){
            sceneBox.querySelector('h3').textContent='모든 칸에 공통';sceneBox.querySelector('header p').textContent='장소 · 시간 · 빛처럼 모든 칸에 같은 것입니다.';
            const pageBox=part(sceneSide,'만화 페이지',`${page.panels.length}칸 · V5에서만 그립니다.`);
            const kind=field('형식',scene().pageFormat??'manga',{choices:[...PAGE_FORMATS.filter(([id])=>!['single','cuts'].includes(id)).map(([id,label])=>[id,label]),['single','한 장면으로 바꾸기']]});
            kind.input.addEventListener('change',()=>{snapshot();if(kind.read()==='single'){delete scene().page;delete scene().pageFormat;}else scene().pageFormat=kind.read();renderContent();});
            const webtoon=(scene().pageFormat??'manga')==='webtoon',grids=page.local&&!webtoon?PAGE_GRIDS[page.panels.length]:null;
            pageBox.append(kind.wrap);
            // A planned page sits on a grid; a page from before grids has only its layout sentence.
            if(grids){const grid=field('칸 나눔',gridFor(page)[0],{choices:grids.map(([id,label])=>[id,label])});grid.input.addEventListener('change',()=>{page.grid=grid.read();});pageBox.append(grid.wrap);}
            const layout=field(page.local?'칸 배치 직접 쓰기':'칸 배치',page.layout,{multiline:true,rows:2,placeholder:page.local?(webtoon?'비워 두면 칸 높이대로 그립니다':'비워 두면 칸 나눔대로 그립니다'):'예: top panel largest spanning the full width, two equal panels below'});layout.input.addEventListener('input',()=>{page.layout=layout.read();});
            pageBox.append(layout.wrap);
            // Each panel, then the people in it: the same person is written again for every panel.
            page.panels.forEach((panel,i)=>{
                const group=el('section','ap2-quick-panel'),f=bare(field(`${i+1}번째 칸`,panel.text,{multiline:true,rows:3}));f.input.addEventListener('input',()=>{panel.text=f.read();});
                group.append(el('h4','',`${i+1}번째 칸`),f.wrap);
                if(webtoon&&page.local){const h=field('칸 높이',panel.height??'medium',{choices:STRIP_HEIGHTS});h.input.addEventListener('change',()=>{panel.height=h.read();});group.append(h.wrap);}
                for(const c of panel.characters??[]){const g=field(c.name||'인물',c.prompt??'',{multiline:true,rows:2});g.input.addEventListener('input',()=>{c.prompt=g.read();});group.append(g.wrap);}
                pageBox.append(group);
            });
        }
        const cameraBox=part(sceneSide,page?'화면 비율':'구도 · 화면 비율');
        if(!exact&&!page){
            const camera=bare(bind(cameraBox,'camera','구도',{placeholder:'예: from side, upper body'}));cameraBox.insertBefore(cameraChips(camera).wrap,camera.wrap);
            const warning=viewWarning(camera,()=>scene());camera.wrap.after(warning.wrap);warning.update();
        }
        const shape=segmented('화면 비율',ORIENTATIONS,scene().size??'',value=>{snapshot();if(value)scene().size=value;else delete scene().size;undoButton.disabled=false;}),shapeRow=el('div','ap2-quick-shape');shapeRow.append(el('span','','화면 비율'),shape.wrap);cameraBox.append(shapeRow);
        if(!exact){
            // The shared prompts of this job. They start from the saved defaults or from the picture being edited.
            const common=part(commonSide,'메인 프롬프트','이 작업의 모든 장면에 붙는 화풍·공통 태그입니다. 여기서 고쳐도 기본 설정은 바뀌지 않습니다.');
            for(const [key,label,rows]of [['style','메인 프롬프트',4],['negative','제외할 요소 (UC)',3]]){const f=field(label,config[key],{multiline:true,rows});f.input.addEventListener('input',()=>{config[key]=f.read();});common.append(f.wrap);if(key==='style')f.wrap.classList.add('ap2-field-bare');}
            const look=field('그림체',LOOKS.some(([id])=>id===config.look)?config.look:'',{choices:LOOKS.map(([id,label])=>[id,label])});look.input.addEventListener('input',()=>{config.look=look.read();});common.append(look.wrap);
            const quality=field('품질 태그 자동 추가',config.quality,{type:'checkbox'});quality.input.addEventListener('input',()=>{config.quality=quality.read();});common.append(quality.wrap);
        }
        const instructions=el('details','ap2-guide-topic');instructions.append(el('summary','','AI로 다시 쓰기'));const direction=field('수정 지시',context.direction,{multiline:true,placeholder:'예: 인물은 유지하고 카메라만 멀리'}),scope=field('수정 범위','all',{choices:[['all','전체'],['camera','구도'],['background','배경'],['characters','인물']]});instructions.append(direction.wrap,scope.wrap);
        instructions.append(button('재분석',async()=>{const before=JSON.stringify(drafts);status.textContent='장면 분석 중…';try{const result=await onAnalyze(structuredClone(drafts),direction.read(),scope.read());if(JSON.stringify(drafts)!==before)throw new Error('분석 중 편집한 내용이 있어 결과로 덮어쓰지 않았습니다.');snapshot();drafts=result;render();status.textContent='분석 완료 · 변경 내용을 확인하세요.';}catch(e){status.textContent='분석 실패 · 기존 편집 내용을 유지했습니다.';throw e;}}));(exact?sceneSide:commonSide).append(instructions);
    }
    function renderCast(){
        if(scene().page){content.append(el('p','ap2-empty','만화 페이지는 칸마다 인물과 위치가 따로 있습니다. 칸 내용과 칸마다의 인물은 장면 · 프롬프트 탭의 만화 페이지에서 고칩니다.'));return;}
        const cast=scene().characters??=[];person=Math.max(0,Math.min(person,cast.length-1));
        const layout=el('div','ap2-cast-layout'),visual=el('div','ap2-cast-visual'),editor=el('div','ap2-cast-editor'),list=el('div','ap2-cast-list'),fieldsArea=el('div','ap2-cast-fields');layout.append(visual,editor);editor.append(list,fieldsArea);content.append(layout);
        const coords=field('좌표 적용',config.useCoords,{type:'checkbox'}),order=field('인물 순서 적용',config.useOrder,{type:'checkbox'});let currentFields={};
        const moved=()=>{config.useCoords=true;coords.input.checked=true;dirty=true;};
        const placement=positionEditor({model:config.model,width:config.width,height:config.height,backgroundUrl:previewUrl,showChoices:false,onMove:moved,onSelect:i=>{person=i;showPerson();},entries:()=>cast.map((c,i)=>({name:c.name,x:c.x??.5,y:c.y??.5,set:(x,y)=>{c.x=x;c.y=y;if(i===person&&currentFields.x){currentFields.x.input.value=x;currentFields.y.input.value=y;}}}))});
        visual.append(placement.element,coords.wrap,order.wrap);coords.input.addEventListener('input',()=>{config.useCoords=coords.read();});order.input.addEventListener('input',()=>{config.useOrder=order.read();});
        function names(){list.replaceChildren();cast.forEach((c,i)=>{const b=button(`${i+1}. ${c.name||`인물 ${i+1}`}`,()=>{person=i;placement.select(i);showPerson();});b.title=c.name||`인물 ${i+1}`;b.setAttribute('aria-pressed',String(i===person));list.append(b);});}
        function showPerson(){
            names();fieldsArea.replaceChildren();currentFields={};const c=cast[person];
            const actions=el('div','ap2-actions ap2-cast-actions');
            actions.append(button('추가',()=>{if(cast.length>=MODELS[config.model].characters)throw new Error(`최대 ${MODELS[config.model].characters}명입니다.`);snapshot();cast.push({name:`인물 ${cast.length+1}`,prompt:'',negative:'',x:.5,y:.5});person=cast.length-1;render();},false,'fa-plus'));
            const move=delta=>{const to=person+delta;if(to<0||to>=cast.length)return;snapshot();[cast[person],cast[to]]=[cast[to],cast[person]];person=to;render();};
            const up=iconButton('인물 앞으로','fa-arrow-up',()=>move(-1)),down=iconButton('인물 뒤로','fa-arrow-down',()=>move(1));up.disabled=person===0||!c;down.disabled=person>=cast.length-1;actions.append(up,down);
            const remove=iconButton('인물 삭제','fa-trash-can',async()=>{if(!c||!await confirmAction('인물 삭제',`“${c.name||'선택한 인물'}”을 이 장면에서 삭제할까요? 되돌리기로 복구할 수 있습니다.`))return;snapshot();cast.splice(person,1);person=Math.max(0,person-1);render();});remove.disabled=!c;actions.append(remove);fieldsArea.append(actions);
            if(!c){fieldsArea.append(el('p','ap2-empty','인물을 추가하면 프롬프트와 위치를 편집할 수 있습니다.'));return;}
            addField(fieldsArea,currentFields,'name','이름',c.name);addField(fieldsArea,currentFields,'prompt','인물 프롬프트',c.prompt,{multiline:true,rows:5});addField(fieldsArea,currentFields,'negative','인물 제외 요소',c.negative,{multiline:true,rows:2});
            const position=el('div','ap2-grid');fieldsArea.append(position);for(const [key,label]of [['x','가로 위치'],['y','세로 위치']])addField(position,currentFields,key,label,c[key]??.5,{type:'number',min:0,max:1,step:.01});
            for(const [key,f]of Object.entries(currentFields))f.input.addEventListener('input',()=>{c[key]=f.read();if(key==='name'){names();placement.refresh();placement.select(person);}if(key==='x'||key==='y'){moved();placement.update();}});
        }
        showPerson();placement.select(person);
    }
    function renderFinal(){
        content.append(el('p','ap2-note','그림체·메인 프롬프트·구도·장면·품질 태그를 합친, 실제로 보낼 프롬프트입니다. 확인만 해도 됩니다. 여기서 직접 고치면 이 장면은 입력한 내용만 그대로 전송합니다.'));
        const preset=activePreset(config);if(preset)content.append(el('p','ap2-muted',`그림체 프리셋 · ${preset.name}`));
        let payload,pageCharacters=null;try{
            let sent=scene(),settings={...withLook(config,config.look??''),references:usableReferences(config.model,config.references??[])};
            if(sent.page?.panels?.length){({scene:sent,config:settings}=compilePage(sent,{...settings,speechBubbles:!!sent.bubbles}));pageCharacters=sent.characters;}
            else sent=compileScene(sent,settings);
            payload=buildPayload(sent,settings,config.seed===-1?0:config.seed);
        }catch(e){content.append(el('p','ap2-muted',e.message));return;}
        const prompt=field('최종 장면 프롬프트',payload.input,{multiline:true,rows:7}),negative=field('최종 제외 요소',payload.parameters.negative_prompt,{multiline:true,rows:4});content.append(prompt.wrap,negative.wrap);
        for(const f of [prompt,negative])f.input.addEventListener('input',()=>{Object.assign(scene(),{prompt:prompt.read(),negative:negative.read(),camera:'',finalPrompt:true});if(pageCharacters){scene().characters=pageCharacters;delete scene().page;}dirty=true;});
        if(scene().characters.length)content.append(el('p','ap2-muted',`인물 ${scene().characters.length}명의 프롬프트는 인물 · 배치에서 따로 전송됩니다.`));
    }
    render();return dialog;
}
