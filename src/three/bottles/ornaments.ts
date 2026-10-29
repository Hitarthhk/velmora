import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Shape, ExtrudeGeometry, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { curve, frontZ, type Section } from './loft';
import acanthus from './approved-relief-02.json';

type Profile = (y: number) => Section;
export type Motif = '01' | '02';
export function mergeParts(parts: BufferGeometry[]) {
  const flat=parts.map(g=>g.index?g.toNonIndexed():g);
  const merged=mergeGeometries(flat,false)!;
  parts.forEach(g=>g.dispose());
  flat.forEach((g,i)=>{if(g!==parts[i])g.dispose();});
  return merged;
}

function sidePoint(section: Profile, side: number, z: number, y: number, lift=0) {
  const s=section(y);
  const x=frontZ(z,{...s,a:s.b,b:s.a})+lift;
  return new Vector3(side*x,y,z);
}

function sweep(points: Vector3[], radius: number, detail=40) {
  const curve=new CatmullRomCurve3(points);
  const g=new TubeGeometry(curve,detail,1,8,false);
  const p=g.getAttribute('position'), n=g.getAttribute('normal');
  for(let i=0;i<p.count;i++){
    const t=Math.floor(i/9)/detail;
    const r=radius*(.12+.88*Math.pow(Math.sin(Math.PI*t),.38));
    p.setXYZ(i,p.getX(i)+n.getX(i)*(r-1),p.getY(i)+n.getY(i)*(r-1),p.getZ(i)+n.getZ(i)*(r-1));
  }
  g.computeVertexNormals();
  return g;
}

function crystalRay(section:Profile,side:number,z0:number,y0:number,z1:number,y1:number){
  const length=Math.hypot(z1-z0,y1-y0),w=.008;
  const dz=-(y1-y0)/length*w,dy=(z1-z0)/length*w;
  const vertices=[sidePoint(section,side,z0+dz,y0+dy,.001),sidePoint(section,side,z0-dz,y0-dy,.001),sidePoint(section,side,z1,y1,.001),sidePoint(section,side,z0+(z1-z0)*.32,y0+(y1-y0)*.32,.014)];
  const positions:number[]=[],uv:number[]=[];
  const faces=side===1?[[0,3,1],[1,3,2],[2,3,0],[0,1,2]]:[[0,1,3],[1,2,3],[2,0,3],[0,2,1]];
  for(const face of faces)for(const i of face){positions.push(vertices[i].x,vertices[i].y,vertices[i].z);uv.push(0,0);}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}

