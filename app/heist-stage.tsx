"use client";
import type { CSSProperties } from 'react';
import { freshBoard, type Board as BoardState, type Frame, type RoomView } from '@/lib/game';
import { heistScene } from '@/lib/heist-scene';
import Board from './board';

function Cake(){return <svg viewBox="0 0 80 75" fill="none" aria-hidden="true"><ellipse cx="40" cy="66" rx="37" ry="7" fill="#d8e7d5"/><path d="M10 35h60v27c-13 9-47 9-60 0Z" fill="#d89764" stroke="#643f2e" strokeWidth="2.5"/><path d="M11 49q29 10 58 0" stroke="#ffe6b4" strokeWidth="6"/><ellipse cx="40" cy="35" rx="30" ry="11" fill="#ffe6ca" stroke="#643f2e" strokeWidth="2.5"/><path d="M10 35v10q5 7 10 0v7q5 8 10 0v-4q7 5 14 0v6q7 7 11-2v-8q9 5 15-2v-7" fill="#fff2d9"/><path d="M40 15v15" stroke="#dd6b51" strokeWidth="5"/><path d="M40 4q-9 12 0 12t0-12" fill="#ffcc64"/><path d="m23 30 5 2m25-2 4-2" stroke="#d76658" strokeWidth="3" strokeLinecap="round"/></svg>}
function Wagon(){return <svg viewBox="0 0 150 100" fill="none" aria-hidden="true"><ellipse cx="69" cy="91" rx="57" ry="7" fill="#233e2b" opacity=".18"/><path d="m108 50 26-35h12" stroke="#34483c" strokeWidth="6" strokeLinecap="round"/><path d="M12 36h105l-9 38H22Z" fill="#bf6948" stroke="#563f31" strokeWidth="3"/><path d="M15 38h98M22 49h85M25 61h79" stroke="#e3a36b" strokeWidth="4"/><path d="M35 37v34m52-34v34" stroke="#6e5036" strokeWidth="4"/><path d="M22 75h86" stroke="#34483c" strokeWidth="5"/>{[34,96].map(x=><g key={x}><circle cx={x} cy="81" r="13" fill="#34483c"/><circle cx={x} cy="81" r="7" fill="#d8c5a0"/><circle cx={x} cy="81" r="2" fill="#34483c"/></g>)}</svg>}
function Cooler({open}:{open:boolean}){return <svg viewBox="0 0 120 105" fill="none" aria-hidden="true"><ellipse cx="61" cy="94" rx="49" ry="8" fill="#233e2b" opacity=".18"/><path d="m14 43 8 45q37 10 77-2l8-43" fill="#6c9b99" stroke="#325d59" strokeWidth="3"/><path d="M25 53v29m12-26v28m52-30v28" stroke="#9cbfAD" strokeWidth="3"/><ellipse cx="61" cy="43" rx="46" ry="13" fill="#264f48"/><g className={open?'cooler-lid is-open':'cooler-lid'}><path d="M12 35q48-19 96 0v13q-48 15-96 0Z" fill="#ede3c9" stroke="#637461" strokeWidth="3"/><path d="M21 36q38-11 78 0" stroke="#fff7e4" strokeWidth="3"/></g><path d="M55 51v13h12V51" fill="#e7d7b2" stroke="#637461" strokeWidth="2"/></svg>}
function Dog({awake,distracted}:{awake:boolean;distracted:boolean}){return <svg viewBox="0 0 125 105" fill="none" aria-hidden="true"><ellipse cx="65" cy="94" rx="51" ry="7" fill="#233e2b" opacity=".16"/><path d="M22 74Q-1 55 12 47" stroke="#997650" strokeWidth="11" strokeLinecap="round"/><ellipse cx="56" cy="74" rx="36" ry="22" fill="#bd956a"/><path d="M32 86h22m23 0h20" stroke="#e3bd86" strokeWidth="12" strokeLinecap="round"/><g className={distracted?'dog-head looking-away':'dog-head'}><path d="M62 39q24-18 41 3l3 30q-21 21-46 0Z" fill="#d6ad77"/><path d="M64 40Q39 32 52 68q12 8 16-14m32-14q26-5 15 30-11 7-15-16" fill="#785d44"/><ellipse cx="83" cy="69" rx="17" ry="13" fill="#f1d6a5"/>{awake?<><circle cx="73" cy="53" r="3" fill="#2e382a"/><circle cx="94" cy="53" r="3" fill="#2e382a"/></>:<path d="m69 53 7 2m14 0 7-2" stroke="#2e382a" strokeWidth="3" strokeLinecap="round"/>}<path d="M78 63q5-4 10 0l-5 6Z" fill="#34392b"/><path d="M73 78q10 7 20-1" stroke="#45675d" strokeWidth="5" strokeLinecap="round"/></g></svg>}

