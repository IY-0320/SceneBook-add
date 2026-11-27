import { ORIENTATIONS } from './framing.mjs';
import { PAGE_FORMATS } from './comic.mjs';
import { el, button, field, modal, segmented } from './ui.mjs';

const MODES={
    plan:['저장된 장면','이 답변에 저장된 삽화 지시(초안)로 바로 그립니다. AI 요청은 없습니다.'],
    ai:['AI가 장면 쓰기','AI가 이 답변을 읽고 장면·인물 프롬프트를 쓴 뒤 바로 그립니다. AI 요청이 한 번 발생합니다.'],
    direct:['직접 쓰기','적은 내용을 장면 프롬프트로 그대로 씁니다. 메인 프롬프트·그림체·품질 태그는 자동으로 붙습니다.'],
};
// A picture for one reply, on demand: from its saved plan, from a scene the
// AI writes now, or from a prompt typed here. No scene editor in between.
export function manualDialog({excerpt,hasPlan,onGenerate,onEdit,pages=null}){
    const {dialog,body}=modal('수동 생성','이 답변의 그림을 지금 만들어 답변 아래에 넣습니다.');dialog.classList.add('ap2-manual');
    if(excerpt)body.append(el('blockquote','ap2-excerpt',excerpt));
    let mode=hasPlan?'plan':'ai',size='',format=pages?.value??'single';
    const help=el('p','ap2-muted'),text=field('','',{multiline:true,rows:3}),label=text.wrap.querySelector('.ap2-field-label');text.wrap.classList.add('ap2-field-bare');
    const choice=segmented('만드는 방법',Object.entries(MODES).filter(([id])=>id!=='plan'||hasPlan).map(([id,[name]])=>[id,name]),mode,value=>{mode=value;sync();if(mode!=='plan')text.input.focus();});
    choice.wrap.classList.add('ap2-manual-modes');
    const shape=segmented('화면 비율',ORIENTATIONS,size,value=>{size=value;}),shapeRow=el('div','ap2-quick-shape');shapeRow.append(el('span','','화면 비율'),shape.wrap);
    // When the AI writes the scene, this reply may become a page of panels. V5 only.
    const formatChoice=segmented('그림 형식',PAGE_FORMATS.map(([id,label])=>[id,label]),format,value=>{format=value;}),formatRow=el('div','ap2-quick-shape');formatRow.append(el('span','','그림 형식'),formatChoice.wrap);
    function sync(){
        help.textContent=MODES[mode][1];text.wrap.hidden=mode==='plan';formatRow.hidden=!pages||mode!=='ai';
        label.textContent=mode==='ai'?'AI에게 전할 요청 사항 (선택)':'장면 프롬프트';
        text.input.placeholder=mode==='ai'?'비워 두면 AI가 알아서 고릅니다 · 예: 둘이 마주 보는 순간으로, 비 오는 창가가 보이게':'예: rainy street at night, two people sharing an umbrella, from side';
    }
    body.append(choice.wrap,help,text.wrap,formatRow,shapeRow);sync();
    const generate=button('생성',async()=>{await onGenerate({mode,text:text.read().trim(),size,format});dialog.close();},true,'fa-wand-magic-sparkles');
    // Ctrl+Enter (Cmd+Enter) generates without leaving the text box.
    text.input.addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();generate.click();}});
    const footer=el('footer','ap2-footer ap2-editor-footer'),left=el('div','ap2-actions'),right=el('div','ap2-actions');
    left.append(button('장면 편집',()=>{dialog.close();return onEdit();},false,'fa-sliders'));right.append(generate);
    footer.append(left,right);dialog.append(footer);
    if(mode==='plan')generate.focus();else text.input.focus();
    return dialog;
}
