export type Session={code:string;token:string};
export type SavedSeat=Session&{playerId:string;name:string;expiresAt:number};
export const ACTIVE_SEAT_KEY="cake-caper-session";
const PREFIX="cake-caper-seat:";

export function isSession(value:unknown):value is Session {
 if(!value||typeof value!=="object")return false;
 const seat=value as Partial<Session>;
 return typeof seat.code==="string"&&/^[A-Z]{6}$/.test(seat.code)&&typeof seat.token==="string"&&seat.token.length>0;
}
export function readSavedSeats(storage:Storage,now=Date.now()):SavedSeat[]{
 const seats:SavedSeat[]=[];
 try {
  for(let i=0;i<storage.length;i++){
   const key=storage.key(i);if(!key?.startsWith(PREFIX))continue;
   try {
    const value=JSON.parse(storage.getItem(key)??"null");
    if(!isSession(value))continue;
    const seat=value as Partial<SavedSeat>;
    if(typeof seat.playerId==="string"&&typeof seat.name==="string"&&typeof seat.expiresAt==="number"&&Number.isFinite(seat.expiresAt)&&seat.expiresAt>now)seats.push(seat as SavedSeat);
   }catch{/* Ignore a damaged device-local record; the server remains authoritative. */}
  }
 }catch{/* Storage may be unavailable in this browser. */}
 return seats.sort((a,b)=>b.expiresAt-a.expiresAt);
}
export function rememberSeat(storage:Storage,seat:SavedSeat){
 // Separate keys avoid one tab overwriting another tab's saved seat list.
 try{storage.setItem(PREFIX+seat.playerId,JSON.stringify(seat));return true;}catch{return false;}
}
export function forgetSeat(storage:Storage,token:string){
 try{for(const seat of readSavedSeats(storage,0))if(seat.token===token)storage.removeItem(PREFIX+seat.playerId);}catch{}
}
export function isTerminalRoomError(code:unknown){return code==="seat_revoked"||code==="room_expired"||code==="room_updated";}
