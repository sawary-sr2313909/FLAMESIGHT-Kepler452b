import { createCabinModel, partGeometry, FINISHES } from '../src/cabinModel.js';

// Generates bounded Spline DSL passes from the same original geometry as React.
// Paste a pass only into the connected Spline editor, never a production shell.
const prefix = `${createCabinModel.toString()}\n${partGeometry.toString()}\nconst FINISHES=${JSON.stringify(FINISHES)};\n`;
const build = zone => prefix + `
const parts=createCabinModel().filter(p=>${zone ? `p.zone===${JSON.stringify(zone)}` : '!p.zone'});
const finishes=[...new Set(parts.map(p=>p.finish))];
for(const finish of finishes){
 const vertices=[];
 const indices=[];
 for(const part of parts.filter(p=>p.finish===finish)){
  const geom=partGeometry(part);
  const offset=vertices.length/3;
  for(const vertex of geom.vertices) vertices.push(...vertex);
  for(const face of geom.faces) for(let i=1;i<face.length-1;i++) indices.push(offset+face[0],offset+face[i],offset+face[i+1]);
 }
 customMesh({vertices,indices});
 color(FINISHES[finish].color);
 shading({category:'physical',roughness:FINISHES[finish].roughness,metalness:FINISHES[finish].metalness,flatShading:true});
 ${zone ? "addEvent('MouseDown');\n addEvent('MouseHover');" : ''}
 rename(${JSON.stringify(zone || 'Habitat structure')}+'::'+finish);
}
`;
const scripts = [
  "select(o=>o.isMesh || o.type==='Empty');\nremove();\nbackground('#080f19');\n" + build(null),
  build('Electrical panel') + build('Ventilation system'),
  build('Storage area') + build('Interior wall panel'),
];
// Separate scopes keep each pass independent and make each subsystem editable.
scripts[1] = `{\n${build('Electrical panel')}\n}\n{\n${build('Ventilation system')}\n}`;
scripts[2] = `{\n${build('Storage area')}\n}\n{\n${build('Interior wall panel')}\n}`;
scripts.push(`
select(o=>o.isLight || o.name==='Inspection camera');
remove();
light('Directional',{intensity:2.4,color:'#d8e7ee',shadows:true,shadowResolution:2048});
position({x:-300,y:700,z:700});
rename('Inspection key');
light('Directional',{intensity:1.0,color:'#79c3d5'});
position({x:500,y:400,z:-100});
rename('Cool equipment rim');
select(o=>o.isMesh);
shadows({cast:true,receive:true});
select(o=>o.name.endsWith('::cyan'));
shading({category:'phong',emissive:'#78dce3'});
select('Habitat structure::white');
shading({category:'phong',emissive:'#9bdae0'});
environment({ao:true,ambient:{color:'#c6d9e5',intensity:1.05}});
const yaw=18*Math.PI/180;
const pitch=25*Math.PI/180;
const dx=Math.sin(yaw)*Math.cos(pitch);
const dy=Math.sin(pitch);
const dz=Math.cos(yaw)*Math.cos(pitch);
add('PerspectiveCamera',undefined,{fov:35,near:1,far:10000});
position({x:dx*1050,y:145+dy*1050,z:dz*1050});
rotation({x:Math.atan2(-dy,dz)*180/Math.PI,y:Math.asin(dx)*180/Math.PI,z:Math.atan2(dx*dy,dz)*180/Math.PI});
rename('Inspection camera');
setPlayCamera('Inspection camera');
playControls('none');
select(o=>o.isMesh);
focus();
lookFrom({azimuth:18,elevation:25});
`);
process.stdout.write(JSON.stringify(scripts));
