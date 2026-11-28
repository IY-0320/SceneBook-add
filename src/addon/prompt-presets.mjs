// 씬북+ · 지시문 저장 (저장한 지시문 · 지시문 세트)
// - 저장한 지시문: 지시문 편집 창의 '수동 분석 지시문'·'삽화 지시문' 탭마다, 그 지시문(+출력 규칙)을 이름 붙여 저장하고 불러옵니다.
// - 지시문 세트: 바깥 'AI 지시문 · 프롬프트 공유' 칸에서, 지금의 수동 분석 지시문 + 삽화 지시문(+각 출력 규칙)을
//   한 묶음으로 저장하고 한 번에 바꿉니다. 세트는 저장한 순간의 내용을 그대로 복사해 둡니다.
// 공통 프롬프트(메인·UC)는 그림체 프리셋이 맡으므로 여기엔 넣지 않습니다.
// 저장 키: extensionSettings.autopic2_prompt_presets = {analysis:[{name,prompt,rules}], injection:[...], sets:[{name,analysis:{prompt,rules},injection:{prompt,rules}}]}
// prompt ''은 기본 지시문, rules ''은 기본(자동) 출력 규칙입니다.
import { el, button, field, confirmAction, notice } from '../ui.mjs';
import { customRules, saveCustomRules } from './output-rules-store.mjs';
import { validateTemplate } from '../prompts.mjs';
import { validateInjectionTemplate } from '../injection.mjs';

const KEY='autopic2_prompt_presets',MAX=30;
const KIND_LABEL={analysis:'수동 분석 지시문',injection:'삽화 지시문'};
const stContext=()=>{try{return SillyTavern.getContext();}catch{return null;}};
const text=value=>typeof value==='string'?value:'';
const part=value=>({prompt:text(value?.prompt),rules:text(value?.rules)});
function store(){
    const v=stContext()?.extensionSettings?.[KEY];
    const list=x=>Array.isArray(x)?x.filter(p=>p&&typeof p.name==='string'&&p.name):[];
    return{
        analysis:list(v?.analysis).map(p=>({name:p.name,...part(p)})),
        injection:list(v?.injection).map(p=>({name:p.name,...part(p)})),
        sets:list(v?.sets).map(p=>({name:p.name,analysis:part(p.analysis),injection:part(p.injection)})),
    };
}
function write(next){const c=stContext();if(!c?.extensionSettings)throw new Error('설정을 저장할 수 없습니다.');c.extensionSettings[KEY]=next;c.saveSettingsDebounced?.();}
const cleanName=value=>String(value??'').trim().slice(0,100);
// 같은 이름이면 확인 후 덮어쓰기. 저장했으면 true.
async function upsert(listName,item,label){
    const now=store(),list=[...now[listName]],at=list.findIndex(p=>p.name===item.name);
    if(at>=0){if(!await confirmAction(`${label} 덮어쓰기`,`“${item.name}”이(가) 이미 있습니다. 지금 내용으로 바꿀까요?`,'덮어쓰기'))return false;list[at]=item;}
    else{if(list.length>=MAX)throw new Error(`${label}은(는) 최대 ${MAX}개입니다.`);list.push(item);}
    write({...now,[listName]:list});return true;
}
async function remove(listName,name,label){
    if(!await confirmAction(`${label} 삭제`,`“${name}”을(를) 삭제할까요?`))return false;
    const now=store();write({...now,[listName]:now[listName].filter(p=>p.name!==name)});return true;
}
// 이 칸들의 입력이 씬북 창 페이지의 자동 저장으로 번지지 않게 합니다.
const quiet=input=>{for(const type of ['input','change'])input.addEventListener(type,event=>event.stopPropagation());};

