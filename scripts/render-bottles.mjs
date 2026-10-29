// Render the actual replacement models as transparent, matching fallback art.
// Isolated asset fixture: no website routes or age-verification flow are mounted.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, mkdir } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
const require = createRequire(import.meta.url);
const { webpack } = require('next/dist/compiled/webpack/webpack');
const root = process.cwd(), work = await mkdtemp(join(tmpdir(), 'whisky-bottles-'));
const review = process.argv.includes('--review');
const views = review ? [0, Math.PI, Math.PI / 2, -Math.PI / 2, Math.PI * .2] : [0];
const tiles = [];
await writeFile(join(work,'loader.cjs'), `const ts=require(${JSON.stringify(require.resolve('typescript'))}); module.exports=function(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;};`);
await writeFile(join(work,'entry.tsx'), `
import React, {Suspense, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Canvas, useThree} from '@react-three/fiber';
import {Environment,Lightformer} from '@react-three/drei';
import {PremiumBottle} from '@/three/bottles/PremiumBottle';
import {expressions} from '@/content/site';
import {designs} from '@/three/bottles/designs';
import {TransmissionBackdrop} from '@/three/useTransmissionBackdrop';
import {StudioReflections} from '@/three/StudioReflections';
const expression=expressions[Number(new URLSearchParams(location.search).get('bottle'))||0];
const height=designs[expression.id].height;
const yaw=Number(new URLSearchParams(location.search).get('yaw'))||0;
function Ready(){const gl=useThree(s=>s.gl);useEffect(()=>{const timer=setTimeout(()=>{window.bottleReady=true;},1800);return()=>clearTimeout(timer)},[gl]);return null;}
createRoot(document.getElementById('root')).render(
 <Canvas dpr={1.5} orthographic camera={{position:[0,height/2,7],zoom:900/(height*1.08),near:.1,far:40}} onCreated={({camera})=>camera.lookAt(0,height/2,0)} gl={{alpha:true,antialias:true,preserveDrawingBuffer:true}}>
  <TransmissionBackdrop color="#181a15"/>
  <ambientLight intensity={.65}/>
  <spotLight position={[-3,5,4]} intensity={100} angle={.6} penumbra={1} color="#fff2d5"/>
  <pointLight position={[3,1,4]} intensity={20} color="#ffdca5"/>
  <Suspense fallback={null}><group rotation-y={yaw}><PremiumBottle expression={expression} quality="high"/></group><Ready/></Suspense>
  <Environment resolution={256} frames={1}>
   <StudioReflections/>
   <Lightformer form="rect" intensity={6} position={[-3,2,4]} scale={[.35,7,1]} target={[0,height/2,0]}/>
   <Lightformer form="rect" intensity={4} position={[3,2,3]} scale={[.2,6,1]} target={[0,height/2,0]}/>
   <Lightformer form="rect" intensity={2} color="#d0ae72" position={[0,2,-4]} scale={[4,5,1]} target={[0,height/2,0]}/>
  </Environment>
 </Canvas>);
`);
await new Promise((done,reject)=>webpack({mode:'development',devtool:false,entry:join(work,'entry.tsx'),output:{path:work,filename:'render.js',publicPath:'/'},resolve:{extensions:['.tsx','.ts','.js'],modules:[resolve('node_modules')],alias:{'@':resolve('src')}},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:join(work,'loader.cjs')}]}},(err,stats)=>err||stats.hasErrors()?reject(err||new Error(stats.toString({all:false,errors:true}))):done()));
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/'){res.setHeader('Content-Type','text/html');res.end('<html><body style="margin:0"><div id="root" style="width:720px;height:900px"></div><script src="/render.js"></script></body></html>');return;}
  const file=path.startsWith('/media/')?join(root,'public',path):join(work,path);
  res.setHeader('Content-Type',({'.js':'application/javascript','.webp':'image/webp'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const index of [0,1]){
  for(const [view,yaw] of views.entries()){
  const page=await browser.newPage({viewport:{width:720,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error'&&/THREE|WebGL|shader|GL_INVALID/i.test(message.text()))errors.push(message.text())});
  await page.goto(`http://127.0.0.1:${server.address().port}/?bottle=${index}&yaw=${yaw}`);
  await page.waitForFunction(()=>window.bottleReady===true,{},{timeout:60000});
  if(errors.length)throw new Error(errors.join('\n'));
  const data=await page.locator('canvas').evaluate(canvas=>canvas.toDataURL('image/png').split(',')[1]);
  const out=`public/media/bottles/velmora-malt-0${index+1}.webp`;
  const rendered=await sharp(Buffer.from(data,'base64')).trim({threshold:10}).webp({quality:94}).toBuffer({resolveWithObject:true});
  if(view===0){
    await writeFile(out,rendered.data);
    console.log(out,rendered.info.width,rendered.info.height);
  }
  if(review){
    const tile=await sharp(rendered.data).resize(320,480,{fit:'contain',background:'#101614'}).extend({top:0,bottom:50,left:0,right:0,background:'#101614'}).png().toBuffer();
    const caption=Buffer.from(`<svg width="320" height="530"><text x="160" y="512" text-anchor="middle" fill="#d7bc86" font-family="sans-serif" font-size="14">${index===0?'VELMORA 01':'VELMORA 02'} · ${['FRONT','BACK','LEFT SIDE','RIGHT SIDE','PERSPECTIVE'][view]}</text></svg>`);
    tiles.push({input:await sharp(tile).composite([{input:caption}]).png().toBuffer(),left:view*320,top:index*530});
  }
  await page.close();
  }
 }
 if(review){
  await mkdir('.source-assets/bottle-review',{recursive:true});
  const out='.source-assets/bottle-review/signature-reserve.png';
  await sharp({create:{width:views.length*320,height:1060,channels:4,background:'#101614'}}).composite(tiles).png().toFile(out);
  console.log('Multi-angle model review:',out);
 }
}finally{await browser?.close();await new Promise(done=>server.close(done));}