export function approvedAcanthus(section:Profile,side:number,low=false){
  const {heights}=acanthus;
  const width=low?48:acanthus.width,height=low?96:acanthus.height;
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  const count=width*height;
  for(const raised of [true,false])for(let r=0;r<height;r++)for(let c=0;c<width;c++){
    const u=c/(width-1),v=r/(height-1),y=.105+v*1.412,z=(u-.5)*.655;
    const edge=Math.min(1,c/3,(width-1-c)/3,r/3,(height-1-r)/3);
    const sourceIndex=Math.round((1-v)*(acanthus.height-1))*acanthus.width+Math.round(u*(acanthus.width-1));
    const lift=raised?.0012+.010*heights[sourceIndex]/255*edge:.0005;
    const p=sidePoint(section,side,z,y,lift);positions.push(p.x,p.y,p.z);uv.push(u,v);
  }
  const tri=(a:number,b:number,c:number)=>{if(side===1)indices.push(a,c,b);else indices.push(a,b,c);};
  for(let r=0;r<height-1;r++)for(let c=0;c<width-1;c++){
    const a=r*width+c,b=a+1,d=a+width,e=d+1;
    tri(a,b,e);tri(a,e,d);tri(a+count,e+count,b+count);tri(a+count,d+count,e+count);
  }
  // Close each perimeter, leaving a small glass-solid volume over the shell.
  const edgePair=(a:number,b:number)=>{tri(a,a+count,b+count);tri(a,b+count,b);};
  for(let c=0;c<width-1;c++){edgePair(c,c+1);edgePair((height-1)*width+c+1,(height-1)*width+c);}
  for(let r=0;r<height-1;r++){edgePair((r+1)*width,r*width);edgePair(r*width+width-1,(r+1)*width+width-1);}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Actual raised glass, not a side photograph or a bump-only approximation. */
export function sideRelief(section: Profile, motif: Motif) {
  const parts: BufferGeometry[]=[];
  for(const side of [-1,1]){
    if(motif==='01'){
      const cy=.59;
      for(let i=0;i<20;i++){
        const angle=i/20*Math.PI*2;
        const zEnd=Math.cos(angle)*.255;
        const yEnd=cy+Math.sin(angle)*.405;
        const zStart=Math.cos(angle)*.062;
        const yStart=cy+Math.sin(angle)*.105;
        parts.push(crystalRay(section,side,zStart,yStart,zEnd,yEnd));
      }
      for(const scale of [1,1.18]){
        const points=[[0,cy+.155*scale],[.103*scale,cy],[0,cy-.155*scale],[-.103*scale,cy],[0,cy+.155*scale]].map(([z,y])=>sidePoint(section,side,z,y,.004));
        parts.push(sweep(points,.005,36));
      }
    }else{
      parts.push(approvedAcanthus(section,side));
    }
  }
  return mergeParts(parts);
}

/** A surface-hugging ornamental shoulder plate, with proper planar UVs. */
export function shoulderPlate(section: Profile, y0: number, y1: number, side=false) {
  const pos:number[]=[],uv:number[]=[],idx:number[]=[];
  const rows=20, cols=48;
  for(let r=0;r<=rows;r++){
    const v=r/rows,y=y0+(y1-y0)*v,s=section(y);
    const width=(side?s.b:s.a)*1.94;
    for(let c=0;c<=cols;c++){
      const u=c/cols,x=(u-.5)*width;
      if(side){const p=sidePoint(section,1,x,y,.003);pos.push(p.x,p.y,p.z);}
      else pos.push(x,y,frontZ(x,s)+.003);
      uv.push(u,v);
    }
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const a=r*(cols+1)+c,b=a+1,d=a+cols+1,e=d+1;
    if(side)idx.push(a,e,b,a,d,e);else idx.push(a,b,e,a,e,d);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(pos,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function diamondBoss(section: Profile, side: number) {
  const shape=new Shape();shape.moveTo(0,.158);shape.lineTo(.105,0);shape.lineTo(0,-.158);shape.lineTo(-.105,0);shape.closePath();
  const g=new ExtrudeGeometry(shape,{depth:.006,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:2,steps:1});
  const uv=g.getAttribute('uv'),p=g.getAttribute('position');
  for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+.105)/.21,(p.getY(i)+.158)/.316);
  g.rotateY(side*Math.PI/2);
  g.translate(side*(section(.59).a+.006),.59,0);
  return g;
}

/** Small metallic scrolls on the crown: geometry remains visible at glancing angles. */
export function crownScrolls(motif: Motif, bottom: number, top: number, radius: number) {
  const parts:BufferGeometry[]=[];
  const cy=bottom+(top-bottom)*.5;
  const bulb=curve([[2.425,.148],[2.45,.176],[2.535,.262],[2.62,.262],[2.69,.210],[2.73,.145],[2.742,.105]]);
  for(let side=0;side<4;side++){
    for(const mirror of [-1,1]){
      const points=[[-.01,-.04],[.035,.045],[.085,.08],[.12,.045],[.10,0],[.065,.018]].map(([u,v])=>{
        const y=cy+v*.5,x=u*mirror;
        const r=bulb(y),a=r*Math.cos(Math.PI/8),b=a*.96;
        const z=motif==='01'?(side%2===0?.168:.215):frontZ(x,{y,a,b,n:8,cut:r*(Math.cos(Math.PI/8)-Math.sin(Math.PI/8))});
        return new Vector3(x,y,z+.0015);
      });
      const g=sweep(points,.0018,28);g.rotateY(side*Math.PI/2);parts.push(g);
    }
  }
  return mergeParts(parts);
}
