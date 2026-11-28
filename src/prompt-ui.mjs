import { DEFAULT_ANALYSIS_PROMPT, promptBundle, readPromptBundle } from './prompts.mjs';
import { DEFAULT_INJECTION_PROMPT as FULL_INJECTION_PROMPT, LEAN_INJECTION_PROMPT, illustrationOutputRules } from './injection.mjs';
import { JSON_OUTPUT_RULES } from './plan-json.mjs';
import { el, button, field, modal, notice, downloadJson } from './ui.mjs';
import { rulesEditor, analysisOutputRules } from './addon/output-rules.mjs'; // [add] 씬북+ 출력 규칙 고치기
import { savedPromptPicker } from './addon/prompt-presets.mjs'; // [add] 씬북+ 저장한 지시문

export function promptEditor(config,onApply,{initial='image'}={}){
    const {dialog,body}=modal('프롬프트'),DEFAULT_INJECTION_PROMPT=config.leanPrompt?LEAN_INJECTION_PROMPT:FULL_INJECTION_PROMPT;
    const tabs=el('div','ap2-editor-tabs'),image=el('div'),analysis=el('div'),injection=el('div');analysis.hidden=injection.hidden=true;
    const style=field('메인 프롬프트',config.style,{multiline:true,rows:5}),negative=field('UC 프롬프트',config.negative,{multiline:true}),quality=field('품질 태그',config.quality,{type:'checkbox'});
    image.append(style.wrap,negative.wrap,quality.wrap,el('p','ap2-muted','모든 장면의 공통값입니다. 장면·인물별 프롬프트는 장면 편집에서 수정합니다.'));
    const template=field('장면 분석 지시문',config.analysisPrompt||DEFAULT_ANALYSIS_PROMPT,{multiline:true,rows:17});
    analysis.append(template.wrap,el('p','ap2-muted','{{data}} 채팅·인물 · {{maxScenes}} 장면 수 · {{modelRule}} 모델별 작성법 · {{playerRule}} POV · {{direction}} 수정 지시. JSON 응답 형식을 유지하세요.'));
    const injected=field('삽화 주입 프롬프트',config.injectionPrompt||DEFAULT_INJECTION_PROMPT,{multiline:true,rows:17});injection.append(el('p','ap2-muted','주입 위치: 채팅 완성은 프리셋 조립 후 마지막 System 지시로 이동합니다. 이어쓰기·답변 시작문이 있으면 그 바로 앞에 둡니다. 전체를 <image_generation> 태그로 감싸며 API 후처리가 역할을 변환할 수 있습니다. 텍스트 완성은 기존 깊이 0 위치를 사용합니다.'),injected.wrap,el('p','ap2-muted','이 기본 프롬프트가 대화 AI에 전달됩니다. 직접 수정할 수 있으며 적용하면 바로 저장됩니다. 바깥 태그는 확장이 자동으로 붙이므로 <!--scenebook 출력 형식과 {{data}} 변수만 유지하세요. 장면 제목은 더 이상 요구하지 않습니다. 예전에 저장한 JSON 형식 지시문도 그대로 동작하며, 기본 지시문 버튼으로 짧은 줄 단위 형식으로 바꿀 수 있습니다.'));
    const plusRules=[]; /* [add] */
    for(const section of [analysis,injection]){
        /* [add] 씬북+: 출력 규칙을 고칠 수 있게 합니다. 간결한 삽화 지시문은 규칙을 덧붙이지 않아 안내만 보여 줍니다. */
        const rules=el('details','ap2-guide-topic');rules.append(el('summary','','출력 규칙'),el('p','ap2-muted',section===injection?'주입이 켜진 답변에 지시문 뒤로 덧붙여 전달하는 규칙입니다. 직접 고칠 수 있고, 적용하면 저장됩니다.':'수동 분석 때 지시문 뒤에 덧붙여 전달하는 규칙입니다. 직접 고칠 수 있고, 적용하면 저장됩니다.'));
        if(section===injection&&config.leanPrompt)rules.append(el('pre','ap2-code','간결한 삽화 지시문을 켠 상태에서는 추가 출력 규칙을 덧붙이지 않습니다.'));
        let editor=null;if(!(section===injection&&config.leanPrompt)){editor=rulesEditor({kind:section===injection?'injection':'analysis',defaultText:section===injection?illustrationOutputRules(config):analysisOutputRules(config),field,button,el});rules.append(editor.wrap);plusRules.push(editor);}
        section.append(rules);
        /* [add] 씬북+ 저장한 지시문: 탭 맨 위 */{const input=section===injection?injected:template,base=section===injection?DEFAULT_INJECTION_PROMPT:DEFAULT_ANALYSIS_PROMPT;section.prepend(savedPromptPicker({kind:section===injection?'injection':'analysis',prompt:{read:()=>input.read()===base?'':input.read(),set:value=>{input.input.value=value||base;input.input.dispatchEvent(new Event('input'));}},rules:editor}));}
    }
    let active=initial==='injection'?2:0;const sections=[image,analysis,injection];sections.forEach((s,n)=>s.hidden=n!==active);
    for(const [i,label]of ['공통 프롬프트','수동 분석 지시문','삽화 지시문'].entries()){const b=button(label,()=>{active=i;sections.forEach((s,n)=>s.hidden=n!==i);[...tabs.children].forEach((t,n)=>t.setAttribute('aria-pressed',String(n===i)));});b.classList.remove('menu_button','menu_button_icon');b.setAttribute('aria-pressed',String(i===active));tabs.append(b);}body.append(tabs,...sections);
    const read=()=>promptBundle({style:style.read(),negative:negative.read(),quality:quality.read(),analysisPrompt:template.read()===DEFAULT_ANALYSIS_PROMPT?'':template.read(),injectionPrompt:injected.read()===DEFAULT_INJECTION_PROMPT?'':injected.read()});
    const tools=el('div','ap2-actions'),file=el('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
    tools.append(button('내보내기',()=>downloadJson(read(),'scenebook-prompts.json')),button('가져오기',()=>file.click()),button('기본 지시문',()=>{if(active===2)injected.input.value=DEFAULT_INJECTION_PROMPT;else template.input.value=DEFAULT_ANALYSIS_PROMPT;notice('기본 지시문을 불러왔습니다. 적용 전까지 저장되지 않습니다.');}),file);body.append(tools);
    file.addEventListener('change',async()=>{try{const f=file.files?.[0];if(!f)return;if(f.size>100000)throw new Error('100KB 이하 프롬프트 파일을 선택하세요.');const v=readPromptBundle(JSON.parse(await f.text()));style.input.value=v.style;negative.input.value=v.negative;quality.input.checked=v.quality;template.input.value=v.analysisPrompt||DEFAULT_ANALYSIS_PROMPT;injected.input.value=v.injectionPrompt||DEFAULT_INJECTION_PROMPT;notice('프롬프트를 불러왔습니다. 내용을 확인한 뒤 적용하세요.');}catch(e){notice(e.message,true);}finally{file.value='';}});
    const footer=el('footer','ap2-footer');footer.append(button('적용',async()=>{const {kind,schema,...value}=read();for(const editor of plusRules)editor.save();/* [add] */await onApply(value);dialog.close();},true));dialog.append(footer);
}
