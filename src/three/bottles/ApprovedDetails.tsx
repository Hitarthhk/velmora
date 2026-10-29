"use client";

import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { RepeatWrapping, SRGBColorSpace, TorusGeometry } from 'three';
import type { BottleDesign } from './designs';
import { loft } from './loft';
import { approvedAcanthus, crownScrolls, diamondBoss, mergeParts, shoulderPlate } from './ornaments';

/** Reference-specific metallic parts and raised ornamentation, all model-local. */
export function ApprovedDetails({ design, low }: { design:BottleDesign; low:boolean }){
  const id=design.id==='private-edition-i'?'01':'02';
  const paths=['neck','neck-bump','cap','cap-bump',...(id==='01'?['shoulder','shoulder-bump','seal']:['cap','cap-bump','cap'])].map(part=>`/media/textures/approved-${id}-${part}.webp?v=approved-1`);
  const [neckSource,neckBumpSource,capSource,capBumpSource,shoulderSource,shoulderBumpSource,sealMap]=useTexture(paths);
  const textures=useMemo(()=>{
    const clone=(source:typeof neckSource,repeat:number,color:boolean)=>{
      const t=source.clone();t.wrapS=RepeatWrapping;t.repeat.set(repeat,1);t.anisotropy=8;
      if(color)t.colorSpace=SRGBColorSpace;
      t.needsUpdate=true;return t;
    };
    return{neck:clone(neckSource,2,true),neckBump:clone(neckBumpSource,2,false),cap:clone(capSource,8,true),capBump:clone(capBumpSource,8,false),shoulder:clone(shoulderSource,1,true),shoulderBump:clone(shoulderBumpSource,1,false)};
  },[neckSource,neckBumpSource,capSource,capBumpSource,shoulderSource,shoulderBumpSource]);
  useEffect(()=>()=>Object.values(textures).forEach(t=>t.dispose()),[textures]);
  const geometry=useMemo(()=>{
    const c=design.construction,segments=low?48:96;
    const circular=(ys:[number,number][])=>loft(ys.map(([y,r])=>({y,a:r,b:r,n:2})),{segments});
    const rings=[];
    const rows=id==='01'?[c.neckBottom+.004,c.neckBottom+.02,c.neckTop-.02,c.neckTop-.004]:[c.neckBottom+.005,c.neckBottom+.034,c.neckBottom+.08,c.neckBottom+.12,c.neckBottom+.233,c.neckBottom+.265,c.neckTop-.026,c.neckTop-.005];
    for(const y of rows){const g=new TorusGeometry(c.neckRadius+.001,.0021,6,64);g.rotateX(Math.PI/2);g.translate(0,y,0);rings.push(g);}
    const shoulder= c.shoulder?shoulderPlate(design.section,...c.shoulder):null;
    const shoulderSide=c.shoulder?shoulderPlate(design.section,...c.shoulder,true):null;
    const crown=crownScrolls(id,c.capBottom,design.height,c.capRadius);
    return{
      neck:circular([[c.neckBottom,c.neckRadius],[c.neckTop,c.neckRadius]]),
      collar:circular([[c.collarBottom,c.collarRadius*.92],[c.collarBottom+.009,c.collarRadius],[c.collarTop-.009,c.collarRadius],[c.collarTop,c.collarRadius*.93]]),
      post:circular([[c.collarTop,c.neckRadius*.88],[c.capBottom+.014,c.neckRadius*.88]]),
      stopper:design.stopper(segments),gold:mergeParts([...rings,crown]),
      shoulder,shoulderSide,
      bossRight:id==='01'?diamondBoss(design.section,1):null,
      bossLeft:id==='01'?diamondBoss(design.section,-1):null,
    };
  },[design,id,low]);
  useEffect(()=>()=>Object.values(geometry).forEach(g=>g?.dispose()),[geometry]);
  const antique='#b99a66';
  return <>
    <mesh geometry={geometry.neck}>
      <meshPhysicalMaterial map={textures.neck} bumpMap={textures.neckBump} bumpScale={.0012} metalness={.58} roughness={.36} color="#ddd0b5" envMapIntensity={1} />
    </mesh>
    <mesh geometry={geometry.collar}>
      <meshPhysicalMaterial color={id==='01'?'#c7a970':'#8a7455'} metalness={id==='01'?.8:.25} roughness={.21} transmission={id==='02'?.28:0} thickness={.03} ior={1.5} envMapIntensity={1.1} />
    </mesh>
    <mesh geometry={geometry.post}><meshStandardMaterial color={antique} metalness={.72} roughness={.3}/></mesh>
    <mesh geometry={geometry.stopper}>
      <meshPhysicalMaterial map={textures.cap} bumpMap={textures.capBump} bumpScale={.0015} color="#d2c2a7" metalness={.52} roughness={.3} clearcoat={.35} clearcoatRoughness={.11} envMapIntensity={1.1} />
    </mesh>
    <mesh geometry={geometry.gold}><meshStandardMaterial color={antique} metalness={.78} roughness={.25} envMapIntensity={1.1}/></mesh>
    {geometry.shoulder&&[0,Math.PI].map(rotation=><mesh key={`front-${rotation}`} geometry={geometry.shoulder!} rotation-y={rotation}>
      <meshStandardMaterial map={textures.shoulder} bumpMap={textures.shoulderBump} bumpScale={.0015} metalness={.63} roughness={.38} color="#d8c9ae"/>
    </mesh>)}
    {geometry.shoulderSide&&[0,Math.PI].map(rotation=><mesh key={`side-${rotation}`} geometry={geometry.shoulderSide!} rotation-y={rotation}>
      <meshStandardMaterial map={textures.shoulder} bumpMap={textures.shoulderBump} bumpScale={.0015} metalness={.63} roughness={.38} color="#d8c9ae"/>
    </mesh>)}
    {[geometry.bossRight,geometry.bossLeft].filter(Boolean).map((g,i)=><mesh key={i} geometry={g!}>
      <meshStandardMaterial map={sealMap} color="#d5b781" metalness={.55} roughness={.38}/>
    </mesh>)}
    {id==='02'&&<AcanthusPanels design={design} low={low}/>}
  </>;
}

function AcanthusPanels({design,low}:{design:BottleDesign;low:boolean}){
  const [map,bump]=useTexture(['/media/textures/approved-02-relief.webp?v=approved-1','/media/textures/approved-02-relief-bump.webp?v=approved-1']);
  useMemo(()=>{map.colorSpace=SRGBColorSpace;map.anisotropy=16;},[map]);
  const geometry=useMemo(()=>[-1,1].map(side=>approvedAcanthus(design.section,side,low)),[design,low]);
  useEffect(()=>()=>geometry.forEach(g=>g.dispose()),[geometry]);
  return <>{geometry.map((g,i)=><mesh key={i} geometry={g} renderOrder={2.5}>
    <meshPhysicalMaterial map={map} bumpMap={bump} bumpScale={.0018} transparent opacity={.92} alphaTest={.015} depthWrite={false} metalness={0} roughness={.15} ior={1.52} clearcoat={.35} clearcoatRoughness={.07} specularIntensity={1} envMapIntensity={1.1}/>
  </mesh>)}</>;
}
