import { MODELS } from '../plugin/core.mjs';

// The prompt NovelAI receives for an ordinary scene, put together here rather than
// on the server so its order can be chosen: the subject count first (NovelAI reads
// the opening of a prompt most closely), then the art style, the camera, the scene
// and the quality tags. Tags already given by the style or the camera are not
// repeated, and a viewpoint tag in the scene that contradicts the camera is dropped.
const COUNT=/^(?:\d+\s*(?:girls?|boys?|others?)|no humans|multiple (?:girls|boys|others))$/i;
const VIEWS=['from side','three-quarter view','from above','from below','from behind','straight-on','pov'];
// Commas inside braces, brackets, parentheses or a weight span (1.2::a, b::) do not split.
export function splitTags(value){
    const text=String(value??''),parts=[];let depth=0,weight=false,start=0;
    for(let i=0;i<text.length;i++){
        if(text.startsWith('::',i)){weight=!weight;i++;continue;}
        const ch=text[i];
        if('{[('.includes(ch))depth++;else if('}])'.includes(ch))depth=Math.max(0,depth-1);
        else if(ch===','&&!depth&&!weight){parts.push(text.slice(start,i));start=i+1;}
    }
    parts.push(text.slice(start));
    return parts.map(part=>part.trim()).filter(Boolean);
}
export function compileScene(scene,config){
    if(!scene||scene.finalPrompt||scene.page)return scene;
    const camera=String(scene.camera??'').trim(),style=String(config.style??'').trim();
    const given=new Set([...splitTags(style),...splitTags(camera)].map(tag=>tag.toLowerCase()));
    const view=VIEWS.find(name=>splitTags(camera).some(tag=>tag.toLowerCase()===name));
    const counts=[],rest=[],seen=new Set();
    for(const tag of splitTags(scene.prompt)){
        const key=tag.toLowerCase();
        if(seen.has(key))continue;seen.add(key);
        if(COUNT.test(key)){counts.push(tag);continue;}
        if(given.has(key))continue;
        if(view&&VIEWS.includes(key)&&key!==view)continue;
        rest.push(tag);
    }
    const quality=config.quality?MODELS[config.model]?.quality??'':'';
    const prompt=[counts.join(', '),style,camera,rest.join(', '),quality,config.transparent?'transparent background, has alpha':''].filter(Boolean).join(', ');
    return{...scene,prompt,negative:[config.negative,scene.negative].filter(Boolean).join(', '),camera:'',finalPrompt:true};
}
