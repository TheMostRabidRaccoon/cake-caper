import { database, readRoom, updateRoom } from "@/db/rooms";
import { advanceReplay, createRoom, publicView, resetRoom, resolvePlan, validPlan, type Player } from "@/lib/game";
export const dynamic="force-dynamic";
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const tokenOf=(request:Request)=>request.headers.get("authorization")?.replace(/^Bearer /,"")??"";
const codeOf=(value:unknown)=>typeof value==="string"?value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,6):"";
const error=(e:unknown)=>json({error:e instanceof Error?e.message:"The room could not be reached. Try again."},400);
export async function GET(request:Request){try{const code=codeOf(new URL(request.url).searchParams.get("code"));const token=tokenOf(request);let value=await readRoom(code);publicView(value.room,token,value.version,Date.now());if(value.room.status==="replay"&&Date.now()>=value.room.replayStartedAt+value.room.frames.length*3200+800)value=await updateRoom(code,r=>{advanceReplay(r,Date.now());});return json(publicView(value.room,token,value.version,Date.now()));}catch(e){return error(e);}}
export async function POST(request:Request){try{
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return json({error:"Please use the game page to make a move."},403);
 const raw=await request.text();if(raw.length>4096)return json({error:"That request is too large."},413);
 const body=JSON.parse(raw);const token=tokenOf(request);const name=typeof body.name==="string"?body.name.trim().slice(0,18):"";const code=codeOf(body.code);
 if(body.operation==="create"){
  if(!name)throw new Error("Give your raccoon a name first.");
  const player:Player={id:crypto.randomUUID(),token:crypto.randomUUID(),name,role:0,plan:null};
  for(let attempt=0;attempt<5;attempt++){const bytes=crypto.getRandomValues(new Uint8Array(6));const roomCode=Array.from(bytes,n=>"ABCDEFGHJKLMNPQRSTUVWXYZ"[n%23]).join("");const room=createRoom(roomCode,player,Date.now());const result=await database().prepare("INSERT OR IGNORE INTO caper_rooms (code, state, version, expires_at) VALUES (?, ?, 0, ?)").bind(roomCode,JSON.stringify(room),room.expiresAt).run();if(result.meta.changes)return json({token:player.token,room:publicView(room,player.token,0,Date.now())});}
  throw new Error("Could not create a room. Please try again.");
 }
 if(body.operation==="join"){
  if(!name||code.length!==6)throw new Error("Enter your name and the six-letter room code.");
  const player:Player={id:crypto.randomUUID(),token:crypto.randomUUID(),name,role:0,plan:null};
  const value=await updateRoom(code,r=>{if(r.status!=="lobby")throw new Error("This heist has started. Ask the host to return to the lobby.");if(r.players.length>=4)throw new Error("This crew already has four raccoons.");player.role=[0,1,2,3].find(role=>!r.players.some(p=>p.role===role))!;r.players.push(player);});
  return json({token:player.token,room:publicView(value.room,player.token,value.version,Date.now())});
 }
 const value=await updateRoom(code,r=>{
  const player=r.players.find(p=>p.token===token);if(!player)throw new Error("Your session could not be found. Rejoin the room.");
  if(body.operation==="start"){if(player.id!==r.hostId)throw new Error("Only the host can start the heist.");if(r.status!=="lobby")return;if(r.players.length<2)throw new Error("Invite at least one friend before starting.");r.status="planning";return;}
  if(body.operation==="reset"){if(player.id!==r.hostId)throw new Error("Only the host can return the crew to the lobby.");resetRoom(r);return;}
  if(body.operation==="commit"){
   if(body.missionId!==r.missionId||body.round!==r.round)throw new Error("The round changed. Check the board and choose again.");
   if(!validPlan(body.plan))throw new Error("Choose one action for each beat.");
   if(player.plan&&JSON.stringify(player.plan)===JSON.stringify(body.plan))return;
   if(r.status!=="planning")throw new Error("The crew is already moving. Wait for the next plan.");
   if(player.plan)throw new Error("Your plan is locked. Wait for the reveal.");player.plan=body.plan;
   if(r.players.every(p=>p.plan))resolvePlan(r,Date.now());return;
  }
  throw new Error("Unknown room action.");
 });return json(publicView(value.room,token,value.version,Date.now()));
 }catch(e){return error(e);}}
