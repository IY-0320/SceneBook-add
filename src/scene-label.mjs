// Scenes carry no title any more. Earlier versions stored placeholders such
// as "장면 1" with every picture; only a title someone actually wrote is shown.
const PLACEHOLDER=/^(?:장면\s*\d*|scene\s*\d*|새 장면|삽화|수동 생성|가져온 장면|NovelAI generated image)$/i;
export function sceneLabel(scene){
    const title=String(scene?.title??'').trim();
    return PLACEHOLDER.test(title)?'':title;
}
// A short line that tells one queued or listed picture from another.
export const sceneHint=scene=>sceneLabel(scene)||String(scene?.prompt??'').replace(/\s+/g,' ').trim().slice(0,48);
// What a language model needs of a scene: the title is never part of the image.
export const withoutTitle=scene=>{const {title,...rest}=scene??{};return rest;};
