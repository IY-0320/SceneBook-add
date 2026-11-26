import { host } from './host.mjs';
// 씬북+ · 'AI가 장면 쓰기' 응답 읽기 보강
// 원본은 응답이 JSON으로 바로 시작할 때만 읽습니다. 대화 AI가 앞에 설명 문장, <think> 생각 블록,
// 문장 뒤의 ```json 코드 블록 등을 붙이면 읽지 못해 생성이 멈췄습니다.
// 먼저 원본 방식으로 읽고, 실패하면 아래 후보를 차례로 시도합니다.
const THINK=/<(think|thinking|reasoning|thought)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;

function candidates(raw){
    const list=[],add=value=>{value=String(value??'').trim();if(value&&!list.includes(value))list.push(value);};
    const text=raw.replace(THINK,'').trim();
    add(text);
    // 문장 사이에 들어간 코드 블록
    for(const match of text.matchAll(/(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1/g))add(match[2]);
    // "scenes"가 들어 있는 가장 바깥 { ... }
    const key=text.search(/[{[]\s*"scenes"\s*:/);
    const first=key>=0?key:text.indexOf('{'),last=text.lastIndexOf('}');
    if(first>=0&&last>first)add(text.slice(first,last+1));
    return list;
}

// parse: 원본 parsePlanJson
export function parseAnalysisResponse(raw,parse){
    raw=String(raw??'');
    try{return parse(raw);}catch(original){
        for(const source of candidates(raw)){try{return parse(source);}catch{}}
        const preview=raw.replace(THINK,'').replace(/\s+/g,' ').trim().slice(0,160);
        const error=new Error(preview?`AI 응답 앞부분: ${preview}${raw.length>160?'…':''}`:'AI 응답이 비어 있습니다. 생각하는 AI가 답할 길이를 생각에 다 썼을 수 있습니다. 그림 설정 → 수동 분석 → 분석 답 길이를 늘리거나, 대화 AI의 생각(추론) 수준을 낮춰 보세요. 차단(필터)된 경우에도 비어 있을 수 있습니다.',{cause:original});
        throw error;
    }
}

// 'AI가 장면 쓰기'에서 AI가 답할 수 있는 최대 길이(토큰).
// 원본은 장면 수 × 1800(최대 6000)으로 정해져 있어, 생각(추론)하는 AI가 그 길이를 생각에 다 쓰고
// 빈 답을 보내기도 합니다(예: finish_reason: length · content: ''). 여기서 직접 고를 수 있게 합니다.
// 원본 설정 정리 과정에서 지워지지 않도록 씬북 설정과 따로 저장합니다.
const lengthKey=()=>`${host.KEY}_analysis_length`;
export const ANALYSIS_LENGTHS=[['','자동 (답변당 장면 × 1,800 · 최대 6,000)'],['8000','8,000'],['16000','16,000'],['32000','32,000'],['64000','64,000']];
export function readAnalysisLength(){
    const value=String(SillyTavern.getContext().extensionSettings[lengthKey()]??'');
    return ANALYSIS_LENGTHS.some(([id])=>id===value)?value:'';
}
export function writeAnalysisLength(value){
    const c=SillyTavern.getContext();value=String(value??'');
    if(value)c.extensionSettings[lengthKey()]=value;else delete c.extensionSettings[lengthKey()];
    c.saveSettingsDebounced();
}
// automatic: 원본이 계산한 길이
export const analysisLength=automatic=>Number(readAnalysisLength())||automatic;