// 지시문 편집 창 각 탭 맨 위의 '저장한 지시문' 칸.
// prompt: {read(), set(value)} 지시문 칸 (read가 기본과 같으면 ''을 돌려줘야 함), rules: {read(), set(value)} 또는 null(간결한 지시문)
export function savedPromptPicker({kind,prompt,rules}){
    const box=el('details','ap2-guide-topic');box.append(el('summary','','저장한 지시문'));
    const help=el('p','ap2-muted',`이 ${KIND_LABEL[kind]}과 출력 규칙을 이름 붙여 저장하고 불러옵니다. 불러온 내용은 아래 적용을 눌러야 저장됩니다.`);
    const row=el('div','ap2-actions'),nameRow=el('div','ap2-actions');
    let pick,nameField;
    const draw=()=>{
        const list=store()[kind];
        pick=field('불러오기','',{choices:[['','고르기'],...list.map((p,i)=>[String(i),p.name])]});
        pick.input.addEventListener('change',()=>{
            const item=store()[kind][Number(pick.read())];if(!item)return;
            prompt.set(item.prompt);rules?.set(item.rules);
            if(nameField)nameField.input.value=item.name;
            notice(`불러옴 · ${item.name} · 적용을 눌러야 저장됩니다.`);
        });
        const del=button('삭제',async()=>{const item=store()[kind][Number(pick.read())];if(!item)throw new Error('삭제할 지시문을 고르세요.');if(await remove(kind,item.name,'저장한 지시문'))draw();},false,'fa-trash-can');
        row.replaceChildren(pick.wrap,del);
    };
    nameField=field('저장할 이름','');nameField.input.maxLength=100;
    const save=button('지금 내용 저장',async()=>{
        const name=cleanName(nameField.read());if(!name)throw new Error('저장할 이름을 입력하세요.');
        const value=prompt.read();
        if(kind==='analysis')validateTemplate(value);else validateInjectionTemplate(value);
        if(await upsert(kind,{name,prompt:value,rules:rules?rules.read():''},'저장한 지시문')){draw();notice(`지시문 저장 · ${name}`);}
    },false,'fa-floppy-disk');
    nameRow.append(nameField.wrap,save);draw();
    box.append(help,row,nameRow);
    return box;
}

// 지금 설정이 어느 세트와 같은지 (없으면 -1)
function currentSet(settings){
    const now={analysis:{prompt:text(settings.analysisPrompt),rules:customRules('analysis')},injection:{prompt:text(settings.injectionPrompt),rules:customRules('injection')}};
    const same=(a,b)=>a.prompt.trim()===b.prompt.trim()&&a.rules.trim()===b.rules.trim();
    return store().sets.findIndex(s=>same(s.analysis,now.analysis)&&same(s.injection,now.injection));
}
function applySet(api,set){
    validateTemplate(set.analysis.prompt);validateInjectionTemplate(set.injection.prompt);
    saveCustomRules('analysis',set.analysis.rules);saveCustomRules('injection',set.injection.rules);
    api.saveSettings({...api.settings(),analysisPrompt:set.analysis.prompt,injectionPrompt:set.injection.prompt});
    notice(`지시문 세트 적용 · ${set.name}`);
}

// 바깥 'AI 지시문 · 프롬프트 공유' 칸의 '지시문 세트'.
export function promptSetSection(parent,{api,open}){
    const sets=store().sets,active=currentSet(api.settings());
    const box=el('div','ap2-plus-prompt-sets');
    box.append(el('p','ap2-muted','지시문 세트: 지금의 수동 분석 지시문과 삽화 지시문(각 출력 규칙 포함)을 한 묶음으로 저장해 두고 한 번에 바꿉니다.'));
    if(sets.length){
        const pick=field('지시문 세트 빠른 선택',active>=0?String(active):'',{choices:[['','고르기'],...sets.map((s,i)=>[String(i),s.name])]});quiet(pick.input);
        pick.input.addEventListener('change',()=>{const set=store().sets[Number(pick.read())];if(!set)return;try{applySet(api,set);}catch(e){notice(e.message,true);}return open('prompt',true);});
        box.append(pick.wrap);
        for(const [i,s]of sets.entries()){
            const row=el('div','ap2-preset-row');row.append(el('span','',s.name));
            if(i===active)row.append(el('b','ap2-active-badge','적용 중'));
            row.append(button('삭제',async()=>{if(await remove('sets',s.name,'지시문 세트'))return open('prompt',true);}));
            box.append(row);
        }
    }
    const name=field('새 세트 이름','');name.input.maxLength=100;quiet(name.input);
    const save=button('지금 지시문을 세트로 저장',async()=>{
        const setName=cleanName(name.read());if(!setName)throw new Error('세트 이름을 입력하세요.');
        const s=api.settings();
        const set={name:setName,analysis:{prompt:text(s.analysisPrompt),rules:customRules('analysis')},injection:{prompt:text(s.injectionPrompt),rules:customRules('injection')}};
        if(await upsert('sets',set,'지시문 세트')){notice(`지시문 세트 저장 · ${setName}`);return open('prompt',true);}
    },false,'fa-floppy-disk');
    box.append(name.wrap,save);
    parent.append(box);
}
