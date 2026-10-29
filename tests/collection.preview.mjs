// Isolated component fixture: actual React, Motion, GSAP and Three components.
// No age gate is mounted or submitted. Website routes are never patched.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, readdir } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright-core';
const require = createRequire(import.meta.url);
if (process.argv.includes('--drag')) {
  Object.assign(process.env, { GAMBER_GPU: '1', GAMBER_PROFILE: 'gpu', GAMBER_DRAG: '1' });
}
const originMode=process.argv.includes('--origin');
const storyMode=process.argv.includes('--story');
const root = process.cwd();
// Use the project's built, self-hosted typefaces for Origin composition review.
let originFonts='';
if(originMode){
 const chunks=join(root,'.next/static/chunks');
 for(const name of (await readdir(chunks)).filter(name=>name.endsWith('.css'))){
  const css=await readFile(join(chunks,name),'utf8');
  originFonts+=(css.match(/@font-face\{[^}]+\}/g)||[]).join('').replaceAll('../media/','/_next/static/media/');
 }
 originFonts+=':root{--font-cormorant:"Cormorant Garamond";--font-manrope:"Manrope"}';
}
const work = await mkdtemp(join(tmpdir(), 'gamber-collection-'));
const webpack = require('next/dist/compiled/webpack/webpack').webpack;
await writeFile(join(work, 'loader.cjs'), `
const ts=require(${JSON.stringify(require.resolve('typescript'))});
module.exports=function(source){
 if(this.resourcePath.endsWith('.css')) {
  const names={}; const prefix=this.resourcePath.split(/[\\\\/]/).pop().replace(/\\W/g,'_')+'_';
  if(this.resourcePath.endsWith('.module.css')) {
   source=source.replace(/\\.([a-zA-Z_][\\w-]*)/g,(match,key)=>'.'+(names[key]=prefix+key));
  }
  if(this.target==='node') return 'export default '+JSON.stringify(names);
  return 'const style=document.createElement("style");style.textContent='+JSON.stringify(source)+';document.head.appendChild(style);export default '+JSON.stringify(names);
 }
 return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
};`);
await writeFile(join(work, 'dynamic.jsx'), `import React from 'react'; export default function dynamic(load){const C=React.lazy(load);return props=><React.Suspense fallback={null}><C {...props}/></React.Suspense>}`);
await writeFile(join(work, 'link.jsx'), `import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`);
await writeFile(join(work,'navigation.js'),`export const usePathname=()=>'/';export const useRouter=()=>({push:()=>{}});`);
await writeFile(join(work, 'entry.tsx'), `
import {_roots} from '@react-three/fiber';window.bottleRoots=_roots;
import React from 'react';import {createRoot,hydrateRoot} from 'react-dom/client';
import '@/app/globals.css';
import {MotionProvider} from '@/animation/MotionProvider';
import {SmoothScroll} from '@/animation/SmoothScroll';import {Origin} from '@/sections/Origin';import {Contact} from '@/sections/Contact';
import {MotionUIProvider} from '@/animation/MotionUI';
import {HeroBottleHandoff} from '@/components/transition/HeroBottleHandoff';
import {Hero} from '@/sections/Hero';import {BottleFeature} from '@/sections/BottleFeature';import {Collection} from '@/sections/Collection';
import {OurStory} from '@/sections/story/OurStory';
const content=location.search.includes('story')?<OurStory/>:location.search.includes('standalone')?<Collection/>:<><HeroBottleHandoff><Hero/><BottleFeature><Collection/></BottleFeature></HeroBottleHandoff><Origin/><Contact/></>;
const tree=<MotionProvider><MotionUIProvider><SmoothScroll>{content}</SmoothScroll></MotionUIProvider></MotionProvider>;
if(location.search.includes('hydrate')) hydrateRoot(document.getElementById('root'),tree);else createRoot(document.getElementById('root')).render(tree);
`);
await new Promise((done, reject) => webpack({
  mode: 'development', devtool: false, entry: join(work, 'entry.tsx'),
  output: { path: work, filename: 'preview.js', publicPath: '/' },
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'], modules: [resolve('node_modules')], alias: { '@': resolve('src'), 'next/dynamic$': join(work, 'dynamic.jsx'), 'next/link$': join(work, 'link.jsx'), 'next/navigation$': join(work,'navigation.js') } },
  module: { rules: [{ test: /\.(tsx?|jsx|css)$/, exclude: /node_modules/, use: join(work, 'loader.cjs') }] },
}, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({all:false,errors:true}))) : done()));
// Reproduce preloaded SSR images finishing before React attaches onLoad.
let hydratedMarkup='';
if(!originMode&&(!process.env.GAMBER_PROFILE||process.env.GAMBER_PROFILE.startsWith('hydrated'))){
 await writeFile(join(work,'server-entry.tsx'),`
 import React from 'react';import {renderToString} from 'react-dom/server';
 import {MotionProvider} from '@/animation/MotionProvider';import {MotionUIProvider} from '@/animation/MotionUI';
 import {SmoothScroll} from '@/animation/SmoothScroll';import {Collection} from '@/sections/Collection';
 export const markup=renderToString(<MotionProvider><MotionUIProvider><SmoothScroll><Collection/></SmoothScroll></MotionUIProvider></MotionProvider>);
 `);
 await new Promise((done,reject)=>webpack({
  mode:'development',target:'node',devtool:false,entry:join(work,'server-entry.tsx'),
  output:{path:work,filename:'ssr.cjs',library:{type:'commonjs2'}},
  resolve:{extensions:['.tsx','.ts','.jsx','.js','.json'],modules:[resolve('node_modules')],alias:{'@':resolve('src'),'next/dynamic$':join(work,'dynamic.jsx'),'next/link$':join(work,'link.jsx'),'next/navigation$':join(work,'navigation.js')}},
  externals:[({request},callback)=>{if(!request.startsWith('.')&&!request.startsWith('@/')&&!request.startsWith('next/')&&!request.startsWith(work)){try{return callback(null,'commonjs '+require.resolve(request))}catch{}}callback()}],
  module:{rules:[{test:/\.(tsx?|jsx|css)$/,exclude:/node_modules/,use:join(work,'loader.cjs')}]},
 },(error,stats)=>error||stats.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):done()));
 hydratedMarkup=require(join(work,'ssr.cjs')).markup;
}
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/') {
      const hydrate=req.url.includes('hydrate');
      const start=hydrate?`<script>Promise.all(Array.from(document.querySelectorAll('[data-collection-environment] img')).map(img=>img.decode())).then(()=>{window.cachedEnvironmentImages=Array.from(document.querySelectorAll('[data-collection-environment] img')).every(img=>img.complete&&img.naturalWidth>0);const script=document.createElement('script');script.src='/preview.js';document.body.appendChild(script)});</script>`:'<script src="/preview.js"></script>';
      res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+originFonts+'</style></head><body><div id="root">'+(hydrate?hydratedMarkup:'')+'</div>'+start+'</body></html>');return;
    }
    const file = path.startsWith('/_next/static/media/') ? join(root,'.next/static/media',path.split('/').pop()) : path.startsWith('/media/') ? join(root, 'public', path) : join(work, path);
    res.setHeader('Content-Type', ({'.js':'application/javascript','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.statusCode=404;res.end(); }
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=`http://127.0.0.1:${server.address().port}`;
async function verifyOrigin(page,profile){
 const cinematic=profile.width>=900&&!profile.reduced;
 const root=page.locator('[data-origin]');
 assert.equal(await root.locator('canvas').count(),0,'Origin created an unnecessary WebGL canvas');
 assert.equal(await root.locator('[data-origin-tick]').count(),3);
 assert.doesNotMatch(await root.innerText(),/Conceptual scenery/);
 const setup=await page.evaluate(()=>{const el=document.querySelector('[data-origin]');const t=window.__ST.getAll().find(t=>t.trigger===el&&t.vars.pin);return t?{start:t.start,end:t.end}:null});
 // One pin: 40% bridge from the collection, the chapters' 300%, a 70% closing into Contact (originJourney.ts).
 if(cinematic)assert.ok(Math.abs(setup.end-setup.start-innerHeightFor(profile)*(JOURNEY.bridge+JOURNEY.chapters+JOURNEY.closing))<2,'Origin pin changed from bridge + 300% + closing');
 else assert.equal(setup,null,'Mobile/reduced Origin should use native scroll');
 const previous=new Map();
 for(const p of [.2,.32,.54,.66,.87,.54,.2]){
  const index=p<.333?0:p<.667?1:2;
  await page.evaluate(({p,index,setup,cinematic,journey})=>{
   let target;
   if(cinematic)target=setup.start+(journey.bridge+p*journey.chapters)*innerHeight;
   else{const chapter=document.querySelectorAll('[data-origin-chapter]')[index];const r=chapter.getBoundingClientRect();target=r.top+scrollY+(r.height-innerHeight)/2;}
   scrollTo(0,target);window.__ST.update();
  },{p,index,setup,cinematic,journey:JOURNEY});
  await page.waitForTimeout(cinematic?1200:950);
  const result=await page.evaluate(index=>{
   const root=document.querySelector('[data-origin]'),chapter=root.querySelectorAll('[data-origin-chapter]')[index],title=chapter.querySelector('[data-origin-title]'),body=chapter.querySelector('[data-origin-body]');
   const r=title.getBoundingClientRect();const ticks=root.querySelector('[data-origin-tick]').parentElement.getBoundingClientRect();
   const images=Array.from(root.querySelectorAll('img')).map(img=>({src:img.getAttribute('src'),decoded:img.complete&&img.naturalWidth>0}));
   return {scroll:scrollY,current:Number([...root.querySelectorAll('[data-origin-tick]')].findIndex(el=>el.getAttribute('aria-current')==='step'))+1,
    title:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},body:Number(getComputedStyle(body).opacity),visible:getComputedStyle(chapter).visibility!=='hidden',
    scenes:[...root.querySelectorAll('[data-origin-scene]')].map(el=>Number(getComputedStyle(el).opacity)),emblem:Number(getComputedStyle(root.querySelector('[data-origin-emblem]')).opacity),
    overflow:document.documentElement.scrollWidth>innerWidth+1,images,transform:getComputedStyle(root.querySelector('[data-origin-scene] picture').parentElement).transform};
  },index);
  assert.equal(result.overflow,false,`${profile.name}: Origin overflow`);
  assert.ok(result.images.every(img=>img.decoded),'An Origin asset failed to load');
  assert.ok(!result.images.some(img=>/\/media\/brand\//.test(img.src)),'Retired identity artwork is still visible');
  if([.2,.54,.87].includes(p)){
   assert.equal(result.current,index+1,'Chapter indicator is out of sync');
   assert.equal(result.visible,true,'Current chapter is hidden');
   assert.ok(result.body>.99,'Current chapter description is hidden');
   assert.ok(result.title.x>=0&&result.title.right<=profile.width-30,'Chapter heading is clipped');
   assert.ok(result.title.y>=0&&result.title.bottom<profile.height,'Chapter heading is outside the viewport');
   assert.ok(result.scenes[index]>.99,'Current photographic scene is missing');
   if(index===1)assert.ok(result.emblem>.99,'Original emblem did not reveal');
   if(index===2)assert.ok(result.emblem<.01,'Emblem did not dissolve into craftsmanship');
  }
  if(profile.reduced)assert.equal(result.transform,'none','Reduced motion retained camera movement');
  if(previous.has(p))assert.ok(result.scenes.every((value,i)=>Math.abs(value-previous.get(p).scenes[i])<.005),'Reverse scroll did not restore the scene');else previous.set(p,result);
  await page.screenshot({path:join(work,`origin-${profile.name}-${p}.png`)});
  if(p===.32){const before=result.scroll;await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>scrollY),before,'Origin auto-scrolled during a pause');}
 }
 const contact=await page.evaluate(setup=>{
   const root=document.querySelector('[data-origin]');scrollTo(0,setup?setup.end+innerHeight*.6:root.getBoundingClientRect().bottom+scrollY-innerHeight*.4);window.__ST.update();
   const c=document.querySelector('[aria-labelledby=contact-title]').getBoundingClientRect();return {top:c.top,bottom:c.bottom,height:innerHeight};
 },setup);
 assert.ok(contact.top<contact.height&&contact.bottom>0,'The journey did not continue naturally into Contact');
}
function innerHeightFor(profile){return profile.height;}
/** Viewport heights of Origin's single pin (src/components/transition/originJourney.ts). */
const JOURNEY={bridge:.4,chapters:3,closing:.7};
let browser;
try {
 browser=await chromium.launch({channel:'chrome',headless:true});
 for(const profile of [
  {name:'desktop',width:1440,height:900},
  {name:'reported-desktop',width:1901,height:867},
  {name:'small-desktop',width:1024,height:768},
  {name:'short-desktop',width:1366,height:600},
  {name:'tablet',width:834,height:1112},
  {name:'mobile',width:375,height:812},
  {name:'landscape',width:844,height:390},
  {name:'reduced',width:1440,height:900,reduced:true},
  {name:'standalone',width:1440,height:900,standalone:true},
  {name:'hydrated',width:1440,height:900,standalone:true,hydrate:true},
  {name:'hydrated-mobile',width:390,height:844,standalone:true,hydrate:true},
  ...(process.env.GAMBER_GPU ? [{name:'gpu',width:1440,height:900,gpu:true}] : []),
 ].filter(profile=>(!originMode||(!profile.standalone&&!profile.gpu))&&(!process.env.GAMBER_PROFILE||profile.name===process.env.GAMBER_PROFILE))) {
  const page=await browser.newPage({viewport:profile,reducedMotion:profile.reduced?'reduce':'no-preference'});
  page.setDefaultTimeout(20000); const errors=[];page.on('console',message=>{if(message.type()==='error'&&/Cannot update a component|Maximum update depth|setState.*render|THREE.WebGLProgram|shader.*not.*compiled|GL_INVALID/i.test(message.text()))errors.push(message.text())});page.on('pageerror',e=>{errors.push(e.message);console.error(profile.name+': '+e.message)});
  if(!profile.gpu) await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:get.call(this,type,...args)}});
  const backgroundRequests=[];page.on('request',request=>{if(/collection-(aromatic-highlands|golden-whisper)(-mobile)?\.webp/.test(request.url()))backgroundRequests.push(request.url())});
  await page.goto(origin+(storyMode?'?story':profile.hydrate?'?standalone&hydrate':profile.standalone?'?standalone':''));
  if(storyMode){
    const controls=page.locator('[aria-controls="emblem-part-detail"]');
    assert.equal(await controls.count(),4);
    for(let index=0;index<4;index++){
      await controls.nth(index).click();
      await page.waitForTimeout(profile.reduced?200:1000);
      assert.equal(await controls.nth(index).getAttribute('aria-pressed'),'true');
      assert.equal(await controls.nth(index).getAttribute('data-shown'),'true');
      const title=await controls.nth(index).locator('span').last().innerText();
      assert.ok((await page.locator('#emblem-part-detail').innerText()).toLowerCase().includes(title.toLowerCase()));
      assert.equal(await page.locator('#emblem-part-detail img').evaluate(img=>img.complete&&img.naturalWidth>0),true);
    }
    await controls.first().focus();await page.keyboard.press('Enter');
    assert.equal(await controls.first().getAttribute('aria-pressed'),'true','Keyboard selection failed');
    await page.waitForTimeout(profile.reduced?200:1100);
    assert.match(await page.locator('#emblem-part-detail').innerText(),/rhododendron/i,'Keyboard selection did not update the detail');
    assert.equal(await page.locator('img[src*="/media/brand/"]').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Story has horizontal overflow');
    await page.screenshot({path:join(work,`story-${profile.name}.png`)});
    assert.deepEqual(errors,[]);
    console.log(`${profile.name}: neutral story explorer, imagery, keyboard selection and layout passed`);
    await page.close();continue;
  }
  await page.waitForFunction(()=>window.__ST && document.querySelector('[data-collection-stage]'));
  await page.waitForTimeout(800);
  await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';try{await img.decode()}catch{}}window.__ST.refresh()});
  if(profile.hydrate) assert.equal(await page.evaluate(()=>window.cachedEnvironmentImages),true,'Hydration fixture must decode images before attaching React');
  if(originMode){
    await verifyOrigin(page,profile);
    assert.deepEqual(errors,[],`${profile.name}: Origin browser errors`);
    console.log(`${profile.name}: Origin chapters, imagery, reverse/pause, indicators, layout and Contact exit passed`);
    await page.close();continue;
  }
  const cinematic=profile.width>=900&&!profile.reduced&&!profile.standalone;
  if(cinematic){
   await page.waitForFunction(()=>window.__ST.getAll().some(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin));
   if(profile.gpu) await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[data-bottle-gpu]')).opacity)>.99,null,{timeout:45000});
   const snapshots=new Map();let pinnedSlot;
   for(const p of [.76,.84,.87,.9,.93,.95,.965,.975,.995,1,.95,.87,.76]){
    await page.evaluate(p=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);scrollTo(0,t.start+p*((t.end-t.start)/t.animation.duration()));window.__ST.update()},p);
    await page.waitForTimeout(profile.gpu?1300:150);
    const result=await page.evaluate(()=>{
      const root=document.querySelector('[data-gallery-linked=true]');const photo=root.querySelector('[data-bottle-2d] img');const box=photo.getBoundingClientRect();const slot=document.querySelector('[data-shared-bottle=true]').getBoundingClientRect();
      return {top:box.top,left:box.left,width:box.width,height:box.height,alpha:Number(getComputedStyle(root.querySelector('[data-bottle-2d]')).opacity),slot:{left:slot.left,top:slot.top,width:slot.width,height:slot.height},details:Number(getComputedStyle(document.querySelector('[data-collection-details]')).opacity),environment:Number(getComputedStyle(document.querySelector('[data-alpine-gallery]')).opacity),inert:document.querySelector('[data-embedded]').inert,overflow:document.documentElement.scrollWidth>innerWidth+1,cardPhotos:document.querySelector('[data-shared-bottle=true]').querySelectorAll('img').length};
    });
    assert.equal(result.overflow,false,`${profile.name}: overflow at ${p}`);
    if(p>=.84&&p<1){
      pinnedSlot??=result.slot;
      assert.ok(Math.abs(result.slot.top-pinnedSlot.top)<1,'Collection moved vertically during its handoff');
      assert.ok(Math.abs(result.slot.left-pinnedSlot.left)<1,'Collection moved horizontally during its handoff');
    }
    assert.equal(result.cardPhotos,0,'Duplicate first bottle in the collection');
    assert.ok(result.alpha>.99 && result.top<profile.height && result.top+result.height>0,`${profile.name}: bottle vanished at ${p}`);
    if(p===.95){assert.ok(result.details>.1,'Collection appears too late');const y=await page.evaluate(()=>scrollY);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>scrollY),y,'Automatic scrolling');}
    if(p===1){assert.ok(await page.locator('[data-collection-controls]').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'Collection controls clipped');assert.ok(result.details>.99&&result.environment>.99);assert.equal(result.inert,false);assert.ok(Math.abs(result.left+result.width/2-result.slot.left-result.slot.width/2)<2,'Bottle did not align with its collection slot');}
    if(snapshots.has(p)) {assert.ok(Math.abs(snapshots.get(p).left-result.left)<2,`Reverse scroll position mismatch at ${p}: ${JSON.stringify({before:snapshots.get(p),after:result})}`);assert.ok(Math.abs(snapshots.get(p).top-result.top)<2,'Reverse scroll height mismatch');}else snapshots.set(p,result);
    if([.87,.93,.95,.995,1].includes(p)) await page.screenshot({path:join(work,`${profile.name}-${p}.png`)});
   }
   // Reproduce the reported bottom strip: 33px beyond the old showcase pin.
   await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);const showcase=(t.end-t.start)/t.animation.duration();scrollTo(0,t.start+showcase+33);window.__ST.update()});
   await page.waitForTimeout(180);
   const held=await page.evaluate(()=>{
     const root=document.querySelector('[data-gallery-linked=true]');
     const stage=root.querySelector('[data-stage]').getBoundingClientRect();
     const story=document.querySelector('[data-origin]').getBoundingClientRect();
     // Origin's bridge may lie over the hold, but its valley must not show yet
     // and the collection must still receive pointer input beneath it.
     const valley=document.querySelector('[data-origin-valley]');const controls=document.querySelector('[data-collection-controls]').getBoundingClientRect();
     const hit=document.elementFromPoint(controls.left+controls.width/2,controls.top+controls.height/2);
     return {top:stage.top,bottom:stage.bottom,storyTop:story.top,height:innerHeight,interactive:!document.querySelector('[data-embedded=true]').inert,
      valley:valley?Number(getComputedStyle(valley).opacity):0,reachable:!!hit?.closest('[data-embedded=true]'),hit:hit?`${hit.tagName}.${hit.className} < ${hit.parentElement?.className} pe=${getComputedStyle(hit).pointerEvents}`:'none'};
   });
   assert.ok(Math.abs(held.top)<1&&held.bottom>=held.height-1,'Collection no longer fills the viewport during its settled hold');
   assert.ok(held.storyTop>=held.height-1||held.valley<.05,'Story leaks into the settled collection');
   assert.equal(held.reachable,true,`Origin blocks the settled collection (hit ${held.hit})`);
   assert.equal(held.interactive,true,'Collection controls are locked during the hold');
   await page.screenshot({path:join(work,`${profile.name}-held-collection.png`)});
   await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);scrollTo(0,t.end);window.__ST.update()});
   await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);scrollTo(0,t.end+100);window.__ST.update()});
   const unpinned=await page.locator('[data-shared-bottle=true]').evaluate(e=>e.getBoundingClientRect().top);
   assert.ok(unpinned<pinnedSlot.top-90,'Collection failed to resume natural scrolling after handoff');
   // Interact in the settled hold: by the pin's end Our Origin's valley has
   // replaced the collection (originJourney.ts bridge).
   await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);const showcase=(t.end-t.start)/t.animation.duration();scrollTo(0,t.start+showcase+33);window.__ST.update()});
   // Let the damped shared bottle settle into its card before dragging it.
   await page.waitForTimeout(1400);
  }else{
   await page.evaluate(()=>scrollTo(0,document.querySelector('[aria-labelledby=collection-title]').getBoundingClientRect().top+scrollY));await page.waitForTimeout(1500);
   assert.equal(await page.locator('[data-embedded]').getAttribute('data-embedded'),'false');
   assert.equal(await page.locator('[data-collection-details]').evaluate(e=>Number(getComputedStyle(e).opacity)),1,'Responsive details remain hidden');
   assert.equal(await page.locator('[aria-label=Expressions] button').first().locator('span').last().evaluate(e=>Number(getComputedStyle(e.parentElement).opacity)),1,'Responsive product name remains hidden');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${profile.name}: overflow`);
   await page.screenshot({path:join(work,`${profile.name}.png`)});

  }
  const inspectBottle = index => page.evaluate(index=>{
    const suffix=index===1?'/approved-02-label.webp':'/approved-01-label.webp';const labels=[];
    for(const root of window.bottleRoots.values()){
      const scene=root.store.getState().scene;scene.updateMatrixWorld(true);
      scene.traverse(o=>{if(o.isMesh&&o.material?.map?.image?.src?.split('?')[0].endsWith(suffix))labels.push(o)});
    }
    if(labels.length!==1)throw new Error('Expected one original bottle label, found '+labels.length);
    const label=labels[0],body=label.parent,outer=body.parent.parent;
    const inverse=outer.matrixWorld.clone().invert();
    return {yaw:outer.rotation.y,id:outer.uuid,parts:body.children.filter(o=>o.isMesh).map(o=>({id:o.uuid,matrix:inverse.clone().multiply(o.matrixWorld).elements}))};
  },index);
  const dragBottle = async(index,stage,fast=false)=>{
    const card=page.locator('[aria-label=Expressions] button').nth(index);const box=await card.boundingBox();
    const x=box.x+box.width*.5,y=box.y+box.height*.4;
    await page.mouse.move(x,y);await page.mouse.down();await page.waitForTimeout(160);
    const before=await inspectBottle(index),angles=[];
    for(const [frame,delta] of [0,-80,-230,-420,-690,-300,40].entries()){
      await page.mouse.move(x+delta,y,{steps:fast?4:16});await page.waitForTimeout(180);
      const pose=await inspectBottle(index);angles.push(pose.yaw);
      assert.equal(pose.id,before.id,'Switching replaced the original bottle group');
      assert.equal(pose.parts.length,before.parts.length,'A bottle surface was duplicated or detached');
      for(let i=0;i<pose.parts.length;i++)for(let j=0;j<16;j++)assert.ok(Math.abs(pose.parts[i].matrix[j]-before.parts[i].matrix[j])<1e-5,'A bottle surface moved independently from the bottle');
      await page.screenshot({path:join(work,`drag-${stage}-${index}-${frame}.png`)});
    }
    assert.ok(angles[0]-angles[4]>Math.PI*2,`Mouse drag failed to complete a full rotation (${stage} ${index}: ${angles.map(a=>a.toFixed(2)).join(' ')})`);
    assert.ok(angles[6]>angles[4]+Math.PI,'Reverse drag failed to change direction');
    await page.mouse.up();await page.waitForTimeout(600);
  };
  if(profile.gpu&&process.env.GAMBER_DRAG){
    await page.evaluate(()=>{window.dragEvents=[];for(const type of ['dragstart','pointercancel'])document.addEventListener(type,e=>window.dragEvents.push(type),true)});
    await dragBottle(1,'initial');await dragBottle(0,'private');
  }
  await page.locator('[aria-label=Expressions] button').nth(1).click();
  if(profile.gpu&&process.env.GAMBER_DRAG) await dragBottle(1,'selection',true);
  await page.waitForTimeout(220);
  const midway = await page.locator('[data-collection-environment="the-vault-series"]').evaluate(e=>Number(getComputedStyle(e).opacity));
  if(!profile.reduced&&!(profile.gpu&&process.env.GAMBER_DRAG)) assert.ok(midway>0&&midway<1,'Environment does not crossfade');
  await page.screenshot({path:join(work,`${profile.name}-switch.png`)});
  await page.waitForTimeout(900);
  assert.match(await page.locator('[data-name]').innerText(),/Single Malt · 02/);
  assert.equal(await page.locator('[aria-label=Expressions] button').nth(1).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-collection-environment="the-vault-series"]').evaluate(e=>Number(getComputedStyle(e).opacity)),1);
  await page.screenshot({path:join(work,`${profile.name}-vault.png`)});
  await page.locator('[aria-label=Expressions] button').nth(0).click();await page.waitForTimeout(1300);
  assert.match(await page.locator('[data-name]').innerText(),/Single Malt · 01/);
  assert.equal(await page.locator('[data-collection-environment="the-vault-series"]').evaluate(e=>Number(getComputedStyle(e).opacity)),0);
  assert.equal(backgroundRequests.length,2,'Background images were downloaded again on product selection');
  const images=await page.locator('[data-collection-environment] img').evaluateAll(images=>images.map(img=>({ok:img.complete&&img.naturalWidth>0,src:img.getAttribute('src')})));
  assert.ok(images.every(img=>img.ok),'Environment failed to decode');
  const originalSlots = await page.locator('[data-card-bottle]').evaluateAll(elements=>elements.map(e=>({left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top})));
  for(const index of [1,0,1,0,1]){
    await page.locator('[aria-label=Expressions] button').nth(index).click();
    await page.waitForTimeout(65);
  }
  await page.waitForTimeout(1150);
  assert.match(await page.locator('[data-name]').innerText(),/Single Malt · 02/,'A stale selection replaced the latest product');
  assert.equal(await page.locator('[data-collection-environment="the-vault-series"]').evaluate(e=>Number(getComputedStyle(e).opacity)),1);
  const buttons=page.locator('[aria-label=Expressions] button');
  await buttons.first().focus();await page.keyboard.press('Enter');
  await page.waitForTimeout(1150);
  assert.match(await page.locator('[data-name]').innerText(),/Single Malt · 01/,'Keyboard product selection failed');
  assert.equal(await buttons.first().getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-collection-environment="the-vault-series"]').evaluate(e=>Number(getComputedStyle(e).opacity)),0);
  assert.equal(await page.locator('[data-world-sweep]').count(),profile.reduced?0:1);
  if(!profile.reduced) assert.equal(await page.locator('[data-world-sweep]').evaluate(e=>Number(getComputedStyle(e).opacity)),0,'Light sweep outlasts the 1.05s transition');
  assert.equal(backgroundRequests.length,2,'Rapid selection downloaded backgrounds again');
  assert.equal(await page.locator('[data-collection-controls] a').first().getAttribute('href'),'/whisky');
  assert.equal(await page.locator('[data-collection-controls] a').last().getAttribute('href'),'/contact');
  if(cinematic){
    const finalSlots=await page.locator('[data-card-bottle]').evaluateAll(elements=>elements.map(e=>({left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top})));
    for(let i=0;i<finalSlots.length;i++) assert.ok(Math.abs(finalSlots[i].top-originalSlots[i].top)<1,'Switching shifted the collection layout');
  }
  if(profile.gpu&&process.env.GAMBER_DRAG){
    await page.locator('[aria-label=Expressions] button').nth(1).click();
    await dragBottle(1,'rapid',true);
    await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);scrollTo(0,t.end+innerHeight);window.__ST.update()});
    await page.waitForTimeout(250);
    // Back to the settled collection (at t.end Our Origin's valley covers it).
    await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);const showcase=(t.end-t.start)/t.animation.duration();scrollTo(0,t.start+showcase+33);window.__ST.update()});
    await page.waitForTimeout(1400);await dragBottle(1,'return',true);
    assert.deepEqual(await page.evaluate(()=>window.dragEvents),[],'A native image drag cancelled the 3D gesture');
    await page.reload();
    await page.waitForFunction(()=>window.__ST?.getAll().some(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin));
    await page.evaluate(()=>{const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);const showcase=(t.end-t.start)/t.animation.duration();scrollTo(0,t.start+showcase+33);window.__ST.update()});
    await page.waitForFunction(()=>{let found=false;for(const root of window.bottleRoots.values())root.store.getState().scene.traverse(o=>{if(o.material?.map?.image?.src?.split('?')[0].endsWith('/approved-02-label.webp'))found=true});return found});
    await page.waitForTimeout(1000);await dragBottle(1,'reload',true);
    console.log('Full-turn mouse drags: coherent original geometry, reverse/release, switching, scroll return and reload passed');
  }
  if(profile.gpu){
   await page.evaluate(()=>document.querySelectorAll('canvas').forEach(c=>c.dispatchEvent(new Event('webglcontextlost',{cancelable:true}))));
   await page.waitForTimeout(100);
   assert.equal(await page.locator('[data-bottle-gpu]').count(),0,'Failed canvas remained in front of the photo');
   assert.equal(await page.locator('[data-bottle-photo]').evaluate(e=>Number(getComputedStyle(e).opacity)),1,'Lost-context fallback was hidden');
  }
  if(profile.name==='desktop'){
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-embedded]').getAttribute('data-embedded'),'false');
    assert.equal(await page.locator('[data-collection-details]').evaluate(e=>Number(getComputedStyle(e).opacity)),1,'Resize hid the collection content');
    await page.setViewportSize({width:profile.width,height:profile.height});
    await page.waitForFunction(()=>window.__ST.getAll().some(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin));
    await page.evaluate(()=>{window.__ST.refresh();const t=window.__ST.getAll().find(t=>t.trigger?.matches('[data-gallery-linked=true]')&&t.vars.pin);scrollTo(0,t.end);window.__ST.update()});
    await page.waitForTimeout(200);
    assert.equal(await page.locator('[data-collection-details]').evaluate(e=>Number(getComputedStyle(e).opacity)),1,'Resize failed to restore the pinned collection');
  }
  assert.deepEqual(errors,[],`${profile.name}: browser errors`);
  console.log(`${profile.name}: visible handoff, alignment, reverse/pause and product selection passed`);
  await page.close();
 }
 console.log(`Collection previews: ${work}`);
}finally{await browser?.close();await new Promise(done=>server.close(done));}
