import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Minus, Plus, Maximize2, MousePointer2, Box, Crosshair } from 'lucide-react';
import { COMPONENTS } from './evidenceCoverage';
import { componentFromObject, createCabinModel, FINISHES, partGeometry, ZONE_INFO } from './cabinModel';
import './CabinViewer.css';

const Spline = lazy(() => import('@splinetool/react-spline'));
export const SPLINE_SCENE = 'https://prod.spline.design/p9Rt6i6nDuN8Nmkj/scene.splinecode';
const MODEL = createCabinModel().map(part => ({...part,...partGeometry(part)}));
const radians = deg => deg*Math.PI/180;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onFailure('The 3D scene could not load. Detailed interactive fallback is active.'); }
  render() { return this.state.failed ? null : this.props.children; }
}

function tint(hex,amount) {
  const n=parseInt(hex.slice(1),16);
  return `rgb(${[16,8,0].map(shift => clamp(Math.round(((n>>shift)&255)*amount),0,255)).join(',')})`;
}

// Split broad supporting surfaces so painter ordering cannot hide nearby detail.
function surfacePatches(points) {
  if(points.length!==4)return [points];
  const [a,b,,d]=points;
  const columns=Math.ceil(Math.hypot(...b.map((v,i)=>v-a[i]))/45);
  const rows=Math.ceil(Math.hypot(...d.map((v,i)=>v-a[i]))/45);
  const at=(u,v)=>a.map((n,i)=>n+(b[i]-n)*u+(d[i]-n)*v);
  const patches=[];
  for(let x=0;x<columns;x++)for(let y=0;y<rows;y++)patches.push([at(x/columns,y/rows),at((x+1)/columns,y/rows),at((x+1)/columns,(y+1)/rows),at(x/columns,(y+1)/rows)]);
  return patches;
}

