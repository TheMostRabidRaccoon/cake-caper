"use client";
import { CakeSlice, Dog, PackageOpen, ShoppingCart, House } from "lucide-react";
import { freshBoard, type Board as BoardState, type Frame, type RoomView } from "@/lib/game";
export default function Board({board=freshBoard(),players=[],frame,compact=false}:{board?:BoardState;players?:RoomView["players"];frame?:Frame;compact?:boolean}){
 const wagonX=board.wagon==="home"?24:board.wagon==="slope"?76:50;
 const wagonY=board.wagon==="home"?80:board.wagon==="slope"?61:33;
 const cakeX=board.cake==="home"?24:board.cake==="wagon"?wagonX:board.cake==="grass"?67:13;
 const cakeY=board.cake==="home"?71:board.cake==="wagon"?wagonY-12:board.cake==="grass"?70:22;
 return <div className={"mission-map live-map"+(compact?" compact-map":"")} role="img" aria-label={`Backyard: cake ${board.cake==='grass'?'on the grass':`at ${board.cake}`}, wagon at ${board.wagon}, dog ${board.dogAwake?'awake':'asleep'}.`}>{!compact&&<div className="map-caption">THE BACKYARD · NOT TO SCALE. STILL A CRIME.</div>}<div className="map-grid live-grid">
 <svg className="board-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M13 33H50L76 61M50 33L24 80" fill="none" stroke="currentColor" strokeWidth=".5" strokeDasharray="2 2"/></svg>
 <div className="board-object" style={{left:'13%',top:'37%'}}><PackageOpen size={39}/><span>Cooler</span></div>
 <div className="board-object wagon-object" style={{left:`${wagonX}%`,top:`${wagonY}%`}}><ShoppingCart size={39}/><span>Wagon</span></div>
 <div className="board-object dog-object" style={{left:board.dogAwake?'82%':'84%',top:board.dogAwake?'84%':'18%'}}><Dog size={36}/><span>{board.dogAwake?'Dog · awake':'Dog · asleep'}</span></div>
 <div className="board-object home-object" style={{left:'24%',top:'86%'}}><House size={32}/><span>Home</span></div>
 <div className="board-object cake-object" style={{left:`${cakeX}%`,top:`${cakeY}%`}}><CakeSlice size={30}/><span className="sr-only">Cake</span></div>
 <span className="slope-label">DOWNHILL ↘</span>
 {compact?null:players.length?players.map((p,index)=>{const action=frame?.actions.find(a=>a.id===p.id)?.action;const base=board.cake==='home'?[15+index*18,66]:action==='open'?[7+index*3,46]:action==='carry'?[cakeX+8,cakeY+15]:action==='push'||action==='brace'?[wagonX-11+index*6,wagonY+13]:action==='distract'?[89,33+index*6]:[16+index*18,69];return <div key={p.id} className={`player-piece player-${p.role}`} style={{left:`${Math.min(92,base[0])}%`,top:`${Math.min(91,base[1])}%`}}><img src="/raccoon.png" alt=""/><span>{p.name}</span></div>}):<div className="raccoon-token"><img className="raccoon-art" src="/raccoon.png" alt="A small raccoon in a blue scarf"/><span>The crew</span></div>}
 </div></div>;
}