export default function HeistStage({board=freshBoard(),players=[],frame,finished=false}:{board?:BoardState;players?:RoomView['players'];frame?:Frame;finished?:boolean}){
 const scene=heistScene(board,frame,finished);const b=scene.board;
 const wagon=b.wagon==='home'?[26,72]:b.wagon==='slope'?[78,78]:[56,61];
 const cake=b.cake==='home'?[26,61]:b.cake==='wagon'?[wagon[0]-2,wagon[1]-11]:b.cake==='grass'?[66,84]:[34,49];
 const cast=players.length?players:[{id:'crew',name:'The crew',role:0,ready:false,away:false}];
 const position=(x:number,y:number):CSSProperties=>({left:`${x}%`,top:`${y}%`});
 return <figure className={`heist-stage ${scene.runaway?'has-runaway':''} ${scene.delivered?'has-delivery':''}`} aria-label="Illustrated heist and live progress map">
  <div className="stage-world" role="img" aria-label={`${scene.title} Cake ${b.cake==='grass'?'on the grass':`at ${b.cake}`}. Wagon at ${b.wagon}. Dog ${b.dogAwake?'awake':'asleep'}.`}>
   <svg className="stage-landscape" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path fill="#bccbbb" d="M0 0h640v440H0z"/><path fill="#d4dcc5" d="M0 95q120-50 250 10T640 89v351H0Z"/>
    <path d="M0 195q170-46 332 7t308 8v230H0Z" fill="#93aa7a"/>
    <path d="M0 245q175-48 337 13t303 39v143H0Z" fill="#829b69"/>
    <path d="M-20 359Q85 294 207 285t213 63 240 54" fill="none" stroke="#c2b68d" strokeWidth="45"/>
    <path d="M-20 359Q85 294 207 285t213 63 240 54" fill="none" stroke="#d7c69a" strokeWidth="30"/>
    <g stroke="#8a9471" strokeWidth="7" fill="#c1c5a3">{[200,240,280,320,360,400,440,480,520,560,600,640].map(x=><path key={x} d={`M${x} 207v-70l12-11 12 11v75Z`}/>)}<path d="M192 153h448m-448 37h448"/></g>
    <path d="M0 345V-10h88L63 328Z" fill="#5d6951"/><path d="m43 324 9-274m-7 55L13 80m33 105 25-34" stroke="#788267" strokeWidth="8" fill="none"/>
    <path d="M0 315q39-91 107-17l13 63H0Z" fill="#687957"/><path d="M31 348q-3-79 55-35l12 39Z" fill="#354d3d"/><path d="M44 345q0-52 31-25l9 26" fill="#d7b66d"/>
    <g fill="#365940"><ellipse cx="42" cy="16" rx="143" ry="72"/><ellipse cx="158" cy="-9" rx="114" ry="69"/><ellipse cx="319" cy="-32" rx="139" ry="67"/><ellipse cx="625" cy="-6" rx="129" ry="81"/></g>
    <g fill="#4b6c4b"><ellipse cx="55" cy="0" rx="108" ry="48"/><ellipse cx="179" cy="-20" rx="92" ry="50"/><ellipse cx="583" cy="-15" rx="104" ry="47"/></g>
    <g fill="#627e53"><path d="m0 424 11-46 14 30 12-49 14 49 14-34 13 50m467 16 13-49 14 31 13-55 18 46 12-32 19 48 14-37 22 48"/><ellipse cx="143" cy="404" rx="19" ry="6"/><ellipse cx="435" cy="246" rx="14" ry="5"/></g>
    <g fill="#e4dcb0"><ellipse cx="146" cy="337" rx="9" ry="3"/><ellipse cx="412" cy="354" rx="7" ry="3"/><ellipse cx="537" cy="393" rx="11" ry="4"/></g>
    <g fill="#f2d79b"><circle cx="126" cy="248" r="3"/><circle cx="448" cy="285" r="3"/><circle cx="146" cy="252" r="2"/></g>
   </svg>
   <div className="stage-kicker">WOODLAND COUNCIL <span>FIELD CAM 01</span></div>
   <div className="scene-prop scene-cooler" style={position(34,54)}><Cooler open={scene.open}/></div>
   <div className="scene-prop scene-wagon" style={position(...wagon as [number,number])}><div className={scene.runaway?'wagon-body wagon-runaway':'wagon-body'} key={frame?.events[0]?.id??'still'}><Wagon/></div>{scene.braced&&<span className="prop-cue brace-cue">HELD STEADY</span>}</div>
   <div className={`scene-prop scene-cake ${b.cake==='cooler'&&!scene.open?'cake-in-cooler':''}`} style={position(...cake as [number,number])}><div className={scene.spilled?'cake-drop':''} key={frame?.events[0]?.id??'still'}><Cake/></div></div>
   <div className="scene-prop scene-dog" style={position(scene.distracted?88:82,b.dogAwake?72:60)}><Dog awake={b.dogAwake} distracted={scene.distracted}/><span className="dog-mood">{scene.distracted?'OVER HERE!':b.dogAwake?'!':'z z z'}</span></div>
   <span className="den-sign">HOME</span><span className="hill-sign">SLOPE ↘</span>
   {cast.map((player,index)=>{const action=frame?.actions.find(a=>a.id===player.id)?.action;
    const peers=frame?.actions.filter(a=>a.action===action)??[];
    const peerIndex=Math.max(0,peers.findIndex(a=>a.id===player.id));
    const spread=(peerIndex-(peers.length-1)/2)*13;
    const base=action==='open'?[27,64]:action==='carry'?[cake[0]+12,cake[1]+12]:action==='brace'?[wagon[0]+13,wagon[1]-4]:action==='push'?[wagon[0]-13,wagon[1]+4]:action==='distract'?[85,58]:[28+index*14,84];
    const center=Math.max(10+(peers.length-1)*6.5,Math.min(90-(peers.length-1)*6.5,base[0]));
    const spot=finished?[14+index*18,88]:frame?[center+spread,base[1]+(peers.length>1?peerIndex%2*7:0)]:base;
    return <div key={player.id} className={`scene-player player-${player.role}`} style={{...position(Math.min(91,spot[0]),Math.min(88,spot[1])),width:cast.length>2?'14%':'17%'}}><img src="/raccoon.png" alt="" draggable="false"/><span>{player.name}</span>{frame&&<b className="move-bubble">{action==='open'?'OPEN':action==='carry'?'CARRY':action==='brace'?'BRACE':action==='push'?'PUSH':action==='distract'?'DISTRACT':'WAIT'}</b>}</div>;
   })}
   {scene.spilled&&<span className="scene-impact" key={frame?.events[0]?.id}>CAKE DOWN!</span>}
   {scene.delivered&&<span className="scene-success">DELIVERED ✓</span>}
  </div>
  <div className="stage-minimap"><span className="minimap-label">LIVE MAP</span><Board board={b} compact/></div>
  <figcaption><span className="stage-indicator"/><span>{scene.title}</span><b>{frame?`BEAT ${frame.beat}`:finished?'REPORT':'THE HEIST'}</b></figcaption>
 </figure>;
}
