// 씬북+ · 지시문 편집 창의 '출력 규칙' 고치기
// 기본 규칙은 지금 설정(장면 수·그림 위치·그림 형식)에 맞춰 자동으로 만들어집니다.
// 직접 고쳐 적용하면 그 글이 그대로 쓰이고, '기본 규칙으로'를 누르고 적용하면 다시 자동으로 돌아갑니다.
import { VISIBLE_DETAIL } from '../tag-rules.mjs';
import { ADULT_SCENE_RULES } from '../injection.mjs';
import { JSON_OUTPUT_RULES } from '../plan-json.mjs';
import { placementRule } from '../placement-rules.mjs';
import { pageRules } from '../comic.mjs';
import { customRules, saveCustomRules } from './output-rules-store.mjs';

// 수동 분석 때 지시문 뒤에 붙는 기본 규칙 (원본 prompts.mjs renderAnalysis와 같은 내용)
export function analysisOutputRules(config){
    const placement=[pageRules(config,'analysis'),placementRule(config,'analysis')].filter(Boolean).join('\n');
    return `${VISIBLE_DETAIL}\n\n${ADULT_SCENE_RULES}\n\n${placement}\n${JSON_OUTPUT_RULES}`;
}

// 출력 규칙 칸. field: 원본 ui.mjs의 field, button: 원본 button, defaultText: 지금 설정의 기본 규칙
export function rulesEditor({kind,defaultText,field,button,el}){
    const custom=customRules(kind);
    const box=field('출력 규칙',custom||defaultText,{multiline:true,rows:14});
    const state=el('p','ap2-muted');state.setAttribute('role','status');
    const sync=()=>{state.textContent=box.read().trim()===defaultText.trim()?'지금은 기본 규칙입니다. 장면 수·그림 위치·그림 형식 설정에 맞춰 자동으로 바뀝니다.':'직접 고친 규칙입니다. 적용하면 이 글이 그대로 전달되고, 장면 수·그림 위치·그림 형식을 바꿔도 자동으로 바뀌지 않습니다.';};
    box.input.addEventListener('input',sync);sync();
    const reset=button('기본 규칙으로',()=>{box.input.value=defaultText;box.input.dispatchEvent(new Event('input'));},false,'fa-rotate-left');
    const wrap=el('div');wrap.append(box.wrap,state,reset);
    return{
        wrap,
        // 적용할 때 호출: 기본과 같으면 '자동'으로 저장
        save(){const value=box.read();saveCustomRules(kind,value.trim()===defaultText.trim()?'':value);},
    };
}
