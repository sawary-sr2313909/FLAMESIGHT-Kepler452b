// Original conceptual habitat geometry, shared by the live SVG renderer and
// editable Spline build. Dimensions are illustrative model units, not NASA data.
export const FINISHES = {
  hull: { color: '#596775', roughness: .62, metalness: .55 },
  frame: { color: '#bac6cf', roughness: .38, metalness: .75 },
  dark: { color: '#16232e', roughness: .7, metalness: .25 },
  deck: { color: '#354450', roughness: .8, metalness: .45 },
  insulation: { color: '#a79c84', roughness: .9, metalness: .2 },
  fabric: { color: '#b7ad91', roughness: 1, metalness: 0 },
  strap: { color: '#454b42', roughness: 1, metalness: 0 },
  cyan: { color: '#78dce3', roughness: .4, metalness: .1, emissive: true },
  white: { color: '#e4edf0', roughness: .5, metalness: .1, emissive: true },
  amber: { color: '#d2a35d', roughness: .65, metalness: .15 },
};
export const ZONE_INFO = {
  'Electrical panel': { code: 'EPS / 01', subtitle: 'Power distribution assembly', target: [-245,145,-155], label: [-260,260,-130], description: 'Service rack with circuit protection, harness routing and instrument displays. Illustrative assembly; no validated component-to-study mapping.' },
  'Ventilation system': { code: 'ECLSS / 02', subtitle: 'Air circulation & filtration', target: [15,267,-145], label: [40,355,-95], description: 'Duct manifold, filter cartridge and circulation fan. Airflow controls use only numeric values reported in the curated records.' },
  'Storage area': { code: 'STOW / 03', subtitle: 'Restrained cargo & soft goods', target: [245,103,-115], label: [260,245,-55], description: 'Framed cargo rack with fabric transport bags and restraint straps. Material selection is an illustrative research scenario.' },
  'Interior wall panel': { code: 'HULL / 04', subtitle: 'Insulated interior assembly', target: [0,122,-204], label: [0,195,-165], description: 'Removable quilted insulation panels, fasteners and service rails. Geometry and materials are conceptual, not spacecraft specifications.' },
};
export const componentFromObject = name => Object.keys(ZONE_INFO).find(zone => name === zone || name?.startsWith(`${zone}::`));

