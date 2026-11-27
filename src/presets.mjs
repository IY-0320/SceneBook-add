// A preset's art style: everything that decides how a picture looks, apart from
// its size and seed. Switching style keeps the canvas and the composition settings.
export const STYLE_KEYS=['model','style','negative','look','quality','steps','scale','sampler','scheduler','cfgRescale','references','transparent'];
const pick=config=>Object.fromEntries(STYLE_KEYS.filter(key=>config?.[key]!==undefined).map(key=>[key,config[key]]));
const same=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
const plain=value=>typeof value==='string'?value.trim():value;
// The preset whose style matches these settings, if any. Empty look and
// missing look count as the same, so do surrounding spaces in prompts.
export function activePreset(config){
    for(const preset of config?.presets??[]){
        const wanted=pick(preset.config);
        // A preset that holds no art settings matches nothing.
        if(!wanted.model&&wanted.style===undefined)continue;
        if(STYLE_KEYS.every(key=>key==='look'?(wanted.look??'')===(config.look??''):wanted[key]===undefined||same(plain(wanted[key]),plain(config[key]))))return preset;
    }
    return null;
}
// A config drawn in a preset's style: its art settings, with this picture's size and seed.
export function inPresetStyle(config,preset){
    if(!preset)return config;
    return{...config,...pick(preset.config),look:preset.config.look??'',presetName:preset.name};
}
export const presetStyle=preset=>preset?{...pick(preset.config),look:preset.config.look??''}:{};
