// 씬북+ · 설정 자리 맞추기
// 씬북+는 갤러리에서 숨긴 그림과 분석 답 길이를 씬북 설정과 따로 저장합니다
// (autopic2_hidden_jobs, autopic2_analysis_length).
// 잠깐 나왔던 0.6.2-add.1은 이 값을 원본 설정 자리(galleryHidden, analysisLength)로 옮겼으므로,
// 그 버전을 썼다면 씬북+ 자리로 다시 가져옵니다.
const KEY='autopic2';
export function migrateAddonSettings(store){
    const saved=store[KEY];if(!saved||typeof saved!=='object')return false;
    let changed=false;
    if(Array.isArray(saved.galleryHidden)&&saved.galleryHidden.length){
        const mine=Array.isArray(store[`${KEY}_hidden_jobs`])?store[`${KEY}_hidden_jobs`]:[];
        store[`${KEY}_hidden_jobs`]=[...new Set([...mine,...saved.galleryHidden.filter(id=>typeof id==='string')])].slice(-2000);
        saved.galleryHidden=[];changed=true;
    }
    const length=Math.round(Number(saved.analysisLength));
    if(length){
        if(store[`${KEY}_analysis_length`]===undefined&&length>=1000&&length<=128000)store[`${KEY}_analysis_length`]=length;
        saved.analysisLength=0;changed=true;
    }
    return changed;
}
