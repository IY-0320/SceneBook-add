// Pictures have no titles. Titles stored by earlier versions are never shown.
export function sceneLabel(){
    return '';
}
// A short line that tells one queued or listed picture from another.
export const sceneHint=scene=>sceneLabel(scene)||String(scene?.prompt??'').replace(/\s+/g,' ').trim().slice(0,48);
// What a language model needs of a scene: the title is never part of the image.
export const withoutTitle=scene=>{const {title,...rest}=scene??{};return rest;};
