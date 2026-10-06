import { database, readRoom, updateRoom } from "@/db/rooms";
import { applyRoomCommand, createRoom, needsRefresh, publicView, refreshRoom, RoomError, type Player } from "@/lib/game";
export const dynamic="force-dynamic";
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const tokenOf=(request:Request)=>request.headers.get("authorization")?.replace(/^Bearer /,"")??"";
const codeOf=(value:unknown)=>typeof value==="string"?value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,6):"";
const error=(e:unknown)=>json({error:e instanceof Error?e.message:"The room could not be reached. Try again.",code:e instanceof RoomError?e.code:"room_unavailable"},e instanceof RoomError?e.status:503);
export async function GET(request:Request){try{
 const code=codeOf(new URL(request.url).searchParams.get("code"));const token=tokenOf(request);
 let value=await readRoom(code);
 if(needsRefresh(value.room,token,Date.now()))value=await updateRoom(code,r=>refreshRoom(r,token,Date.now()));
 return json(publicView(value.room,token,value.version,Date.now()));
}catch(e){return error(e);}}
export async function POST(request:Request){try{
 const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)return json({error:"Please use the game page to make a move."},403);
 const raw=await request.text();if(raw.length>4096)return json({error:"That request is too large."},413);
 let body;try{body=JSON.parse(raw);}catch{throw new RoomError("That request could not be read.",400);}
 if(!body||typeof body!=="object"||Array.isArray(body))throw new RoomError("That request could not be read.",400);
 const token=tokenOf(request);const name=typeof body.name==="string"?body.name.trim().slice(0,18):"";const code=codeOf(body.code);
 if(body.operation==="create"){
  if(!name)throw new RoomError("Give your raccoon a name first.",400);
  const player:Player={id:crypto.randomUUID(),token:crypto.randomUUID(),name,role:0,plan:null,lastSeenAt:Date.now(),waitReason:null};
  for(let attempt=0;attempt<5;attempt++){const bytes=crypto.getRandomValues(new Uint8Array(6));const roomCode=Array.from(bytes,n=>"ABCDEFGHJKLMNPQRSTUVWXYZ"[n%23]).join("");const room=createRoom(roomCode,player,Date.now());const result=await database().prepare("INSERT OR IGNORE INTO caper_rooms (code, state, version, expires_at) VALUES (?, ?, 0, ?)").bind(roomCode,JSON.stringify(room),room.expiresAt).run();if(result.meta.changes)return json({token:player.token,room:publicView(room,player.token,0,Date.now())});}
  throw new Error("Could not create a room. Please try again.");
 }
 if(body.operation==="join"){
  if(!name||code.length!==6)throw new RoomError("Enter your name and the six-letter room code.",400);
  const player:Player={id:crypto.randomUUID(),token:crypto.randomUUID(),name,role:0,plan:null,lastSeenAt:Date.now(),waitReason:null};
  const value=await updateRoom(code,r=>{if(r.status!=="lobby")throw new RoomError("This heist has started. Ask the host to return to the lobby.");if(r.players.length>=4)throw new RoomError("This crew already has four raccoons.");player.role=[0,1,2,3].find(role=>!r.players.some(p=>p.role===role))!;r.players.push(player);});
  return json({token:player.token,room:publicView(value.room,player.token,value.version,Date.now())});
 }
 const value=await updateRoom(code,r=>applyRoomCommand(r,token,body,Date.now()));
 if(value.result.error)throw value.result.error;
 if(value.result.left)return json({left:true});
 return json(publicView(value.room,token,value.version,Date.now()));
 }catch(e){return error(e);}}
