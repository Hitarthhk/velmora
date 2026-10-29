import { Color, Float32BufferAttribute, type BufferGeometry } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ExpressionId } from '@/content/site';
import { curve, loft, smoothstep, type Ring, type Section } from './loft';
import { mergeParts, sideRelief } from './ornaments';

export type Placement = { width: number; y0: number; y1: number; offset: number };
export type BottleDesign = {
  id: ExpressionId; height: number; width: number; display: number;
  section: (y: number) => Section;
  glass: (segments: number) => BufferGeometry;
  liquid: (segments: number) => BufferGeometry;
  stopper: (segments: number) => BufferGeometry;
  label: Placement & { src: string };
  backLabel: Placement & { src: string };
  focus: { label: number; cap: number };
  light: { key: string; rim: string; fill: string };
  construction: { floor: number; wall: number; fill: number; mouth: number; capBottom: number; capRadius: number; facets: number; neckBottom: number; neckTop: number; neckRadius: number; collarBottom: number; collarTop: number; collarRadius: number; shoulder: [number,number] | null };
};
type Station = [y:number,a:number,b:number,cut:number];

// Measured against the supplied 2400 × 1792 front/side sheets. Keep the
// established overall heights, but reproduce the approved silhouette ratios.
const SIGNATURE:Station[]=[
  [0,.355,.259,.024],[.018,.392,.294,.026],[.045,.402,.304,.025],
  [.145,.402,.304,.025],[1.015,.402,.304,.025],
  [1.045,.396,.298,.026],[1.073,.379,.282,.028],
  [1.085,.373,.279,.028],[1.116,.345,.259,.028],
  [1.142,.3125,.237,.027],[1.167,.273,.208,.025],
  [1.193,.215,.165,.022],[1.209,.1705,.137,.018],
  [1.23,.132,.132,0],[1.40,.132,.132,0],
  [1.424,.164,.164,0],[1.455,.164,.164,0],
];
const RESERVE:Station[]=[
  [0,.435,.326,0],[.010,.444,.333,0],[.035,.490,.367,0],
  [.099,.5116,.384,0],[.212,.497,.373,0],[.325,.489,.367,0],
  [.438,.480,.360,0],[.551,.4754,.357,0],[.664,.480,.360,0],
  [.777,.4867,.365,0],[1.003,.5161,.387,0],[1.229,.5387,.404,0],
  [1.341,.5398,.405,0],[1.454,.5206,.390,0],[1.511,.4991,.374,0],
  [1.590,.4461,.335,0],[1.680,.3264,.245,0],[1.748,.2281,.183,0],
  [1.827,.1705,.159,0],[1.884,.1604,.158,0],[1.94,.158,.158,0],
  [2.29,.158,.158,0],[2.32,.202,.202,0],[2.35,.202,.202,0],
];

