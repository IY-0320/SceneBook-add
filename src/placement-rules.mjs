// What the chat model is told about where each picture goes. One place for the
// wording, by placement mode and by the plan format the model writes.
import { cutMode, cutLimit } from './comic.mjs';
const AUTO_COUNT=max=>`When the reply has several clearly different visual moments, write one scene for each, up to ${max}, in reading order; when it has one, write one.`;
const CUT_ORDER='Write the cuts in story order, each after the paragraph it depicts; paragraphs with nothing new to see get no cut.';
export function sceneCount(config){
    if(cutMode(config))return`Scene count: 1 to ${cutLimit(config)} cuts, only as many as the reply needs.`;
    return config.placement==='auto'?`Scene count: 1 to ${config.maxScenes}, one per clearly different moment.`:`Scene count: normally 1, at most ${config.maxScenes}.`;
}
// format: text (key: value lines), json, analysis (the separate scene-writing request), lean.
export function placementRule(config,format){
    const max=config.maxScenes,cuts=cutMode(config);
    if(config.placement==='auto'){
        if(format==='analysis')return `Each picture is shown right after the TARGET paragraph it depicts. For every scene set after to that TARGET block index and evidence to an exact phrase of 4 to 12 words copied from that block. ${cuts?CUT_ORDER:AUTO_COUNT(max)}`;
        const where='counting the blank-line-separated paragraphs of your reply from 1';
        if(format==='json')return `Each picture is shown right after the paragraph it depicts. For every scene set after to that paragraph's number (${where}) and evidence to an exact phrase of 4 to 12 words copied from it. ${cuts?CUT_ORDER:AUTO_COUNT(max)}`;
        return `Each picture is shown right after the paragraph it depicts. Under every scene add "after: <paragraph number, ${where}>" and "quote: <exact phrase of 4 to 12 words copied from that paragraph>". ${cuts?CUT_ORDER:AUTO_COUNT(max)}`;
    }
    if(config.placement==='inline'){
        if(format==='analysis')return 'An evidence quote is an optional placement hint; a scene can be displayed below the reply when placement is unavailable.';
        if(format==='json')return 'An optional short evidence quote may guide inline placement. Missing or ambiguous placement never prevents illustration; the image can go below the reply.';
        if(format==='lean')return 'An optional "quote: exact short phrase from the reply" line under a scene places its image after that paragraph.';
        return 'An optional "quote: exact short phrase from the reply" line under a scene may guide inline placement. Missing or ambiguous placement never prevents illustration; the image can go below the reply.';
    }
    if(format==='analysis')return 'Images are displayed below the completed reply in scenes-array order. Paragraph indices and exact evidence quotes are not required; omit after and evidence for new scenes, regardless of earlier template examples. Focus on complete, visually coherent prompts.';
    if(format==='json')return 'Images appear below the reply in scenes-array order. Omit after and evidence: paragraph numbers and exact quotes are unnecessary, even if an earlier template requested them.';
    if(format==='lean')return '';
    return 'Images appear below the reply in scene order. Paragraph numbers and quotes are unnecessary.';
}
