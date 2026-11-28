// 씬북+ · 직접 고친 '출력 규칙' 저장소
// 원본 설정(autopic2)은 모르는 값을 지우므로 extensionSettings.autopic2_output_rules에 따로 둡니다.
// kind: 'analysis'(수동 분석 지시문) · 'injection'(삽화 지시문). 비어 있으면 기본(자동) 규칙을 씁니다.
const KEY='autopic2_output_rules';
const stContext=()=>{try{return globalThis.SillyTavern?.getContext?.()??null;}catch{return null;}};
export function customRules(kind){
    const saved=stContext()?.extensionSettings?.[KEY]?.[kind];
    return typeof saved==='string'&&saved.trim()?saved:'';
}
export function saveCustomRules(kind,value){
    const c=stContext();if(!c?.extensionSettings)return;
    const text=String(value??'');
    if(text.length>30000)throw new Error('출력 규칙은 30000자까지 쓸 수 있습니다.');
    c.extensionSettings[KEY]={...(c.extensionSettings[KEY]??{}),[kind]:text.trim()?text:''};
    c.saveSettingsDebounced?.();
}
