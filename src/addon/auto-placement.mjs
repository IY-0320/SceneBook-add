// 씬북+ · 문단 뒤(자동)
// AI가 장면마다 어느 문단 뒤에 그림을 둘지 정하게 하고, 인용문이 조금 달라도 가장 비슷한 문단을 찾아 붙입니다.
// 화면에 실제로 쓰는 배치 값은 'auto'이고, 원본 코드 중 'inline'만 아는 곳에는 placementKey()로 'inline'을 넘깁니다.
const normalized=value=>String(value??'').normalize('NFC').replace(/\s+/g,' ').trim();

// 'auto'와 'inline' 둘 다 문단 사이에 그림을 둡니다.
export const isParagraphPlacement=placement=>placement==='inline'||placement==='auto';
// 'auto'를 모르는 원본 함수에 넘길 값.
export const placementKey=placement=>placement==='auto'?'inline':placement;

// 인용문이 한 문단에만 있으면 그 문단, 아니면 AI가 준 문단 번호, 그래도 없으면 가장 비슷한 문단 뒤에 놓습니다.
export function autoPosition(scene,blocks,tail){
    const key=value=>normalized(value).replace(/[*_~`"“”‘’'「」『』]/g,'').toLowerCase();
    const raw=typeof scene.evidence==='string'&&scene.evidence.length<=2000?scene.evidence:'';
    const quote=key(raw);
    let block=null;
    if(quote){const hits=blocks.filter(b=>key(b.content).includes(quote));if(hits.length===1)block=hits[0];}
    if(!block){const wanted=Number(scene.after);if(Number.isInteger(wanted))block=blocks.find(b=>b.index===wanted)??null;}
    if(!block&&quote.length>=4){
        const grams=value=>{const text=key(value).replace(/\s/g,''),set=new Set();for(let i=0;i<text.length-1;i++)set.add(text.slice(i,i+2));return set;};
        const wantedGrams=grams(raw);let best=null,score=0;
        for(const b of blocks){const have=grams(b.content);let hit=0;for(const g of wantedGrams)if(have.has(g))hit++;const ratio=wantedGrams.size?hit/wantedGrams.size:0;if(ratio>score){score=ratio;best=b;}}
        if(best&&score>=0.6)block=best;
    }
    return{...scene,after:block?.index??tail,evidence:block?block.content.slice(0,2000):''};
}

// 수동 분석(장면 분석 프롬프트)에 덧붙이는 규칙.
export const AUTO_ANALYSIS_RULE='Images are placed between paragraphs. For EVERY scene include "after" (the index of the TARGET block that the scene illustrates; the image is shown right after that block) and "evidence" (a short exact phrase of 5 to 40 characters copied verbatim from that block). These two fields are required for this reply, regardless of earlier statements that call them unnecessary. Choose a different block for each scene, in reading order, and place a scene after the block where its moment happens rather than after the last block by default. When TARGET has a single block, use its index.';

// 채팅 답변에 넣는 삽화 지시(주입 프롬프트)에 덧붙이는 규칙.
const AUTO_PLACEMENT_RULE='PARAGRAPH PLACEMENT (required for this reply): every scene must carry its placement field, a "quote:" line (or "evidence" in a JSON plan) holding a short exact phrase of 5 to 40 characters copied verbatim from the ONE paragraph of this reply that the scene illustrates, so the image appears right after that paragraph. Use different paragraphs for different scenes, in reading order. Copy the phrase character for character from your own reply, never paraphrase it, and choose a phrase that occurs only once in the reply. Do not default to the final paragraph.';
const autoSceneCountRule=max=>`SCENE COUNT (replaces any earlier "normally 1" or "one image is the default" wording for this reply): write up to ${max} scenes. When the reply contains ${max} clearly different moments, write all ${max}; write fewer only when it truly has fewer distinct moments, and never more than ${max}. Put each scene after a different paragraph, in reading order.`;

// 원본 0.5.4부터 원본에도 'AI가 고른 문단 뒤'(auto)가 생겼지만, 씬북+는 자기 지시와 자리 찾기를 씁니다.
// (웹툰 컷처럼 원본의 새 기능이 'auto'를 쓰는 경우에는 원본 지시를 그대로 둡니다.)
// placementRule: 원본 src/placement-rules.mjs에서 부릅니다. inlineRule은 같은 형식의 '문단 뒤' 지시입니다.
export function autoPlacementRule(format,inlineRule){
    if(format==='analysis')return AUTO_ANALYSIS_RULE;
    return [inlineRule,AUTO_PLACEMENT_RULE].filter(Boolean).join(' ');
}
export const autoSceneCount=max=>autoSceneCountRule(max);
// 화면에서 그림을 붙일 문단: 인용한 문단과 글이 같으면 그 문단, 아니면 문단 순서로 같은 자리.
export function plusDisplayParagraph(nodes,anchor,sourceCount){
    if(!anchor?.quote||!nodes.length)return null;
    const wanted=normalized(String(anchor.quote).replace(/[*_]/g,''));
    return nodes.find(n=>normalized(n.textContent)===wanted)??anchorByOrder(nodes,anchor.index,sourceCount);
}

// (예전 씬북+) renderInjection은 원본 함수입니다. 'auto'일 때만 'inline' 지시에 자동 배치 규칙을 더합니다.
export function injectionPrompt(c,renderInjection){
    if(c.placement!=='auto')return renderInjection(c);
    const prompt=renderInjection({...c,placement:'inline'}),rule=`${AUTO_PLACEMENT_RULE}\n\n${autoSceneCountRule(c.maxScenes)}`;
    return /<\/image_generation>\s*$/.test(prompt)?prompt.replace(/<\/image_generation>\s*$/,`${rule}\n</image_generation>`):`${prompt}\n${rule}`;
}

// 번역 등으로 화면의 글이 원문과 달라져 인용문으로 문단을 못 찾을 때, 문단 순서로 같은 자리를 찾습니다.
// candidates: 화면의 문단들, index: 원문에서 몇 번째 문단인지(1부터), total: 원문 문단 수.
// 화면 문단 수가 원문과 다르면 자리를 짐작하지 않고 null(원본처럼 답변 아래)을 돌려줍니다.
export function anchorByOrder(candidates,index,total){
    if(!(index>0)||!total||candidates.length!==total)return null;
    return candidates[index-1]??null;
}