// Real model geometry projected to SVG. No raster backdrop or flat placeholder.
function ProjectedCabin({selected,scanning,yaw,pitch,zoom,focus,onSelect}) {
  const projection = useMemo(() => {
    const a=radians(yaw), b=radians(pitch);
    return ([x,y,z]) => {
      const u=x*Math.cos(a)-z*Math.sin(a), depth=x*Math.sin(a)+z*Math.cos(a);
      return [500+u,330-(y-120)*Math.cos(b)+depth*Math.sin(b),depth*Math.cos(b)+(y-120)*Math.sin(b)];
    };
  },[yaw,pitch]);
  const faces = useMemo(() => MODEL.flatMap(part => {
    return part.faces.flatMap((indices,faceIndex)=>{
      return surfacePatches(indices.map(i=>part.vertices[i])).flatMap((world,patchIndex)=>{
      const pts=world.map(projection);
      const [a,b,c]=pts;
      if((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>=0) return [];
      const [v1,v2,v3]=world;
      const u=v2.map((n,i)=>n-v1[i]),v=v3.map((n,i)=>n-v1[i]);
      const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const len=Math.hypot(...normal)||1;
      const light=.51+Math.max(0,(normal[0]*-.3+normal[1]*.8+normal[2]*.65)/len)*.65;
      return [{key:`${part.id}-${faceIndex}-${patchIndex}`,zone:part.zone,finish:part.finish,light,depth:pts.reduce((s,p)=>s+p[2],0)/pts.length,points:pts.map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')}];
      });
    });
  }).sort((a,b)=>a.depth-b.depth),[projection]);
  const target=focus?projection(ZONE_INFO[selected].target):[500,330];
  const scale=zoom*(focus?1.16:1);
  const transform=`translate(${500-target[0]*scale} ${330-target[1]*scale}) scale(${scale})`;
  return <svg className="projected-cabin" viewBox="0 0 1000 640" aria-label="Interactive detailed spacecraft cabin cutaway">
    <defs>
      <radialGradient id="deck-shadow"><stop stopColor="#000" stopOpacity=".8"/><stop offset="1" stopColor="#000" stopOpacity="0"/></radialGradient>
      <pattern id="fabric-weave" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 0h3M0 0v3" stroke="#3d3529" strokeWidth=".45" opacity=".3"/></pattern>
      <linearGradient id="scan-light"><stop stopColor="#a2fff5" stopOpacity="0"/><stop offset=".5" stopColor="#a2fff5" stopOpacity=".7"/><stop offset="1" stopColor="#a2fff5" stopOpacity="0"/></linearGradient>
      <clipPath id="selected-scan-mask">{faces.filter(f=>f.zone===selected).map(f=><polygon key={f.key} points={f.points}/>)}</clipPath>
    </defs>
    <ellipse cx="500" cy="526" rx="420" ry="90" fill="url(#deck-shadow)"/>
    <g className="projected-model" transform={transform}>
      {faces.map(face => <polygon key={face.key} data-zone={face.zone || undefined} points={face.points}
        fill={tint(FINISHES[face.finish].color,face.light)} stroke={face.zone===selected?'#87dce0':'#172532'} strokeWidth={face.zone===selected?'.55':'.25'}
        className={face.zone?'model-part':''} onClick={face.zone?()=>onSelect(face.zone):undefined}>
        {face.zone && <title>{face.zone}</title>}
      </polygon>)}
      {faces.filter(f=>f.finish==='fabric').map(f=><polygon key={`weave-${f.key}`} points={f.points} fill="url(#fabric-weave)" pointerEvents="none"/>)}
      {scanning && <g clipPath="url(#selected-scan-mask)"><rect className="component-scan" x="50" y="50" width="900" height="110" fill="url(#scan-light)"/></g>}
      {COMPONENTS.map((zone,i)=>{
        const p=projection(ZONE_INFO[zone].label);
        return <g key={zone} role="button" tabIndex="0" aria-label={`Select ${zone}`} aria-pressed={zone===selected}
          onClick={()=>onSelect(zone)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(zone);}}}
          className={`projected-pin ${zone===selected?'active':''}`} transform={`translate(${p[0]},${p[1]})`}>
          <circle r="13"/><text textAnchor="middle" y="4">0{i+1}</text>
        </g>;
      })}
    </g>
  </svg>;
}

function SplineScan({selected,view,aspect}) {
  const a=radians(view.yaw),b=radians(view.pitch);
  const focus=view.focus?ZONE_INFO[selected].target:[0,145,-20];
  const target=view.focus?focus.map((v,i)=>v*(i===1?.7:.62)):focus;
  const distance=(view.focus?870:1080)*Math.max(1,1.5/aspect)/view.zoom;
  const height=1000/aspect, focal=height/(2*Math.tan(radians(17.5)));
  const project=vertex=>{
    const [x,y,z]=vertex.map((n,i)=>n-target[i]);
    const across=x*Math.cos(a)-z*Math.sin(a),along=x*Math.sin(a)+z*Math.cos(a);
    const depth=Math.max(1,distance-along*Math.cos(b)-y*Math.sin(b));
    return [500+across*focal/depth,height/2-(y*Math.cos(b)-along*Math.sin(b))*focal/depth];
  };
  const polygons=MODEL.filter(part=>part.zone===selected).flatMap(part=>part.faces.map(face=>face.map(i=>project(part.vertices[i]))));
  const points=polygons.flat(),top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
  return <svg className="spline-scan-overlay" viewBox={`0 0 1000 ${height}`} aria-hidden="true">
    <defs><clipPath id="spline-component-mask">{polygons.map((polygon,i)=><polygon key={i} points={polygon.map(p=>p.join(',')).join(' ')}/>)}</clipPath><linearGradient id="spline-scan-gradient" x2="0" y2="1"><stop stopColor="#84ffe7" stopOpacity="0"/><stop offset="1" stopColor="#a9fff0" stopOpacity=".65"/></linearGradient></defs>
    <g clipPath="url(#spline-component-mask)"><g className="spline-scan-band" style={{'--sweep-distance':`${bottom-top+45}px`}}><rect x="0" y={top-45} width="1000" height="45" fill="url(#spline-scan-gradient)"/><path d={`M0 ${top}H1000`} stroke="#bffff1" strokeWidth="2"/></g></g>
  </svg>;
}

export default function CabinViewer({selected,onSelect,scanning}) {
  const [mode,setMode]=useState('spline');
  const [loaded,setLoaded]=useState(false);
  const [message,setMessage]=useState('');
  const [view,setView]=useState({yaw:18,pitch:25,zoom:1,focus:false});
  const [hover,setHover]=useState('');
  const [aspect,setAspect]=useState(1.7);
  const app=useRef(null), camera=useRef(null), pointer=useRef(null), host=useRef(null), selectRef=useRef(onSelect);
  useEffect(()=>{selectRef.current=onSelect;},[onSelect]);
  useEffect(()=>{
    const stage=host.current?.querySelector('.habitat-stage');
    if(!stage)return;
    const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;if(height){setAspect(width/height);app.current?.setSize(width,height);}});
    observer.observe(stage);return ()=>observer.disconnect();
  },[]);
  const fail=useCallback(reason=>{app.current=null;camera.current=null;setMode('fallback');setLoaded(false);setMessage(reason);},[]);
  useEffect(()=>{
    if(mode!=='spline'||loaded) return;
    const timer=setTimeout(()=>fail('3D loading timed out. Detailed interactive fallback is active.'),22000);
    return ()=>clearTimeout(timer);
  },[mode,loaded,fail]);
  const handleSelect=useCallback(zone=>{selectRef.current(zone);setView(v=>({...v,focus:true}));},[]);
  const splineSelection=useCallback(event=>{const zone=componentFromObject(event.target.name);if(zone)handleSelect(zone);},[handleSelect]);
  const splineHover=useCallback(event=>setHover(componentFromObject(event.target.name)||''),[]);
  const onLoad=useCallback(runtime=>{
    const cam=runtime.findObjectByName('Inspection camera');
    if(!cam) {fail('The scene is missing its inspection camera. Detailed fallback is active.');return;}
    app.current=runtime;camera.current=cam;
    const stage=host.current?.querySelector('.habitat-stage');
    if(stage)runtime.setSize(stage.clientWidth,stage.clientHeight);
    runtime.setBackgroundColor('#0b121b');
    setLoaded(true);setMessage('');
  },[fail]);
  useEffect(()=>{
    if(!loaded||!camera.current) return;
    const cam=camera.current;
    const focus=view.focus?ZONE_INFO[selected].target:[0,145,-20];
    const target=view.focus?focus.map((v,i)=>v*(i===1?.7:.62)):[...focus];
    const yaw=radians(view.yaw),pitch=radians(view.pitch),distance=(view.focus?870:1080)*Math.max(1,1.5/aspect)/view.zoom;
    const dx=Math.sin(yaw)*Math.cos(pitch),dy=Math.sin(pitch),dz=Math.cos(yaw)*Math.cos(pitch);
    const end=[target[0]+dx*distance,target[1]+dy*distance,target[2]+dz*distance];
    const rotation=[Math.atan2(-dy,dz),Math.asin(dx),Math.atan2(dx*dy,dz)];
    const start=[cam.position.x,cam.position.y,cam.position.z];
    const startR=[cam.rotation.x,cam.rotation.y,cam.rotation.z];
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame; const t0=performance.now();
    const tick=t=>{
      const p=reduced?1:Math.min(1,(t-t0)/(pointer.current?80:650)),ease=1-Math.pow(1-p,3);
      ['x','y','z'].forEach((axis,i)=>{cam.position[axis]=start[i]+(end[i]-start[i])*ease;cam.rotation[axis]=startR[i]+(rotation[i]-startR[i])*ease;});
      if(p<1)frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[loaded,selected,view,aspect]);
  useEffect(()=>{
    if(!loaded||!app.current)return;
    const runtime=app.current;
    let frame;const start=performance.now();
    const tick=t=>{
      runtime.getAllObjects().forEach(object=>{
        const zone=componentFromObject(object.name);if(!zone)return;
        const finish=object.name.split('::')[1],base=FINISHES[finish];if(!base)return;
        const active=zone===selected;
        object.color=active?(scanning?(Math.sin((t-start)/110)>.2?'#d1fff6':'#52b9cc'):['hull','frame','dark'].includes(finish)?'#6293a2':base.color):base.color;
      });
      if(scanning)frame=requestAnimationFrame(tick);
    };
    tick(start);return ()=>cancelAnimationFrame(frame);
  },[loaded,selected,scanning]);
  useEffect(()=>{
    if(!loaded||!scanning||!app.current)return;
    const runtime=app.current;
    const vertices=MODEL.filter(part=>part.zone===selected).flatMap(part=>part.vertices);
    const min=[0,1,2].map(axis=>Math.min(...vertices.map(v=>v[axis])));
    const max=[0,1,2].map(axis=>Math.max(...vertices.map(v=>v[axis])));
    let cancelled=false,beam,frame;
    runtime.createObject('Cube',{
      name:'Evidence retrieval scan',width:max[0]-min[0]+12,height:2,depth:max[2]-min[2]+12,
      position:[(max[0]+min[0])/2,min[1],(max[2]+min[2])/2],
      material:{color:'#a6fff0',alpha:.45,roughness:.3},castShadow:false,receiveShadow:false,
    }).then(object=>{
      if(cancelled){runtime.removeObject(object);return;}
      beam=object;const t0=performance.now();
      const tick=t=>{beam.position.y=min[1]+((t-t0)%1600)/1600*(max[1]-min[1]);frame=requestAnimationFrame(tick);};
      frame=requestAnimationFrame(tick);
    }).catch(()=>{/* The highlighted component and retrieval status remain available. */});
    return ()=>{cancelled=true;cancelAnimationFrame(frame);if(beam)runtime.removeObject(beam);};
  },[loaded,selected,scanning]);
  const updateZoom=delta=>setView(v=>({...v,zoom:clamp(v.zoom+delta,.65,1.8)}));
  useEffect(()=>{
    const stage=host.current?.querySelector('.habitat-stage');
    if(!stage)return;
    const wheel=e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();setView(v=>({...v,zoom:clamp(v.zoom+(e.deltaY>0?-.035:.035),.65,1.8)}));};
    const lost=()=>fail('The graphics context was lost. Detailed interactive fallback is active.');
    stage.addEventListener('wheel',wheel,{passive:false});
    stage.addEventListener('webglcontextlost',lost,true);
    return ()=>{stage.removeEventListener('wheel',wheel);stage.removeEventListener('webglcontextlost',lost,true);};
  },[fail]);
  const reset=()=>setView({yaw:18,pitch:25,zoom:1,focus:false});
  const info=ZONE_INFO[selected];
  return <div className={`habitat-viewer ${scanning?'is-scanning':''}`} ref={host}>
    <div className="viewer-topline"><span><i/> ORBITAL HABITAT <b>/</b> CUTAWAY 01</span><span>{mode==='spline'?(loaded?'LIVE 3D · SPLINE':'LOADING 3D'):'INTERACTIVE 2.5D'}</span></div>
    <div className="habitat-stage" data-renderer={mode} data-selected={selected}
      onPointerDownCapture={e=>{if(e.target.closest('button,input'))return;pointer.current={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch};}}
      onPointerMove={e=>{const p=pointer.current;if(!p||!e.buttons)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;if(Math.abs(dx)+Math.abs(dy)>4)setView(v=>({...v,yaw:p.yaw+dx*.22,pitch:clamp(p.pitch+dy*.16,8,65)}));}}
      onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onPointerLeave={()=>{pointer.current=null;setHover('');}}
      >
      {mode==='spline' && <SceneBoundary onFailure={fail}><Suspense fallback={null}><Spline scene={SPLINE_SCENE} onLoad={onLoad} onSplineMouseDown={splineSelection} onSplineMouseHover={splineHover} htmlContentMode="none" renderOnDemand className="spline-cabin"/></Suspense></SceneBoundary>}
      {mode==='fallback' && <ProjectedCabin selected={selected} scanning={scanning} {...view} onSelect={handleSelect}/>}
      {mode==='spline' && loaded && scanning && <SplineScan selected={selected} view={view} aspect={aspect}/>}
      {mode==='spline' && !loaded && <div className="scene-loading"><span className="loading-orbit"/>Loading orbital habitat…</div>}
      {hover && mode==='spline' && <div className="viewer-hover"><MousePointer2 size={12}/>{hover}</div>}
      {scanning && <div className="scan-reticle"><span/><span/><span/><span/><b>RETRIEVING CURATED EVIDENCE</b></div>}
      <div className="viewer-axis" aria-hidden="true"><span>Y</span><span>Z</span><span>X</span></div>
    </div>
    <div className="viewer-tools"><span><MousePointer2 size={13}/> Drag to orbit · scroll to zoom</span><div>
      <button aria-label="Zoom out" onClick={()=>updateZoom(-.12)}><Minus size={16}/></button>
      <output aria-label="View magnification">{Math.round(view.zoom*100)}%</output>
      <button aria-label="Zoom in" onClick={()=>updateZoom(.12)}><Plus size={16}/></button>
      <button aria-label="Focus selected component" onClick={()=>setView(v=>({...v,focus:true}))}><Crosshair size={16}/></button>
      <button aria-label="Reset cabin view" onClick={reset}><RotateCcw size={15}/></button>
      <button aria-label="Toggle detailed fallback" aria-pressed={mode==='fallback'} onClick={()=>{setMode(mode==='fallback'?'spline':'fallback');setLoaded(false);setMessage('');}}><Box size={15}/></button>
      <button aria-label="Expand cabin viewer" onClick={()=>host.current?.requestFullscreen?.().catch(()=>setMessage('Fullscreen is unavailable in this browser.'))}><Maximize2 size={15}/></button>
    </div></div>
    <label className="viewer-orbit-control">ORBIT / <input type="range" aria-label="Orbit cabin horizontally" min="-180" max="180" value={((view.yaw+180)%360+360)%360-180} onChange={e=>setView(v=>({...v,yaw:Number(e.target.value)}))}/><output>{Math.round(((view.yaw+180)%360+360)%360-180)}°</output></label>
    <div className="viewer-selection"><span className="selection-number">0{COMPONENTS.indexOf(selected)+1}</span><div><span className="instrument-label">{info.code} / SELECTED SYSTEM</span><strong>{selected}</strong><small>{info.subtitle}</small></div><span className="concept-label">ILLUSTRATIVE CONCEPT<br/>NOT A VERIFIED SPACECRAFT DESIGN</span></div>
    {message && <p className="viewer-message" role="status">{message}</p>}
    <div className="viewer-accessible" aria-label="Accessible component selection">{COMPONENTS.map(zone=><button key={zone} onClick={()=>handleSelect(zone)} aria-pressed={selected===zone}>Inspect {zone}</button>)}</div>
  </div>;
}
