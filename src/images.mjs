import { referenceBucket } from '../plugin/core.mjs';
const encode=canvas=>canvas.toDataURL('image/png').split(',')[1];
function blank(width,height){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
// The V5 copy of a reference: scaled to cover the closest reference size and
// cropped evenly, the way NovelAI's own page prepares it. Transparency is kept.
function bucketImage(source,x,y,width,height){
    const b=referenceBucket(width,height),canvas=blank(b.width,b.height),ctx=canvas.getContext('2d');
    ctx.imageSmoothingQuality='high';ctx.drawImage(source,x,y,width,height,-b.left,-b.top,b.resizeWidth,b.resizeHeight);
    return encode(canvas);
}
// `image` is the padded canvas V4.5 and Vibe use; `bucket` is the V5 copy.
export async function prepareReference(file) {
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('10MB 이하 PNG·JPEG·WebP 이미지를 선택하세요.');
    const image=await createImageBitmap(file);
    try{
        const ratio=image.width/image.height;
        const [width,height]=ratio>1.2?[1536,1024]:ratio<0.83?[1024,1536]:[1472,1472];
        const canvas=blank(width,height);
        const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
        const scale=Math.min(width/image.width,height/image.height);
        ctx.drawImage(image,(width-image.width*scale)/2,(height-image.height*scale)/2,image.width*scale,image.height*scale);
        return{image:encode(canvas),bucket:bucketImage(image,0,0,image.width,image.height)};
    }finally{image.close();}
}
// A reference registered before 0.5.0 exists only as the white-padded canvas.
// Take the padding bars off, then make the V5 copy from the picture inside.
export async function bucketFromPadded(url) {
    const response=await fetch(url);if(!response.ok)throw new Error('참조 이미지를 읽을 수 없습니다.');
    const image=await createImageBitmap(await response.blob());
    try{
        const {width,height}=image,canvas=blank(width,height),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
        const {data}=ctx.getImageData(0,0,width,height);
        const white=(x,y)=>{const i=(y*width+x)*4;return data[i]===255&&data[i+1]===255&&data[i+2]===255&&data[i+3]===255;};
        const bars=(size,across,at)=>{
            const clear=n=>{for(let m=0;m<across;m++)if(!white(...at(n,m)))return false;return true;};
            let a=0,b=0;while(a<size&&clear(a))a++;while(b<size-a&&clear(size-1-b))b++;
            // Padding is centred: real bars are equally thick on both sides.
            // One more pixel removes the edge blended into the bar.
            return a<2||Math.abs(a-b)>2||a+b>size-64?[0,0]:[a+1,b+1];
        };
        const [left,right]=bars(width,height,(x,y)=>[x,y]),[top,bottom]=bars(height,width,(y,x)=>[x,y]);
        return bucketImage(canvas,left,top,width-left-right,height-top-bottom);
    }finally{image.close();}
}
