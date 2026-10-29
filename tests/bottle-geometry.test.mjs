import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const require = createRequire(import.meta.url), modules = new Map();
function load(path) {
  if (modules.has(path)) return modules.get(path).exports;
  const module = { exports: {} }; modules.set(path, module);
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop:true } }).outputText;
  new Function('require', 'module', 'exports', js)(id => id.endsWith('.json') ? require(resolve(dirname(path),id)) : id.startsWith('.') ? load(resolve(dirname(path), `${id}.ts`)) : require(id), module, module.exports);
  return module.exports;
}
const { privateEdition: signature, vaultSeries: reserve } = load(resolve('src/three/bottles/designs.ts'));
const { frontPatch,frontZ } = load(resolve('src/three/bottles/loft.ts'));
const { approvedAcanthus } = load(resolve('src/three/bottles/ornaments.ts'));

function volume(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const p = g.getAttribute('position'); let value = 0;
  for (let i = 0; i < p.count; i += 3) {
    const ax=p.getX(i), ay=p.getY(i), az=p.getZ(i);
    const bx=p.getX(i+1), by=p.getY(i+1), bz=p.getZ(i+1);
    const cx=p.getX(i+2), cy=p.getY(i+2), cz=p.getZ(i+2);
    value += (ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
  }
  if(g!==geometry)g.dispose();
  return value;
}

test('Approved 01 and 02 retain their different reference silhouettes and neck proportions', () => {
  assert.ok(signature.width / signature.height > reserve.width / reserve.height * 1.15);
  assert.ok(Math.abs(signature.section(.25).a-signature.section(1).a)<.01,'01 must keep its approved straight-sided rectangular body');
  assert.ok(reserve.section(.099).a>reserve.section(.551).a*1.06,'02 must flare into its approved foot');
  assert.ok(reserve.section(1.341).a>reserve.section(.551).a*1.12,'02 must retain the rounded upper body and gentle waist');
  assert.ok(reserve.construction.neckTop-reserve.construction.neckBottom>(signature.construction.neckTop-signature.construction.neckBottom)*2.5);
  assert.equal(signature.height, 1.746); assert.equal(reserve.height, 2.742);
});

test('Approved artwork remains mapped to its own edition, on both front and back',()=>{
  assert.match(signature.label.src,/approved-01-label/);assert.match(signature.backLabel.src,/approved-01-back/);
  assert.match(reserve.label.src,/approved-02-label/);assert.match(reserve.backLabel.src,/approved-02-back/);
  assert.ok(signature.backLabel.y1<signature.label.y1-.2,'01 back label must retain its lower placement');
});

test('02 acanthus panels contain real mirrored relief, with a lighter mobile geometry tier',()=>{
  const high=approvedAcanthus(reserve.section,1),other=approvedAcanthus(reserve.section,-1),low=approvedAcanthus(reserve.section,1,true);
  try{
    const p=high.getAttribute('position'),q=other.getAttribute('position');let rise=0;
    assert.ok(p.count>low.getAttribute('position').count*3);
    for(let i=0;i<p.count;i++){
      assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));
      assert.ok(Math.abs(p.getX(i)+q.getX(i))<1e-6);
      const s=reserve.section(p.getY(i));rise=Math.max(rise,p.getX(i)-frontZ(p.getZ(i),{...s,a:s.b,b:s.a}));
    }
    assert.ok(rise>.003,'Reference relief must rise above the side glass, rather than being a flat decal');
  }finally{high.dispose();other.dispose();low.dispose();}
});

for(const design of [signature,reserve]){
  test(`${design.id}: glass encloses a cavity and a heavy base, rather than a solid glass block`,()=>{
    const glass=design.glass(96), liquid=design.liquid(96), cap=design.stopper(96);
    try{
      for(const g of [glass,liquid,cap]){
        assert.ok([...g.getAttribute('position').array].every(Number.isFinite));
        assert.ok(volume(g)>0,'Surface winding must face out of the enclosed material');
        g.computeBoundingBox();
        assert.ok(g.boundingBox.min.y>=-1e-6);
        assert.ok(g.boundingBox.max.y<=design.height+1e-6);
        assert.ok(g.boundingBox.max.x-g.boundingBox.min.x<=design.width+1e-6,`Physical width ${g.boundingBox.max.x-g.boundingBox.min.x} exceeds frame width ${design.width}`);
      }
      const ratio=volume(glass)/volume(liquid);
      assert.ok(ratio>.1&&ratio<.9,`Unbelievable glass-to-liquid volume: ${ratio}`);
      assert.ok(liquid.boundingBox.min.y>design.construction.floor);
      assert.ok(liquid.boundingBox.max.y<design.construction.mouth-.1,'Headspace must remain below the closure');
      const p=liquid.getAttribute('position');
      for(let i=0;i<p.count;i++){
        const s=design.section(p.getY(i)), wall=design.construction.wall;
        assert.ok(Math.abs(p.getX(i))<s.a-wall+.0001);
        assert.ok(Math.abs(p.getZ(i))<s.b-wall+.0001);
        if(s.cut!==undefined)assert.ok(Math.abs(p.getX(i))+Math.abs(p.getZ(i))<s.a+s.b-s.cut-wall*.8);
        else assert.ok(Math.pow(Math.abs(p.getX(i))/s.a,s.n)+Math.pow(Math.abs(p.getZ(i))/s.b,s.n)<1);
      }
    }finally{glass.dispose();liquid.dispose();cap.dispose();}
  });
  for(const [face,placement] of [['front',design.label],['back',design.backLabel]])test(`${design.id}: approved ${face} label follows the glass without floating or clipping`,()=>{
    const patch=frontPatch(design.section,placement);
    try{
      const p=patch.getAttribute('position'), n=patch.getAttribute('normal'), uv=patch.getAttribute('uv');
      for(let i=0;i<p.count;i++){
        const s=design.section(p.getY(i));
        assert.ok(Math.abs(p.getX(i))<s.a-(s.cut??0),'Label crosses the silhouette');
        assert.ok(Math.abs(p.getZ(i)-(frontZ(p.getX(i),s)+placement.offset))<1e-6,'Label floats away from or penetrates glass');
        assert.ok(n.getZ(i)>.8,'Type wraps too far around the side to remain readable');
        assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1);
      }
    }finally{patch.dispose();}
  });
}
