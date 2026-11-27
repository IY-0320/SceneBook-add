// 씬북+ · 프리셋 그림체 빠른 선택
// '프리셋 · 백업'에 저장한 프리셋을 바로 고르고, 지금 적용 중인 프리셋을 표시하며,
// 이미 만든 그림을 다시 만들 때 적용 중인 프리셋의 그림체를 반영합니다.
import { host } from './host.mjs';
import { splitLook } from '../framing.mjs';

const STYLE_STORE='scenebook-active-style';
export const STYLE_NONE='\u0000none';
// 그림체로 취급하는 항목. 가로·세로 크기와 시드는 그림마다 따로 유지합니다.
const STYLE_KEYS=['model','steps','scale','sampler','scheduler','cfgRescale','style','negative','look','quality','references','useCoords','useOrder'];
const sameValue=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
const readActiveStyle=()=>{try{return localStorage.getItem(STYLE_STORE)||'';}catch{return '';}};
export const writeActiveStyle=name=>{try{if(name)localStorage.setItem(STYLE_STORE,name);else localStorage.removeItem(STYLE_STORE);}catch{}};
// look(원본의 '그림체' 선택)이 없는 프리셋은 적용해도 look이 바뀌지 않으므로 비교하지 않습니다.
export const matchesStyle=(preset,now)=>{
    const config=preset?.config;if(!config)return false;
    if(!['style','negative','model'].every(k=>sameValue(config[k],now?.[k])))return false;
    return typeof config.look!=='string'||(config.look||'')===(now?.look||'');
};

// 지금 적용 중인 프리셋 번호 (없으면 -1)
export function activeStyleIndex(){
    const now=host.settings(),list=now.presets??[],name=readActiveStyle();
    if(name===STYLE_NONE)return -1;
    if(name){const i=list.findIndex(p=>p.name===name&&matchesStyle(p,now));if(i>=0)return i;}
    return list.findIndex(p=>matchesStyle(p,now));
}
// 직접 고른(적용·빠른 선택) 프리셋이 지금 설정과 같을 때만 그 번호. 설정이 우연히 프리셋과 같은 것만으로는 -1.
function chosenStyleIndex(){
    const now=host.settings(),name=readActiveStyle();
    if(!name||name===STYLE_NONE)return -1;
    return(now.presets??[]).findIndex(p=>p.name===name&&matchesStyle(p,now));
}
// 이미 만든 그림을 다시 만들 때, 직접 고른 그림체가 있으면 그 그림의 설정 위에 덮어씁니다.
export function restyle(config){
    if(!config||chosenStyleIndex()<0)return config;
    const now=host.settings();
    return{...config,...Object.fromEntries(STYLE_KEYS.filter(k=>now[k]!==undefined).map(k=>[k,structuredClone(now[k])]))};
}
export function applyStylePreset(index){
    const now=host.settings(),preset=now.presets?.[index];if(!preset)throw new Error('프리셋을 찾을 수 없습니다.');
    host.saveSettings({...now,...preset.config});writeActiveStyle(preset.name);
    host.notice(`그림체 적용 · ${preset.name}`);
}

// 장면 편집 창의 '프롬프트' 탭: 이 작업에 쓰인 프리셋(그림체)을 보여 주기만 합니다. 바꾸는 곳은 그림 고치기 창입니다.
export function presetInfo({presets,config}){
    const index=presets.findIndex(p=>matchesStyle(p,config));
    const line=document.createElement('p');line.className='ap2-note';
    line.textContent=index>=0?`그림체 프리셋 · ${presets[index].name}`:'그림체 프리셋 · 저장한 프리셋과 다른 설정입니다';
    line.title='그림체는 그림 위 연필(그림 고치기)에서 바꿉니다.';
    return line;
}

// 그림 고치기 창(연필)의 '그림체 프리셋' 칸.
// 고르면 아래 메인 프롬프트·제외할 요소·그림체 칸을 프리셋 값으로 채우고, 모델·Steps 등 나머지 그림체 설정은
// 이번에 다시 그릴 그림에만 씁니다. 크기와 시드는 그 그림 그대로입니다.
// fields: {style, negative, look} (원본 quick-edit.mjs의 입력 칸), characters(): 지금 장면의 인물 수
export function quickPresetPicker({presets,config,fields,characters,isFinal,field,notice,MODELS}){
    const box=document.createElement('section');box.className='ap2-edit-block';
    const head=document.createElement('header'),title=document.createElement('h3'),help=document.createElement('p');
    title.textContent='그림체 프리셋';help.className='ap2-muted';
    help.textContent=presets.length?'프리셋 · 백업에 저장한 그림체로 이 그림을 다시 그립니다. 크기와 시드는 그대로입니다.':'프리셋 · 백업에 저장한 프리셋이 아직 없습니다.';
    head.append(title,help);box.append(head);
    const current=presets.findIndex(p=>matchesStyle(p,config));
    const pick=field('프리셋',current>=0?String(current):'',{choices:[['','지금 그림 그대로'],...presets.map((p,i)=>[String(i),p.name])]});
    box.append(pick.wrap);
    const original={style:config.style??'',negative:config.negative??'',look:config.look??''};
    let extra={},chosen=pick.read();
    const set=(f,value)=>{f.input.value=value;f.input.dispatchEvent(new Event('input',{bubbles:true}));};
    pick.input.addEventListener('change',()=>{
        const value=pick.read(),preset=presets[Number(value)];
        try{
            if(value===''||!preset){extra={};set(fields.style,original.style);set(fields.negative,original.negative);set(fields.look,original.look);chosen=value;return;}
            const model=MODELS[preset.config.model??config.model];
            if(model&&characters()>model.characters)throw new Error(`이 프리셋의 모델은 인물 ${model.characters}명까지 지원합니다.`);
            extra=Object.fromEntries(STYLE_KEYS.filter(k=>!['style','negative','look'].includes(k)&&preset.config[k]!==undefined).map(k=>[k,structuredClone(preset.config[k])]));
            set(fields.style,preset.config.style??'');set(fields.negative,preset.config.negative??'');
            if(typeof preset.config.look==='string')set(fields.look,preset.config.look);
            chosen=value;
            notice(isFinal()?`그림체 프리셋 · ${preset.name} · 최종 프롬프트를 직접 고친 그림이라 모델 등 설정만 바뀝니다.`:`그림체 프리셋 · ${preset.name}`);
        }catch(e){pick.input.value=chosen;notice(e.message,true);}
    });
    return{wrap:box,extra:()=>structuredClone(extra)};
}

// 만든 그림의 설정이 어느 프리셋과 같은지: 큰 그림 보기 제목에 '삽화 · 프리셋 이름'으로 보입니다.
// 생성 기록에는 그림체 태그가 메인 프롬프트에 합쳐져 있어 나눈 뒤 비교합니다. 같은 프리셋이 없으면 ''.
export function styleName(config){
    if(!config||!host.settings)return '';
    const presets=host.settings().presets??[],plain=splitLook(config);
    const now={...config,style:plain.style,negative:plain.negative,look:typeof config.look==='string'?config.look:plain.look};
    return presets.find(p=>matchesStyle(p,now))?.name??'';
}
