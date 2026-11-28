// 씬북+ · 이미지 읽기 창의 '프리셋 빠른 저장'
// PNG를 불러오면 'PNG 선택' 옆에 버튼이 나타납니다. 누르면 확인 창(예/아니오)이 뜨고,
// 'PNG 파일 이름 그대로 사용'을 체크하면 파일 이름(확장자 .png 제외)으로, 아니면 직접 적은 이름으로
// 불러온 그림의 설정을 '프리셋 · 백업'에 저장합니다.
import { el, button, field, modal, notice } from '../ui.mjs';

const MAX_PRESETS=30;
const CSS='.ap2-plus-import-row{justify-content:center;flex-wrap:wrap;gap:8px}';
function addStyle(){if(document.getElementById('ap2-plus-import-preset-css'))return;const style=document.createElement('style');style.id='ap2-plus-import-preset-css';style.textContent=CSS;document.head.append(style);}
const fileTitle=name=>String(name??'').replace(/\.png$/i,'').trim().slice(0,100);

// api: 씬북 api, config(): 불러온 그림을 적용한 설정 (원본 '설정에 적용'과 같은 값)
export function importPresetButton(api){
    addStyle();let source=null;
    const save=button('프리셋 빠른 저장',()=>{if(source)return askAndSave(api,source);},false,'fa-floppy-disk');
    save.classList.add('ap2-plus-import-preset');save.hidden=true;
    return{
        button:save,
        // 그림을 다 읽었을 때 {fileName, config}, 읽기 시작·실패 때 null
        ready(value){source=value;save.hidden=!value;},
    };
}

function askAndSave(api,{fileName,config}){
    const {dialog,body}=modal('프리셋 빠른 저장');dialog.classList.add('ap2-compact');
    const title=fileTitle(fileName);
    body.append(el('p','','불러온 그림의 메인·UC 프롬프트와 생성 설정을 프리셋으로 저장할까요?'));
    const useFile=field('PNG 파일 이름 그대로 사용',!!title,{type:'checkbox',help:title?`프리셋 이름: ${title}`:'파일 이름이 없는 그림입니다.'});
    const name=field('프리셋 이름',title);name.input.maxLength=100;
    const warn=el('p','ap2-muted');warn.setAttribute('role','status');
    const chosen=()=>useFile.read()?title:name.read().trim();
    const sync=()=>{name.wrap.hidden=useFile.read();const exists=(api.settings().presets??[]).some(p=>p.name===chosen());warn.textContent=exists?'같은 이름의 프리셋이 있어 덮어씁니다.':'';};
    useFile.input.disabled=!title;
    for(const f of [useFile,name])f.input.addEventListener('input',sync),f.input.addEventListener('change',sync);
    body.append(useFile.wrap,name.wrap,warn);sync();
    const footer=el('footer','ap2-footer');
    footer.append(button('아니오',()=>dialog.close()),button('예',()=>{
        const presetName=chosen();
        if(!presetName)throw new Error('프리셋 이름을 입력하세요.');
        const latest=api.settings(),list=[...(latest.presets??[])],at=list.findIndex(p=>p.name===presetName);
        if(at<0&&list.length>=MAX_PRESETS)throw new Error(`프리셋은 최대 ${MAX_PRESETS}개입니다.`);
        const preset={name:presetName,config:config()};
        if(at>=0)list[at]=preset;else list.push(preset);
        api.saveSettings({...latest,presets:list});
        dialog.close();
        notice(`프리셋 저장 · ${presetName}`);
    },true));
    dialog.append(footer);
    return dialog;
}
