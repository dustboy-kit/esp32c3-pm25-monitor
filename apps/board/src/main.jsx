import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { boardLesson as lesson } from '../lessons/board.js';
import './style.css';

function BoardModel({pm,noData,selected,setSelected}) {
  const ledColor = noData ? lesson.missingColor.color : pm <= 25 ? '#16a34a' : pm <= 50 ? '#eab308' : '#dc2626';
  const box = (size, position, color, key, rotation) => <mesh key={key} position={position} rotation={rotation}><boxGeometry args={size}/><meshStandardMaterial color={color}/></mesh>;
  const part=(id,pos,children,labelY=.8)=>{
    const active=selected===id, dim=selected&&selected!==id;
    return <group key={id} position={pos} onClick={e=>{e.stopPropagation();setSelected(id)}}>
      <group>{children}</group>
      {dim&&<mesh position={[0,.02,0]}><boxGeometry args={id==='board'?[2.22,.19,1.47]:id==='sensor'?[1.58,.7,1.11]:[1.43,.17,1.0]}/><meshBasicMaterial color="#020617" transparent opacity={.62} depthWrite={false}/></mesh>}
      {active&&<mesh position={[0,.08,0]}><boxGeometry args={id==='board'?[2.24,.2,1.5]:id==='sensor'?[1.62,.72,1.15]:[1.47,.18,1.03]}/><meshBasicMaterial color="#facc15" wireframe/></mesh>}
      <Html position={[id==='led'?-.45:0,labelY,0]} center distanceFactor={6} zIndexRange={[20,0]}><span className={`part-label rounded px-1.5 py-0.5 ${active?'bg-amber-300 text-slate-950':'bg-slate-950/90 text-white'}`}>{({board:'ESP32-C3',sensor:'PMS7003',oled:'OLED',led:'LED'})[id]}</span></Html>
    </group>;
  };
  const wireData=lesson.wires.map((w,i)=>{const start=new THREE.Vector3(...lesson.parts.find(p=>p.id===w.from).position),end=new THREE.Vector3(...lesson.parts.find(p=>p.id===w.to).position);start.y+=i*.018;end.y+=(i%3)*.08;const mid=start.clone().lerp(end,.5);mid.y+=.42;return {w,curve:new THREE.QuadraticBezierCurve3(start,mid,end)}});
  return <>
    {part('board',lesson.parts.find(p=>p.id==='board').position,<>{box([2.1,.16,1.35],[0,0,0],'#087f5b','pcb')}{box([.56,.22,.5],[.43,.12,0],'#111827','chip')}{box([.42,.2,.38],[-.38,.13,0],'#334155','chip2')}{box([.33,.25,.2],[-.94,.11,0],'#94a3b8','usb')}{[-.8,-.55,-.3,-.05,.2,.45,.7,.95].flatMap((x,i)=>[-.62,.62].map((z,j)=><mesh key={`pin-${i}-${j}`} position={[x,-.13,z]}><cylinderGeometry args={[.035,.035,.35,8]}/><meshStandardMaterial color="#cbd5e1"/></mesh>))}</>,1.03)}
    {part('sensor',lesson.parts.find(p=>p.id==='sensor').position,<>{box([1.5,.65,1.05],[0,0,0],'#dbe3ea','sensorbox')}{box([1.25,.1,.82],[0,.38,0],'#94a3b8','lid')}{[-.45,-.23,0,.23,.45].map((x,i)=>box([.035,.025,.56],[x,.44,0],'#334155',`grille-${i}`,[0,0,.15]))}<mesh position={[0,.47,0]}><cylinderGeometry args={[.19,.19,.025,24]}/><meshStandardMaterial color="#1e293b"/></mesh></>,.72)}
    {part('oled',lesson.parts.find(p=>p.id==='oled').position,<>{box([1.35,.13,.92],[0,0,0],'#111827','oledcase')}<mesh position={[0,.1,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.08,.58]}/><meshBasicMaterial color="#07111c"/></mesh><Html position={[0,.15,0]} center transform distanceFactor={5}><div className="whitespace-nowrap rounded bg-slate-950 px-2 py-1 font-mono text-xs font-bold text-emerald-300">PM2.5 {pm}</div></Html></>,.88)}
    {part('led',lesson.parts.find(p=>p.id==='led').position,<>{box([.4,.16,.4],[0,0,0],'#334155','ledbase')}<mesh position={[0,.18,0]}><sphereGeometry args={[.28,24,16]}/><meshStandardMaterial color={ledColor} emissive={ledColor} emissiveIntensity={2}/></mesh></>,1.35)}
    {wireData.map(({w,curve},i)=>{const highlighted=selected&&(w.from===selected||w.to===selected);const dim=selected&&!highlighted;return <mesh key={`wire-${i}`}><tubeGeometry args={[curve,24,.035,8,false]}/><meshStandardMaterial color={w.color} emissive={w.color} emissiveIntensity={highlighted?.9:dim?0:.18} transparent={!!dim} opacity={dim?.17:1}/></mesh>})}
  </>;
}
function CameraFit(){const {camera,size}=useThree();useEffect(()=>{camera.position.set(...(size.width<640?[4.0,3.9,6.4]:[2.9,2.8,4.7]));camera.fov=size.width<640?64:42;camera.lookAt(0,.05,0);camera.updateProjectionMatrix()},[camera,size.width]);return null}
function Viewer({pm,noData,selected,setSelected}) {return <div id="viewer" className="h-[350px] overflow-hidden rounded-2xl bg-slate-900 touch-none sm:h-[430px]"><Canvas dpr={[1,2]} camera={{position:[2.9,2.8,4.7],fov:42}}><CameraFit/><color attach="background" args={['#101820']}/><hemisphereLight args={['#ffffff','#334155',2]}/><directionalLight position={[4,7,5]} intensity={3}/><BoardModel pm={pm} noData={noData} selected={selected} setSelected={setSelected}/><OrbitControls autoRotate autoRotateSpeed={.7} enableDamping/></Canvas></div>}
function WiringSvg(){
 const sensors=lesson.wires.filter(w=>w.from==='sensor');
 const oleds=lesson.wires.filter(w=>w.from==='oled');
 const leds=lesson.wires.filter(w=>w.from==='led');
 const boardX={left:350,right:810};
 const leftY=Object.fromEntries(sensors.map((w,i)=>[w.boardPin,132+i*32]));
 return <div className="diagram-wrap max-w-full overflow-x-auto"><svg className="wire-svg min-w-[900px] w-full" viewBox="0 0 1200 440" role="img" aria-label="ภาพการต่อสาย DustBoy Kit">
  <rect width="1200" height="440" fill="white"/>
  <rect x="350" y="90" width="460" height="270" rx="14" fill="#e2e8f0" stroke="#334155" strokeWidth="2"/><text x="580" y="116" textAnchor="middle" className="part-label">ESP32-C3 SuperMini</text>
  <rect x="28" y="105" width="200" height="230" rx="12" fill="#f1f5f9" stroke="#334155" strokeWidth="2"/><text x="128" y="88" textAnchor="middle" className="part-label">PMS7003</text>
  <rect x="922" y="78" width="220" height="166" rx="12" fill="#f1f5f9" stroke="#334155" strokeWidth="2"/><text x="1032" y="62" textAnchor="middle" className="part-label">OLED</text>
  <rect x="922" y="258" width="220" height="112" rx="12" fill="#f1f5f9" stroke="#334155" strokeWidth="2"/><text x="1084" y="280" textAnchor="middle" className="part-label">LED</text><circle cx="1084" cy="329" r="22" fill="#86efac" stroke="#334155" strokeWidth="2"/>
  {sensors.map((w,i)=>{const y=132+i*32;return <g key={`sensor-${i}`}><path d={`M228 ${y}H${boardX.left}`} fill="none" stroke={w.color} strokeWidth="3.5"/><circle cx="228" cy={y} r="4" fill={w.color}/><circle cx={boardX.left} cy={y} r="4" fill={w.color}/><text x="42" y={y+5} className="svg-pin">{w.fromPin}</text><text x="365" y={y+5} className="svg-pin">{w.boardPin}</text></g>})}
  {oleds.map((w,i)=>{const y=132+i*32,target=y;return <g key={`oled-${i}`}><path d={`M${boardX.right} ${target}H922`} fill="none" stroke={w.color} strokeWidth="3.5"/><circle cx={boardX.right} cy={target} r="4" fill={w.color}/><circle cx="922" cy={y} r="4" fill={w.color}/><text x="790" y={target+5} textAnchor="end" className="svg-pin">{w.boardPin}</text><text x="945" y={y+5} className="svg-pin">{w.fromPin}</text></g>})}
  {leds.map((w,i)=>{const y=260+i*32,target=y;return <g key={`led-${i}`}><path d={`M${boardX.right} ${target}H922`} fill="none" stroke={w.color} strokeWidth="3.5"/><circle cx={boardX.right} cy={target} r="4" fill={w.color}/><circle cx="922" cy={y} r="4" fill={w.color}/><text x="790" y={target+5} textAnchor="end" className="svg-pin">{w.boardPin}</text><text x="945" y={y+5} className="svg-pin">{w.fromPin}</text></g>})}
 </svg></div>
}
function App(){
 const [pm,setPm]=useState(11),[noData,setNoData]=useState(false),[selected,setSelected]=useState('');useEffect(()=>{window.lucide?.createIcons()},[]);
 const level=noData?lesson.missingColor:(lesson.colors.find(c=>pm<=c.max)||lesson.colors.at(-1)),part=lesson.parts.find(p=>p.id===selected);
 return <main className="mx-auto max-w-4xl space-y-6 overflow-x-hidden px-5 py-10"><header className="min-w-0 space-y-2"><p className="text-xs tracking-widest uppercase opacity-60">KIT4KIDS · เรียนรู้จากของจริง</p><h1 className="break-words text-3xl font-semibold sm:text-4xl">รู้จัก<span className="text-primary">บอร์ด DustBoy Kit</span></h1><p className="break-words opacity-75">หมุนดูชิ้นส่วน ลองปรับค่าฝุ่น แล้วสังเกตว่าสีไฟเปลี่ยนอย่างไร</p><div className="no-print flex min-w-0 items-center justify-between gap-2"><div className="breadcrumbs min-w-0 text-sm"><ul><li><a href="../"><i data-lucide="home" className="h-4 w-4"/>หน้าแรก</a></li><li>รู้จักบอร์ด</li></ul></div><button className="btn btn-ghost btn-sm shrink-0" onClick={()=>window.print()}><i data-lucide="printer" className="h-4 w-4"/>พิมพ์</button></div></header>
 <section className="print-card card min-w-0 border border-base-300 bg-base-100"><div className="card-body min-w-0 gap-4"><div><h2 className="card-title">ลองหมุนดูส่วนต่าง ๆ</h2><p className="text-sm opacity-70">ลากเพื่อหมุน แตะชิ้นส่วนเพื่อดูหน้าที่</p></div><Viewer pm={pm} noData={noData} selected={selected} setSelected={setSelected}/><div id="viewer-controls" className="no-print flex min-w-0 flex-wrap items-center gap-3"><label htmlFor="pm-slider" className="font-medium">ค่าฝุ่น PM2.5</label><input id="pm-slider" type="range" min="0" max="150" value={pm} onChange={e=>setPm(Number(e.target.value))} className="range range-primary min-w-0 flex-1"/><output className="badge badge-primary badge-lg shrink-0">{noData?'---':`${pm} µg/m³`}</output><button type="button" className="btn btn-sm shrink-0" onClick={()=>setNoData(v=>!v)}>{noData?'คืนข้อมูล':'ลองไม่มีข้อมูล'}</button><span className="badge shrink-0" style={{background:level.color,color:'#fff'}}>{level.label}</span></div><div className="alert min-w-0 bg-base-200"><span><strong>{part?.name||'แตะชิ้นส่วนในภาพ'}</strong><span className="block break-words text-sm">{part?`${part.title} · ${part.pins}`:'เพื่อเรียนรู้ว่าชิ้นส่วนนั้นทำอะไรและต่อสายตรงไหน'}</span></span></div></div></section>
 <section className="print-card card min-w-0 border border-base-300 bg-base-100"><div className="card-body min-w-0"><h2 className="card-title">ขาและสายที่ใช้</h2><p className="text-sm opacity-70">รายการนี้เป็นข้อมูลชุดเดียวกับภาพสามมิติ</p><div className="max-w-full overflow-x-auto"><table className="table table-sm"><thead><tr><th>ชิ้นส่วน</th><th>ขาบนบอร์ด</th><th>ต่อไปที่</th><th>ไฟเลี้ยง</th></tr></thead><tbody>{lesson.pins.map((p,i)=><tr key={i}><th>{p.part}</th><td>{p.pin}</td><td>{p.to}</td><td>{p.power}</td></tr>)}</tbody></table></div><p className="text-xs opacity-70">GPIO2, GPIO8 และ GPIO9 เป็นขาที่บอร์ดอ่านตอนเริ่มเปิดเครื่อง ควรต่ออุปกรณ์ตามแบบ</p></div></section>
 <section className="print-card card min-w-0 border border-base-300 bg-base-100"><div className="card-body min-w-0"><h2 className="card-title">ภาพต่อสายสำหรับพิมพ์</h2><p className="text-sm opacity-70">สีสายช่วยให้ตามดูได้ง่าย โปรดตรวจขาก่อนจ่ายไฟ</p><WiringSvg/></div></section>
 <section className="print-card card min-w-0 border border-base-300 bg-base-100"><div className="card-body"><h2 className="card-title">ใบงาน</h2><p><strong>เป้าหมาย:</strong> {lesson.worksheet.objective}</p><div className="space-y-1">{lesson.worksheet.steps.map((x,i)=><p key={x}><strong>{i+1}.</strong> {x}</p>)}</div><h3 className="mt-2 font-semibold">ลองตอบ</h3><div className="space-y-1">{lesson.worksheet.questions.map((x,i)=><p key={x}><strong>{i+1}.</strong> {x}</p>)}</div></div></section><footer className="break-words text-sm opacity-70">หัวข้อ MQTT: <code>DUSTBOY/DBK/&lt;kit&gt;/status</code> · เซนเซอร์ใช้ UART 9600 8N1 และไฟ 5V · จอ I²C 0x3C 400kHz ใช้ไฟ 3V3 · ไฟม่วงเมื่อไม่มีข้อมูลเกิน 10 วินาที</footer></main>
}
createRoot(document.getElementById('root')).render(<App/>);
