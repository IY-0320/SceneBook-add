// 씬북+ · 프리셋 그림체 빠른 선택
// '프리셋 · 백업'에 저장한 프리셋을 바로 고르고, 지금 적용 중인 프리셋을 표시하며,
// 이미 만든 그림을 다시 만들 때 적용 중인 프리셋의 그림체를 반영합니다.
import { host } from './host.mjs';

const STYLE_STORE='scenebook-active-style';
export const STYLE_NONE='\u0000none';
// 그림체로 취급하는 항목. 가로·세로 크기와 시드는 그림마다 따로 유지합니다.
const STYLE_KEYS=['model','steps','scale','sampler','scheduler','cfgRescale','style','negative','look','quality','references','useCoords','useOrder'];
const sameValue=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
const readActiveStyle=()=>{try{return localStorage.getItem(STYLE_STORE)||'';}catch{return '';}};
export const writeActiveStyle=name=>{try{if(name)localStorage.setItem(STYLE_STORE,name);else localStorage.removeItem(STYLE_STORE);}catch{}};
export const matchesStyle=(preset,now)=>['style','negative','look','model'].every(k=>sameValue(preset?.config?.[k],now?.[k]));

// 지금 적용 중인 프리셋 번호 (없으면 -1)
export function activeStyleIndex(){
    const now=host.settings(),list=now.presets??[],name=readActiveStyle();
    if(name===STYLE_NONE)return -1;
    if(name){const i=list.findIndex(p=>p.name===name&&matchesStyle(p,now));if(i>=0)return i;}
    return list.findIndex(p=>matchesStyle(p,now));
}
// 이미 만든 그림을 다시 만들 때, 적용 중인 그림체를 그 그림의 설정 위에 덮어씁니다.
export function restyle(config){
    if(!config||activeStyleIndex()<0)return config;
    const now=host.settings();
    return{...config,...Object.fromEntries(STYLE_KEYS.filter(k=>now[k]!==undefined).map(k=>[k,structuredClone(now[k])]))};
}
export function applyStylePreset(index){
    const now=host.settings(),preset=now.presets?.[index];if(!preset)throw new Error('프리셋을 찾을 수 없습니다.');
    host.saveSettings({...now,...preset.config});writeActiveStyle(preset.name);
    host.notice(`그림체 적용 · ${preset.name}`);
}

// 장면 편집 창의 '프롬프트' 탭에 넣는 프리셋 선택 칸. 고르면 이번 작업의 설정만 그 프리셋 값으로 바뀝니다.
// field·notice·MODELS는 원본 ui.mjs/core.mjs의 것을 받아 씁니다.
export function presetPicker({presets,config,drafts,exact,field,notice,MODELS,before,after}){
    const current=presets.findIndex(p=>matchesStyle(p,config));
    const help=presets.length?(exact?'이 장면은 최종 프롬프트를 직접 고쳐서 메인 프롬프트·그림체 태그는 바뀌지 않습니다. 나머지 설정은 바뀝니다.':'고르면 프리셋 · 백업에 저장한 설정으로 바뀝니다. 기본 설정은 바뀌지 않습니다.'):'프리셋 · 백업에 저장한 프리셋이 아직 없습니다.';
    const look=field('저장한 프리셋',current>=0?String(current):'',{choices:[['','사용 안 함'],...presets.map((p,i)=>[String(i),p.name])],help});
    look.input.addEventListener('change',()=>{
        try{
            if(look.read()==='')return;
            const preset=presets[Number(look.read())];if(!preset)return;
            const next={...config,...preset.config},model=MODELS[next.model];
            if(model)for(const s of drafts())if((s.characters?.length??0)>model.characters)throw new Error(`이 모델은 인물 ${model.characters}명까지 지원합니다.`);
            before();
            if(next.width!==config.width||next.height!==config.height)for(const s of drafts())delete s.size;
            Object.assign(config,preset.config);after();
            notice(`그림체 적용 · ${preset.name}`);
        }catch(e){notice(e.message,true);after();}
    });
    return look.wrap;
}
