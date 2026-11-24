import { mkdir,readFile,writeFile,readdir,unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID,createHash } from 'node:crypto';
import { MODELS,REFERENCE_BUCKETS,referenceCaption } from './core.mjs';
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validatePng(data,{bucket=false}={}) {
    if(typeof data!=='string'||data.length>9000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw new Error('PNG 이미지 형식을 확인하세요.');
    const buffer=Buffer.from(data,'base64');
    if(buffer.length<24||buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('PNG 파일이 아닙니다.');
    const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20);
    if(width<1||height<1||width*height>2200000)throw new Error('레퍼런스 이미지는 220만 픽셀 이하여야 합니다.');
    // The V5 copy is prepared by the browser at one of NovelAI's reference sizes.
    if(bucket&&!REFERENCE_BUCKETS.some(([w,h])=>w===width&&h===height))throw new Error('V5용 참조 이미지 크기가 올바르지 않습니다. 확장을 새로고침한 뒤 다시 등록하세요.');
    return {buffer,width,height};
}
async function locations(dirs){const meta=path.join(dirs.root,'autopic2-references'),images=path.join(dirs.userImages,'autopic2');await Promise.all([mkdir(meta,{recursive:true}),mkdir(images,{recursive:true})]);return{meta,images};}
const v5File=(loc,id)=>path.join(loc.meta,id+'.v5.png');
export async function saveReference(dirs,input){
    const {buffer,width,height}=validatePng(input?.image),v5=input?.bucket===undefined?null:validatePng(input.bucket,{bucket:true});
    const label=String(input?.label??'레퍼런스').slice(0,100),id=randomUUID();
    const loc=await locations(dirs);const record={id,label,width,height,url:`/user/images/autopic2/${id}.png`,...(v5?{v5:{width:v5.width,height:v5.height}}:{})};
    await writeFile(path.join(loc.images,id+'.png'),buffer);if(v5)await writeFile(v5File(loc,id),v5.buffer,{mode:0o600});
    await writeFile(path.join(loc.meta,id+'.json'),JSON.stringify(record));return record;
}
// Adds the V5 copy to a reference registered before V5 references existed.
export async function saveReferenceVariant(dirs,input){
    const id=input?.id;if(typeof id!=='string'||!idPattern.test(id))throw new Error('잘못된 참조 이미지 ID입니다.');
    const v5=validatePng(input?.bucket,{bucket:true}),loc=await locations(dirs),file=path.join(loc.meta,id+'.json');let record;
    try{record=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')throw new Error('삭제되었거나 없는 참조 이미지입니다.');throw e;}
    if(record.id!==id)throw new Error('참조 이미지 등록 정보를 확인하세요.');
    await writeFile(v5File(loc,id),v5.buffer,{mode:0o600});record.v5={width:v5.width,height:v5.height};
    await writeFile(file,JSON.stringify(record));return record;
}
export async function listReferences(dirs){const {meta}=await locations(dirs);const files=(await readdir(meta)).filter(f=>f.endsWith('.json')&&idPattern.test(f.slice(0,-5)));const records=await Promise.all(files.map(async f=>{try{return JSON.parse(await readFile(path.join(meta,f),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}}));return records.filter(Boolean);}
export async function deleteReference(dirs,id){
    if(typeof id!=='string'||!idPattern.test(id))throw new Error('잘못된 참조 이미지 ID입니다.');
    const loc=await locations(dirs),file=path.join(loc.meta,id+'.json');let record;
    try{record=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return{id,deleted:false};throw e;}
    // Only an uploaded reference record authorizes deleting a PNG. Generated
    // images share the directory and must never be deleted by a guessed job ID.
    if(record.id!==id||record.url!==`/user/images/autopic2/${id}.png`)throw new Error('참조 이미지 등록 정보를 확인하세요.');
    for(const target of [path.join(loc.images,id+'.png'),v5File(loc,id),file]){
        try{await unlink(target);}catch(e){if(e.code!=='ENOENT')throw e;}
    }
    return{id,deleted:true};
}
const refuse=(message,code)=>Object.assign(new Error(message),{code});
export async function applyReferences(payload,config,dirs,key,fetchImpl,signal){
    const loc=await locations(dirs),support=MODELS[config.model].references;
    // Resolve every input before any paid encoding request. Missing references
    // must not consume credits for the other inputs or silently change the image.
    const inputs=await Promise.all((config.references??[]).map(async ref=>{
        if(!idPattern.test(ref.id))throw new Error('잘못된 레퍼런스 ID입니다.');
        try{
            const metadata=JSON.parse(await readFile(path.join(loc.meta,ref.id+'.json'),'utf8')),v5=ref.kind==='precise'&&support.bucket;
            if(v5&&!metadata.v5)throw refuse('V5용으로 준비되지 않은 참조 이미지입니다. 씬북의 참조 탭을 한 번 열면 자동으로 준비합니다.','REFERENCE_NOT_READY');
            if(ref.kind==='precise'&&!v5&&![[1024,1536],[1536,1024],[1472,1472]].some(([w,h])=>w===metadata.width&&h===metadata.height))throw refuse('Precise Reference를 허용된 캔버스 크기로 다시 등록하세요.','REFERENCE_INVALID');
            const image=(await readFile(v5?v5File(loc,ref.id):path.join(loc.images,ref.id+'.png'))).toString('base64');
            return{ref,image};
        }catch(e){if(e.code==='ENOENT')throw refuse('삭제되었거나 없는 참조 이미지입니다. 참조 설정을 확인하세요.','REFERENCE_NOT_FOUND');throw e;}
    }));
    const p=payload.parameters;
    for(const {ref,image}of inputs){
        if(ref.kind==='precise'){
            // Several Precise pictures travel as parallel lists, one entry each.
            const caption={base_caption:referenceCaption(ref,config.model),char_captions:[]};
            (p.director_reference_images??=[]).push(image);
            (p.director_reference_descriptions??=[]).push(support.bucket?{caption,legacy_uc:false}:{caption,use_coords:false,use_order:false,legacy_uc:false});
            (p.director_reference_strength_values??=[]).push(ref.strength);
            // V5 has no fidelity control; NovelAI sends it as full fidelity.
            (p.director_reference_secondary_strength_values??=[]).push(support.fidelity?1-ref.fidelity:0);
            (p.director_reference_information_extracted??=[]).push(1);
        }else{
            const digest=createHash('sha256').update(`${config.model}:${ref.id}:${ref.information}`).digest('hex');const cache=path.join(loc.meta,digest+'.vibe');let encoded;
            try{encoded=await readFile(cache,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
            if(!encoded){
                const result=await fetchImpl('https://image.novelai.net/ai/encode-vibe',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({image,model:config.model,informationExtracted:ref.information}),signal});
                if(!result.ok)throw new Error(`Vibe 인코딩 실패 (${result.status}). 레퍼런스를 누락한 채 생성하지 않았습니다.`);
                const data=await result.arrayBuffer();if(data.byteLength>16000000)throw new Error('Vibe 응답이 너무 큽니다.');encoded=Buffer.from(data).toString('base64');await writeFile(cache,encoded,{mode:0o600});
            }
            (p.reference_image_multiple??=[]).push(encoded);
            (p.reference_information_extracted_multiple??=[]).push(ref.information);
            (p.reference_strength_multiple??=[]).push(ref.strength);
        }
    }
}
