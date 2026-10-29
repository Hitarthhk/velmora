// Bake the approved views into material maps without redrawing their artwork.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const root='.source-assets/approved-bottles';
const out='public/media/textures';
await mkdir(out,{recursive:true});

if(process.argv.includes('--inspect')){
  for(const [id,height] of [['01',1050],['02',1240]]){
    let lines='';
    for(let x=0;x<=500;x+=50)lines+=`<path d="M${x} 0V${height}" stroke="cyan" stroke-opacity=".35"/><text x="${x+2}" y="12" fill="cyan" font-size="10">${x}</text>`;
    for(let y=50;y<height;y+=50)lines+=`<path d="M0 ${y}H510" stroke="cyan" stroke-opacity=".35"/><text x="2" y="${y-2}" fill="cyan" font-size="10">${y}</text>`;
    await sharp(`${root}/${id}-front-inspect.png`).composite([{input:Buffer.from(`<svg width="510" height="${height}">${lines}</svg>`)}]).png().toFile(`${root}/${id}-coordinates.png`);
  }
}

const config={
  '01':{
    label:{left:138,top:808,width:344,height:507},
    back:{left:651,top:949,width:326,height:358},
    neck:{left:236,top:595,width:148,height:85},
    cap:{left:225,top:413,width:172,height:93},
    shoulder:{left:92,top:695,width:435,height:78},
    seal:{left:1222,top:982,width:116,height:180},
  },
  '02':{
    label:{left:120,top:882,width:352,height:560},
    back:{left:647,top:892,width:350,height:548},
    neck:{left:224,top:539,width:149,height:171},
    cap:{left:192,top:338,width:216,height:128},
    shoulder:{left:116,top:755,width:335,height:70},
    seal:{left:1210,top:1050,width:90,height:120},
    relief:{left:1125,top:872,width:290,height:625},
  },
};

for(const [id,parts] of Object.entries(config)){
  for(const [part,rect] of Object.entries(parts)){
    let image=sharp(`${root}/${id}.png`).extract(rect).resize({width:part==='label'||part==='back'?768:512});
    if(part==='label'||part==='back'){
      const shape=id==='01'
        ? 'M.012 .09H.26Q.5 -.09 .74 .09H.988V.9H.79Q.5 1.1 .21 .9H.012Z'
        : 'M.035 .24C.012 .16 .12 .12 .28 .09Q.5 -.09 .72 .09C.88 .12 .988 .16 .965 .24L.875 .87Q.86 .92 .73 .95Q.5 1.05 .27 .95Q.14 .92 .125 .87Z';
      const h=Math.round(rect.height*768/rect.width);
      image=image.ensureAlpha().composite([{input:Buffer.from(`<svg width="768" height="${h}" viewBox="0 0 1 1" preserveAspectRatio="none"><path d="${shape}" fill="white"/></svg>`),blend:'dest-in'}]);
    }
    if(part==='relief'){
      const h=Math.round(rect.height*512/rect.width);
      const outline='M.38 .018C.18 .06 .17 .12 .19 .16C.07 .18 .03 .21 .04 .26L.12 .26C0 .34 -.02 .39 .08 .44C.17 .49 .18 .54 .13 .58C.01 .63 .015 .69 .15 .73C.04 .76 .06 .83 .21 .87L.31 .91Q.38 .96 .49 .96Q.62 .96 .69 .91L.79 .87C.92 .83 .96 .77 .85 .73C.985 .69 .985 .63 .87 .58C.82 .54 .83 .49 .92 .44C1.02 .39 1 .34 .88 .26L.96 .26C.97 .21 .93 .18 .81 .16C.83 .12 .82 .06 .62 .018C.60 .07 .53 .11 .51 .18C.49 .11 .42 .07 .38 .018Z';
      image=image.ensureAlpha().composite([{input:Buffer.from(`<svg width="512" height="${h}" viewBox="0 0 1 1" preserveAspectRatio="none"><path d="${outline}" fill="white"/></svg>`),blend:'dest-in'}]);
    }
    let png=await image.png().toBuffer();
    if(part==='relief'){
      const raw=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      for(let y=0;y<raw.info.height;y++)for(let x=0;x<raw.info.width;x++){
        const edge=Math.max(0,Math.min(1,x/35,(raw.info.width-1-x)/35,y/45,(raw.info.height-1-y)/45));
        const a=(y*raw.info.width+x)*4+3;
        raw.data[a]=Math.round(raw.data[a]*edge*edge*(3-2*edge));
      }
      png=await sharp(raw.data,{raw:raw.info}).png().toBuffer();
    }
    await writeFile(`${out}/approved-${id}-${part}.png`,png);
    await sharp(png).webp({quality:97,alphaQuality:100}).toFile(`${out}/approved-${id}-${part}.webp`);
    if(part!=='label'&&part!=='back')await sharp(png).grayscale().normalise().webp({quality:92}).toFile(`${out}/approved-${id}-${part}-bump.webp`);
  }
}
// Recover the approved acanthus contour as a real shallow relief field. Local
// luminance contrast suppresses the broad photographic lighting/background.
const fieldRect={left:1125,top:872,width:290,height:625};
const field=await sharp(`${root}/02.png`).extract(fieldRect).resize(96,192).grayscale().blur(1.8).raw().toBuffer();
const background=await sharp(field,{raw:{width:96,height:192,channels:1}}).blur(7).raw().toBuffer();
const heights=Array.from(field,(value,i)=>Math.max(0,Math.min(255,Math.round((value-background[i])*3.2))));
await writeFile('src/three/bottles/approved-relief-02.json',JSON.stringify({width:96,height:192,heights}));
console.log('Approved reference label and ornament material maps baked.');
