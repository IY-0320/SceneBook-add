import { MODELS } from '../plugin/core.mjs';

// Multi-panel pages: one NovelAI picture laid out as a manga or comic page.
// Only V5 reads the sentences that describe a page and its panels well enough,
// so the mode is offered and applied on V5 alone.
export const PAGE_FORMATS=[
    ['single','한 장면','그림 한 장에 한 순간을 그립니다.'],
    ['manga','흑백 만화','먹선과 검은 그림자의 흑백 만화 페이지로 그립니다.'],
    ['comic','컬러 만화','칸이 나뉜 컬러 만화 페이지로 그립니다.'],
    ['webtoon','세로 웹툰','위에서 아래로 이어지는 세로 웹툰 칸으로 그립니다.'],
];
export const PANEL_COUNTS=[[0,'자동'],[2,'2칸'],[3,'3칸'],[4,'4칸']];
const WORDS=['','one','two','three','four','five','six'],ORDER=['First','Second','Third','Fourth','Fifth','Sixth'];
export const pagesAllowed=config=>MODELS[config.model]?.family===5;
export const pageFormat=config=>pagesAllowed(config)&&PAGE_FORMATS.some(([id])=>id===config.pageFormat)?config.pageFormat:'single';

// How each format opens the prompt. The page format comes first: NovelAI
// weighs the opening of a prompt most.
function header(format,count){
    const n=WORDS[count]??'several';
    if(format==='manga')return `a ${n}-panel black and white manga page, monochrome, greyscale, inked linework, high contrast, solid black shadows, clean panel borders with thin white gutters`;
    if(format==='webtoon')return `a vertical webtoon strip of ${n} panels stacked from top to bottom, full color, clean digital coloring, soft shading, wide white gutters between panels`;
    return `a ${n}-panel full color comic page, clean lineart, cel shading, clean panel borders with thin white gutters`;
}
// Tags that fight a page: a heavy UC removes multiple views, screentone and halftone.
const CONFLICTS={all:['multiple views','split screen','comic','4koma','panel','panels','manga'],manga:['monochrome','greyscale','grayscale','screentone','halftone','limited palette']};
function pageNegative(format,negative,bubbles){
    const drop=new Set([...CONFLICTS.all,...(format==='manga'?CONFLICTS.manga:[])]);
    const kept=String(negative??'').split(',').map(t=>t.trim()).filter(t=>t&&!drop.has(t.toLowerCase()));
    const extra=['panel numbers','page number','watermark',...(bubbles?[]:['speech bubble','text','sound effects']),...(format==='manga'?[]:['monochrome','greyscale'])];
    return [...new Set([...kept,...extra])].join(', ');
}

// Rules for the model that writes the plan. `format` is the plan format: text, json or analysis.
export function pageRules(config,format='text'){
    const kind=pageFormat(config);if(kind==='single')return'';
    const label={manga:'black and white manga',comic:'full color comic',webtoon:'vertical webtoon'}[kind];
    const count=config.panelCount>=2?`exactly ${config.panelCount}`:'2 to 4';
    const bubbles=config.speechBubbles?'A speaker\'s bubble may carry one short line from the reply in its original language: put "speech bubble, text: <line>" in that character\'s action for that panel. Never add other text.':'No speech bubbles, captions, sound effects, numbers or other text anywhere.';
    const shape=kind==='webtoon'?'The canvas is a tall strip; panels stack from top to bottom.':'Choose the page shape first: portrait for most pages, landscape only for a two-panel spread read left to right; never square.';
    const common=`PAGE MODE (${label}): every scene is one ${label} page of ${count} panels telling this moment as a short sequence, such as approach, contact, reaction, or cause, action, result. ${shape} Give the decisive beat the largest panel. Change the shot size between panels (wide, medium, close-up, extreme close-up); when two panels show successive instants of one action, keep the same camera angle so the change reads. Keep outfit, light and place continuous from panel to panel. Refer to people by a visible feature (the man with black hair), never by name, and say which hand touches what. Wrap the one detail that makes each panel in {{ }}. ${bubbles}`;
    if(format==='text')return `${common}\nPage layout lines, in this order: "prompt:" what every panel shares (place, time, light, weather); "layout:" one sentence on the arrangement and relative panel sizes in reading order (e.g. top panel largest spanning the full width, two equal panels side by side below); then for each panel in reading order a "panel:" line (shot size and angle, the exact action and expression, the key detail), followed by char, action and pos lines for each character visible in that panel. pos is the character's place on the whole page, inside that panel's area. Do not write camera lines in page mode.`;
    return `${common}\nFor every scene add "layout" (one sentence on the arrangement and relative sizes in reading order) and "panels": an array in reading order of {"text":"shot size and angle, exact action and expression, key detail","characters":[{"name":"exact library name","action":"girl, boy or other, then that panel's pose, expression, gaze and contact","x":0.5,"y":0.2}]}, where x and y place the character on the whole page inside that panel's area. "prompt" holds what every panel shares (place, time, light, weather); leave "camera" empty and the scene-level "characters" empty.`;
}

// A page as the plan wrote it, in one shape: {layout, panels:[{text, characters}]}.
export function readPage(raw,compile=character=>character){
    const panels=(Array.isArray(raw?.panels)?raw.panels:[]).map(panel=>typeof panel==='string'?{text:panel,characters:[]}:panel)
        .filter(panel=>panel&&typeof panel.text==='string'&&panel.text.trim())
        .slice(0,6).map(panel=>({text:panel.text.trim().slice(0,1500),characters:(Array.isArray(panel.characters)?panel.characters:[]).map(compile).filter(Boolean)}));
    if(!panels.length)return null;
    return{layout:typeof raw.layout==='string'?raw.layout.trim().slice(0,600):'',panels};
}

// The scene and settings NovelAI receives for a page. The whole prompt is built
// here and sent as written; each character is drawn once per panel it is in.
export function compilePage(scene,config,{look=''}={}){
    const page=scene.page,format=pageFormat({...config,pageFormat:scene.pageFormat??config.pageFormat});
    if(!page?.panels?.length||format==='single')return{scene,config};
    const count=page.panels.length,limit=MODELS[config.model].characters;
    const occurrences=page.panels.flatMap(panel=>panel.characters.map(c=>({...c})));
    // Too many appearances for the model: one description per person, placed by the sentences.
    const perPanel=occurrences.length&&occurrences.length<=limit;
    const characters=perPanel?occurrences:[...new Map([...scene.characters??[],...occurrences].map(c=>[c.name||c.prompt,c])).values()].slice(0,limit);
    const panels=page.panels.map((panel,i)=>`${ORDER[i]} panel: ${panel.text.replace(/[.,\s]+$/,'')}`).join('. ');
    const quality=config.quality?MODELS[config.model].quality.replace(/,?\s*no text/,config.speechBubbles?'':', no text').replace(/^,\s*/,''):'';
    const prompt=[header(format,count),config.style,scene.prompt,page.layout,panels,quality].map(part=>String(part??'').trim()).filter(Boolean).join(', ');
    return{
        scene:{...scene,camera:'',prompt,negative:pageNegative(format,[config.negative,scene.negative].filter(Boolean).join(', '),config.speechBubbles),finalPrompt:true,characters},
        config:{...config,useCoords:perPanel,...(format==='webtoon'?{width:768,height:1344}:{})},
    };
}