export function createCabinModel() {
  const parts = [];
  let index = 0;
  const box = (name, zone, p, size, finish, rotation = [0,0,0]) => parts.push({ id: index++, name, zone, p, size, finish, rotation, shape: 'box' });
  const cylinder = (name, zone, p, radius, length, finish, rotation = [90,0,0], segments = 16) => parts.push({ id: index++, name, zone, p, size: [radius,length,segments], finish, rotation, shape: 'cylinder' });
  const beam = (name, zone, a, b, width, finish) => {
    const d = b.map((n,i) => n-a[i]); const length = Math.hypot(...d);
    box(name,zone,a.map((n,i)=>(n+b[i])/2),[width,length,width],finish,[Math.atan2(d[2],d[1])*180/Math.PI,0,-Math.asin(d[0]/length)*180/Math.PI]);
  };
  box('Pressure deck',null,[0,-13,0],[744,22,480],'hull');
  box('Rear pressure shell',null,[0,142,-234],[744,290,16],'hull');
  box('Port pressure bulkhead',null,[-384,137,-4],[14,282,460],'hull');
  box('Port inner liner',null,[-375,137,-4],[3,266,440],'deck');
  // Repeated curved shell sections and ribs leave the front open for inspection.
  for (let x=-365; x<=365; x+=146) {
    box('Rear structural upright',null,[x,132,-216],[10,265,12],'frame');
    for(let j=0;j<8;j++) {
      const a=j*Math.PI/16, b=(j+1)*Math.PI/16;
      beam('Curved pressure rib',null,[x,255+85*Math.sin(a),-214+115*(1-Math.cos(a))],[x,255+85*Math.sin(b),-214+115*(1-Math.cos(b))],8,'frame');
    }
    box('Deck cross member',null,[x,-.5,0],[7,4,450],'frame');
  }
  for(let x=-295;x<=295;x+=118) for(let z=-130;z<=166;z+=74) {
    box('Removable deck tile',null,[x,0,z],[110,4,66],'deck');
    for(const dx of [-49,49]) for(const dz of [-27,27]) cylinder('Captive deck fastener',null,[x+dx,2.7,z+dz],1.7,1.2,'frame',[0,0,0],6);
  }
  for(const z of [-198,199]) {
    box('Deck edge rail',null,[0,5,z],[720,9,8],'dark');
    box('Deck guidance light',null,[0,10,z],[700,2,2],'cyan');
  }
  box('Overhead service spine',null,[0,307,-185],[730,15,20],'dark');
  box('Overhead lighting diffuser',null,[0,298,-168],[690,5,7],'white');
  // Hatch ring and multilayer door at the left end; ring lies in the YZ plane.
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12, b=(i+1)*Math.PI/12;
    beam('Hatch pressure ring',null,[-363,130+87*Math.sin(a),24+76*Math.cos(a)],[-363,130+87*Math.sin(b),24+76*Math.cos(b)],12,'frame');
  }
  box('Hatch door',null,[-372,130,24],[8,147,122],'deck');
  box('Hatch viewport frame',null,[-366,151,25],[7,54,55],'frame');
  box('Hatch viewport',null,[-361,151,25],[2,42,43],'dark');
  beam('Hatch handle',null,[-355,94,12],[-355,94,43],6,'amber');
  // Electrical service cabinet: rails, instrument glass, switchgear, harnesses.
  const e='Electrical panel';
  box('Equipment rack back',e,[-247,132,-205],[152,230,24],'dark');
  for(const x of [-323,-171]) box('Rack side rail',e,[x,136,-177],[7,242,46],'frame');
  for(const y of [19,250]) box('Rack cross rail',e,[-247,y,-177],[158,7,46],'frame');
  box('Instrument bezel',e,[-247,205,-179],[126,62,16],'hull');
  box('Instrument glass',e,[-247,205,-169],[112,47,3],'dark');
  for(let row=0;row<4;row++) {
    box('Instrument trace',e,[-263+row*3,219-row*9,-166.8],[57-row*7,1.3,1],'cyan');
    box('Instrument scale',e,[-202,219-row*9,-166.8],[12,2,1],'white');
  }
  for(let row=0;row<3;row++) {
    box('Breaker module',e,[-247,155-row*31,-175],[128,25,23],'hull');
    for(let col=0;col<7;col++) {
      box('Breaker switch socket',e,[-297+col*16.5,155-row*31,-160],[9,16,5],'dark');
      box('Breaker toggle',e,[-297+col*16.5,158-row*31,-155],[3,8,5],col===5?'amber':'frame');
    }
  }
  box('Cable termination tray',e,[-247,48,-173],[128,26,22],'dark');
  for(let cable=0;cable<5;cable++) for(let j=0;j<10;j++) {
    const a=j/10, b=(j+1)/10;
    beam('Service cable loom',e,[-335-cable*3+Math.sin(a*3)*8,35+a*206,-161],[-335-cable*3+Math.sin(b*3)*8,35+b*206,-161],2.5,cable===0?'amber':'dark');
  }
  for(const y of [44,90,136,182,228]) box('Harness clamp',e,[-341,y,-158],[23,5,5],'frame');
  // Ventilation manifold and replaceable filter with a visible fan assembly.
  const v='Ventilation system';
  cylinder('Supply duct',v,[-12,283,-184],21,234,'frame',[0,0,90],24);
  for(const x of [-116,-75,-34,7,48,89]) cylinder('Duct collar',v,[x,283,-184],23,4,'hull',[0,0,90],24);
  box('Filter housing',v,[10,258,-170],[196,64,53],'hull');
  box('Filter dark recess',v,[-27,258,-140],[106,48,5],'dark');
  for(let i=0;i<15;i++) box('Filter louver',v,[-73+i*6.6,258,-135],[2.5,39,7],'frame');
  cylinder('Fan housing',v,[72,258,-138],28,8,'dark');
  cylinder('Fan rim',v,[72,258,-132],25,3,'hull');
  cylinder('Fan shadow',v,[72,258,-129.5],22,1,'dark');
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5;
    box('Fan impeller',v,[72+11*Math.cos(a),258+11*Math.sin(a),-127],[21,6,2],'frame',[0,0,i*72+20]);
  }
  cylinder('Fan hub',v,[72,258,-125],6,4,'frame');
  for(const x of [-85,108]) box('Filter latch',v,[x,258,-132],[5,28,6],'amber');
  // Soft stowage in a grounded, load-bearing cargo frame.
  const s='Storage area';
  for(const x of [166,324]) for(const z of [-208,-85]) box('Stowage frame upright',s,[x,108,z],[7,214,7],'frame');
  for(const y of [7,78,149,219]) {
    box('Cargo shelf',s,[245,y,-146],[163,5,132],'hull');
    box('Cargo retaining lip',s,[245,y+6,-77],[163,12,4],'dark');
  }
  for(let row=0;row<3;row++) for(let col=0;col<2;col++) {
    const x=206+col*79, y=41+row*71;
    box('Textile transport bag',s,[x,y,-142],[68,57,108],'fabric');
    for(const dx of [-23,23]) {
      box('Fabric restraint strap',s,[x+dx,y,-86.5],[5,57,2],'strap');
      box('Top restraint strap',s,[x+dx,y+29,-142],[5,2,108],'strap');
      box('Restraint buckle',s,[x+dx,y-3,-83.5],[9,10,3],'frame');
    }
    box('Bag handle',s,[x,y+12,-83],[18,3,4],'strap');
    box('Cargo label holder',s,[x,y-14,-83],[17,7,2],'white');
  }
  // Quilted insulation has dimensional pads and intersecting stitched seams.
  const w='Interior wall panel';
  box('Removable insulation frame',w,[-15,122,-217],[167,194,12],'frame');
  for(let col=0;col<3;col++) for(let row=0;row<4;row++) {
    const x=-67+col*52,y=51+row*47;
    box('Insulation pillow',w,[x,y,-205],[48,43,12],'insulation');
    beam('Quilted seam',w,[x-21,y-18,-198],[x+21,y+18,-198],.7,'strap');
    beam('Quilted seam',w,[x-21,y+18,-197],[x+21,y-18,-197],.7,'strap');
    cylinder('Panel retaining stud',w,[x,y,-197],2,2,'frame');
  }
  for(const x of [-107,82]) box('Panel service handrail',w,[x,122,-187],[4,165,5],'amber');
  return parts;
}

export function partGeometry(part) {
  let vertices=[],faces=[];
  if(part.shape==='box') {
    const [w,h,d]=part.size.map(v=>v/2);
    vertices=[[-w,-h,-d],[w,-h,-d],[w,h,-d],[-w,h,-d],[-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d]];
    faces=[[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[3,7,6,2],[0,1,5,4]];
  } else {
    const [r,h,n]=part.size;
    for(let side=0;side<2;side++) for(let i=0;i<n;i++) vertices.push([r*Math.cos(i*2*Math.PI/n),(side-.5)*h,r*Math.sin(i*2*Math.PI/n)]);
    faces.push(Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>2*n-1-i));
    for(let i=0;i<n;i++) faces.push([i,i+n,(i+1)%n+n,(i+1)%n]);
  }
  const [rx,ry,rz]=part.rotation.map(v=>v*Math.PI/180);
  return { vertices:vertices.map(([x,y,z])=>{
    [y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];
    [x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];
    [x,y]=[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz)];
    return [x+part.p[0],y+part.p[1],z+part.p[2]];
  }),faces };
}