function fairCurve(points:[number,number][]){
  const slopes=points.slice(1).map(([x,y],i)=>(y-points[i][1])/(x-points[i][0]));
  const tangents=points.map((_,i)=>i===0?slopes[0]:i===points.length-1?slopes.at(-1)!:slopes[i-1]*slopes[i]<=0?0:2/(1/slopes[i-1]+1/slopes[i]));
  return(x:number)=>{
    if(x<=points[0][0])return points[0][1];
    for(let i=1;i<points.length;i++)if(x<=points[i][0]){
      const [x0,y0]=points[i-1],[x1,y1]=points[i],h=x1-x0,t=(x-x0)/h;
      return(2*t*t*t-3*t*t+1)*y0+(t*t*t-2*t*t+t)*h*tangents[i-1]+(-2*t*t*t+3*t*t)*y1+(t*t*t-t*t)*h*tangents[i];
    }
    return points.at(-1)![1];
  };
}
function profile(stations:Station[],rounded:boolean){
  const interpolate=rounded?fairCurve:curve;
  const width=interpolate(stations.map(([y,a])=>[y,a]));
  const depth=interpolate(stations.map(([y,,b])=>[y,b]));
  const bevel=curve(stations.map(([y,,,c])=>[y,c]));
  return(y:number):Section=>{
    const neck=rounded?smoothstep(1.85,1.94,y):smoothstep(1.208,1.23,y);
    return rounded||neck>.99
      ?{y,a:width(y),b:depth(y),n:rounded?5.8-3.8*neck:2,rotation:Math.PI/4}
      :{y,a:width(y),b:depth(y),n:8,cut:bevel(y)};
  };
}
const signatureSection=profile(SIGNATURE,false), reserveSection=profile(RESERVE,true);
function crisp(g:BufferGeometry){const result=toCreasedNormals(g,Math.PI/7);if(result!==g)g.dispose();return result;}
function inset(s:Section,wall:number):Section{return{...s,a:s.a-wall,b:s.b-wall,...(s.cut!==undefined?{cut:Math.max(.006,s.cut-wall*.5)}:{})};}
function heights(stations:Station[],rounded:boolean){
  return rounded?stations.flatMap(([y],i)=>i===stations.length-1?[y]:Array.from({length:Math.max(1,Math.ceil((stations[i+1][0]-y)/.035))},(_,j)=>y+(stations[i+1][0]-y)*j/Math.max(1,Math.ceil((stations[i+1][0]-y)/.035)))):stations.map(([y])=>y);
}
function shell(stations:Station[],section:(y:number)=>Section,floor:number,wall:number,segments:number,rounded:boolean){
  const ys=heights(stations,rounded);
  const outer:Ring[]=ys.map(section);
  const inner=[floor,...ys.filter(y=>y>floor)].reverse().map(y=>inset(section(y),wall));
  return crisp(loft([...outer,...inner],{segments}));
}
function spirit(section:(y:number)=>Section,stations:Station[],floor:number,wall:number,fill:number,segments:number,rounded:boolean,amber:string,deep:string){
  const gold=new Color(amber),brown=new Color(deep);
  const ys=[floor+.009,...heights(stations,rounded).filter(y=>y>floor+.009&&y<fill),fill-.006,fill].sort((a,b)=>a-b);
  return crisp(loft(ys.map(y=>inset(section(y),wall+.006)),{segments,color:y=>gold.clone().lerp(brown,smoothstep(floor,fill,y)*.35)}));
}
function stopper01(segments:number){
  return crisp(loft([[1.512,.135,.115,.03],[1.53,.18,.14,.035],[1.57,.215,.168,.04],[1.70,.215,.168,.04],[1.733,.172,.135,.033],[1.746,.143,.118,.03]].map(([y,a,b,cut])=>({y,a,b,cut,n:8})),{segments}));
}
function stopper02(){
  const g=loft([[2.425,.148],[2.45,.176],[2.535,.262],[2.62,.262],[2.69,.210],[2.73,.145],[2.742,.105]].map(([y,r])=>({y,a:r,b:r*.96,n:2})),{segments:8});
  g.rotateY(Math.PI/8);return crisp(g);
}
function decoratedGlass(body:BufferGeometry,section:(y:number)=>Section,motif:'01'|'02'){
  if(motif==='02'){
    const white=new Float32Array(body.getAttribute('position').count*3).fill(1);
    body.setAttribute('color',new Float32BufferAttribute(white,3));
    return body;
  }
  const relief=sideRelief(section,motif);
  const tint=new Color(motif==='01'?'#e8c59d':'#dfb78d');
  for(const [g,color] of [[body,new Color('#ffffff')],[relief,tint]] as const){
    const data=new Float32Array(g.getAttribute('position').count*3);
    for(let i=0;i<data.length;i+=3){data[i]=color.r;data[i+1]=color.g;data[i+2]=color.b;}
    g.setAttribute('color',new Float32BufferAttribute(data,3));
  }
  return mergeParts([body,relief]);
}

export const privateEdition:BottleDesign={
  id:'private-edition-i',height:1.746,width:.84,display:1.32,section:signatureSection,
  glass:s=>decoratedGlass(shell(SIGNATURE,signatureSection,.145,.024,s,false),signatureSection,'01'),
  liquid:s=>spirit(signatureSection,SIGNATURE,.145,.024,1.186,s,false,'#bd7224','#864313'),stopper:stopper01,
  label:{src:'/media/textures/approved-01-label.webp?v=approved-1',width:.59,y0:.148,y1:1.014,offset:.0022},
  backLabel:{src:'/media/textures/approved-01-back.webp?v=approved-1',width:.558,y0:.15,y1:.767,offset:.0022},
  focus:{label:.58,cap:1.635},light:{key:'#fff0d5',rim:'#d6bd8a',fill:'#dfae63'},
  construction:{floor:.145,wall:.024,fill:1.186,mouth:1.455,capBottom:1.512,capRadius:.215,facets:8,neckBottom:1.246,neckTop:1.386,neckRadius:.134,collarBottom:1.402,collarTop:1.448,collarRadius:.178,shoulder:[1.073,1.208]},
};
export const vaultSeries:BottleDesign={
  id:'the-vault-series',height:2.742,width:1.11,display:1,section:reserveSection,
  glass:s=>decoratedGlass(shell(RESERVE,reserveSection,.16,.030,s,true),reserveSection,'02'),
  liquid:s=>spirit(reserveSection,RESERVE,.16,.030,1.825,s,true,'#a96221','#66300e'),stopper:()=>stopper02(),
  label:{src:'/media/textures/approved-02-label.webp?v=approved-1',width:.795,y0:.265,y1:1.53,offset:.0026},
  backLabel:{src:'/media/textures/approved-02-back.webp?v=approved-1',width:.79,y0:.27,y1:1.505,offset:.0026},
  focus:{label:.90,cap:2.59},light:{key:'#ffe8c4',rim:'#c1bac0',fill:'#c3914c'},
  construction:{floor:.16,wall:.030,fill:1.825,mouth:2.35,capBottom:2.425,capRadius:.262,facets:8,neckBottom:1.884,neckTop:2.267,neckRadius:.161,collarBottom:2.30,collarTop:2.365,collarRadius:.208,shoulder:null},
};
export const designs:Record<ExpressionId,BottleDesign>={'private-edition-i':privateEdition,'the-vault-series':vaultSeries};
