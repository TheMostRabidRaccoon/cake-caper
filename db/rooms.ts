import { env } from "cloudflare:workers";
import { requireCurrentRoom, RoomError, type Room } from "@/lib/game";
import { updateVersionedRoom } from "@/lib/versioned-room";
export function database(){if(!env.DB)throw new Error("The game room service is unavailable. Please try again.");return env.DB;}
export async function readRoom(code:string){
 const row=await database().prepare("SELECT state, version FROM caper_rooms WHERE code = ? AND expires_at > ?").bind(code,Date.now()).first<{state:string;version:number}>();
 if(!row)throw new RoomError("Room not found or expired. Check the six-letter code or create a new room.",404,"room_expired");
 const room=JSON.parse(row.state) as Room;
 requireCurrentRoom(room);
 return {room,version:row.version};
}
export async function updateRoom<T>(code:string,mutate:(room:Room)=>T){
 return updateVersionedRoom(()=>readRoom(code),async(room,version)=>{
  const result=await database().prepare("UPDATE caper_rooms SET state = ?, version = ?, expires_at = ? WHERE code = ? AND version = ? AND expires_at > ?")
   .bind(JSON.stringify(room),version+1,room.expiresAt,code,version,Date.now()).run();
  return !!result.meta.changes;
 },mutate);
}
