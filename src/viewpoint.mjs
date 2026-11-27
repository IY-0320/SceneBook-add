// Viewpoints a camera cannot take. Someone lying down cannot be seen from below,
// and of two people lying side by side the near one hides the far one from the
// side; both read from above. Plans that ask for these are turned to from above,
// and the editors warn when one is typed by hand.
const LYING=/\blying\b|\bon (?:back|stomach)\b/i,TOGETHER=/\b(?:side by side|lying together|next to each other|cuddling|spooning)\b/i;
const text=c=>`${c?.prompt??''} ${c?.action??''}`;
export function viewpointIssue(scene){
    if(!scene||scene.finalPrompt||scene.page)return null;
    const camera=String(scene.camera??''),shared=String(scene.prompt??'');
    const lyingPeople=(scene.characters??[]).filter(c=>LYING.test(text(c))).length;
    const lying=Math.max(lyingPeople,LYING.test(shared)?(TOGETHER.test(shared)?2:1):0);
    if(!lying)return null;
    if(/\bfrom below\b/i.test(camera))return{kind:'below',message:'누워 있는 사람은 아래에서 볼 수 없어요. 카메라가 바닥이나 침대 밑에 들어가야 해요.'};
    if(lying>=2&&/\bfrom side\b/i.test(camera))return{kind:'side',message:'나란히 누운 둘을 옆에서 보면 앞사람에 뒷사람이 가려져요.'};
    return null;
}
export const fromAbove=camera=>String(camera??'').replace(/\bfrom (?:below|side)\b/i,'from above');
// A scene with an impossible viewpoint, turned to from above.
export function fixViewpoint(scene){return viewpointIssue(scene)?{...scene,camera:fromAbove(scene.camera)}:scene;}
