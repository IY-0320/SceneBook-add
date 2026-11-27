import { MODELS } from '../plugin/core.mjs';

const TAGS='lowercase English tags separated by commas, spaces instead of underscores, one visible fact per tag';
const BANNED='names, story terms, mood words, quality, style or artist tags, and no negations: leave absent things out';
const COUNT='prompt begins with the subject count (1girl, 1boy, 2girls, no humans), then place, time, weather, light and key props';
// How the chat model should word image prompts for each NovelAI model. V4.5
// follows Danbooru tags, reads little prose and has a small token budget shared
// by every prompt; V5 also follows plain sentences. Only the active model's rule is sent.
export function writingRule(model){
    const {family,characters}=MODELS[model];
    if(family===5)return `IMAGE PROMPT STYLE (NovelAI V5): this model follows Danbooru tags and plain English. Write concrete attributes as ${TAGS} (from side, cowboy shot, sitting, blush, white shirt, indoors, night, rain, backlighting), then add one or two short plain sentences for what tags cannot say: who is where, who does what to whom, how they are arranged. In a sentence refer to a person by a visible feature (the girl with silver hair), never by name. No ${BANNED}. ${COUNT}, then one sentence for the shared action. action begins with girl, boy or other, then pose, expression, gaze and contact; for an act between characters you may tag both sides: source#hug on the doer, target#hug on the receiver, mutual#hug when both do it. At most ${characters} featured characters; pos may be any value from 0 to 1 and must agree with the sentences.`;
    return `IMAGE PROMPT STYLE (NovelAI V4.5): this model follows Danbooru tags and reads little prose. Write prompt, action, outfit and appearance as ${TAGS}, using the established tag where one exists (from side, cowboy shot, looking at another, hand on another's shoulder, holding hands, sitting, arms crossed, blush, open mouth, white shirt, pleated skirt, indoors, bedroom, night, rain, backlighting). No sentences, ${BANNED}. ${COUNT}. action begins with girl, boy or other, then pose, expression, gaze and contact. For an act between characters, tag both sides: source#hug on the doer, target#hug on the receiver, mutual#hug when both do it. All prompts together fit about 500 tokens: keep only the tags that decide the picture. At most ${characters} featured characters; pos snaps to a 5 x 5 grid.`;
}
// NovelAI's own Undesired Content presets (the same text for V5 and V4.5).
const HEAVY='lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page';
export const UC_PRESETS=[['NovelAI 기본 UC',HEAVY],['인물 중심 UC',`${HEAVY}, @_@, mismatched pupils, glowing eyes, bad anatomy`]];
// Adds a preset to what is already written, without repeating a tag.
export function mergeTags(preset,existing){
    const list=value=>String(value??'').split(',').map(tag=>tag.trim()).filter(Boolean),have=new Set(list(preset).map(tag=>tag.toLowerCase()));
    return [...list(preset),...list(existing).filter(tag=>!have.has(tag.toLowerCase()))].join(', ');
}
// Details image models drop unless told: sent with every plan, whatever the template.
export const VISIBLE_DETAIL='VISIBLE DETAIL: name clothing exactly (garment type, colour, material, legwear, accessories) and keep it identical in every picture while it is worn; show height and build differences between people when they are visible; for movement or a fight add dynamic pose, motion blur or speed lines and say which way the force goes; weather marks the people in it (rain: wet hair, wet clothes; wind: hair and clothes blowing); carry lasting changes from the story (injuries, bandages, tattoos, cut hair) into every later picture.';
