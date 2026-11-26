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
        const error=new Error(preview?`AI 응답 앞부분: ${preview}${raw.length>160?'…':''}`:'AI 응답이 비어 있습니다. 응답 길이 제한이나 차단(필터)을 확인하세요.',{cause:original});
        throw error;
    }
}
