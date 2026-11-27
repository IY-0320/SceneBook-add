// 씬북+ · 예전 씬북+(0.5.3-add)에서 따로 저장하던 값을 원본 설정 자리로 옮깁니다.
// 원본 0.5.4부터 같은 기능이 들어와 갤러리에서 뺀 그림은 galleryHidden, 분석 답 길이는 analysisLength에 저장합니다.
const KEY='autopic2';
export function migrateAddonSettings(store){
    const saved=store[KEY];if(!saved||typeof saved!=='object')return false;
    let changed=false;
    const hidden=store[`${KEY}_hidden_jobs`];
    if(hidden!==undefined){
        if(Array.isArray(hidden)){
            const list=[...(Array.isArray(saved.galleryHidden)?saved.galleryHidden:[]),...hidden].filter(id=>typeof id==='string'&&id.length<=100);
            saved.galleryHidden=[...new Set(list)].slice(-5000);
        }
        delete store[`${KEY}_hidden_jobs`];changed=true;
    }
    const length=store[`${KEY}_analysis_length`];
    if(length!==undefined){
        const value=Math.round(Number(length));
        if(!saved.analysisLength&&Number.isFinite(value)&&value>=1000&&value<=128000)saved.analysisLength=value;
        delete store[`${KEY}_analysis_length`];changed=true;
    }
    // 예전 씬북+가 '직접 고른 프리셋'을 기억하던 자리. 원본은 설정과 같은 프리셋을 적용 중으로 봅니다.
    try{localStorage.removeItem('scenebook-active-style');}catch{}
    return changed;
}
