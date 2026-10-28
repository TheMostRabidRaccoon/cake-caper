import type { Room } from "./game";

type StoredRoom = {room:Room;version:number};

// A conflict reruns the command against the newest state. Return only the result
// belonging to the state that actually won the compare-and-swap.
export async function updateVersionedRoom<T>(
 read:()=>Promise<StoredRoom>,
 write:(room:Room,expectedVersion:number)=>Promise<boolean>,
 mutate:(room:Room)=>T,
){
 for(let attempt=0;attempt<8;attempt++){
  const {room,version}=await read();
  const before=JSON.stringify(room);
  const result=mutate(room);
  if(JSON.stringify(room)===before)return {room,version,result};
  if(await write(room,version))return {room,version:version+1,result};
 }
 throw new Error("The crew is busy. Please try that move again.");
}
