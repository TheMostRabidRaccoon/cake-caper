export const ACTIONS = [
 {id:"open", name:"Open cooler", detail:"Hold the lid for a teammate carrying on this beat. It shuts afterward.", icon:"open"},
 {id:"carry", name:"Carry cake", detail:"From cooler: a teammate must open. From grass: distract an awake dog. Same beat!", icon:"cake"},
 {id:"brace", name:"Brace wagon", detail:"Hold the wagon steady while a teammate pushes on this beat.", icon:"brace"},
 {id:"push", name:"Push wagon", detail:"Deliver a loaded wagon. Needs a teammate bracing on this beat.", icon:"push"},
 {id:"distract", name:"Distract dog", detail:"Keep an awake dog busy while a teammate collects a dropped cake.", icon:"dog"},
] as const;
export type Action = typeof ACTIONS[number]["id"];
export type Plan = [Action, Action];
export type ResolvedAction = Action | "wait";
export type LockedPlan = [ResolvedAction, ResolvedAction];
export type WaitReason = "deadline" | "host";
export type Board = {cake:"cooler"|"wagon"|"grass"|"home";wagon:"picnic"|"slope"|"home";dogAwake:boolean;crumbs:number};
export type Player = {id:string;token:string;name:string;role:number;plan:LockedPlan|null;lastSeenAt:number;waitReason:WaitReason|null};
export type Event = {id:number;round:number;beat:number;type:string;text:string;actors:string[]};
export type Frame = {beat:number;before:Board;after:Board;actions:{id:string;name:string;action:ResolvedAction}[];events:Event[]};
export type Room = {schemaVersion:number;code:string;hostId:string;players:Player[];status:"lobby"|"planning"|"replay"|"finished";round:number;missionId:string;board:Board;frames:Frame[];log:Event[];replayStartedAt:number;expiresAt:number;planningStartedAt:number;planningDeadline:number;planningExtended:boolean};
export const ROOM_SCHEMA_VERSION=2;
export const PLANNING_MS=120_000;
export const EXTENSION_MS=60_000;
export const EARLY_REVEAL_MS=30_000;
export const PRESENCE_INTERVAL_MS=15_000;
export const HOST_AWAY_MS=45_000;
export class RoomError extends Error {
 status:number;
 code:string;
 constructor(message:string,status=409,code="room_action_rejected"){super(message);this.status=status;this.code=code;}
}
export function requireCurrentRoom(room:Room){
 if(room.schemaVersion!==ROOM_SCHEMA_VERSION)throw new RoomError("This room was created before the room-recovery update. Create a new room to play with the new timers and saved seats.",409,"room_updated");
}
export const ROLES = [
 {name:"Pip · Cooler specialist",clue:"The lid springs shut. OPEN and CARRY must happen on the same beat."},
 {name:"Moss · Wagon specialist",clue:"PUSH needs BRACE on the same beat. Otherwise the cake spills and the dog wakes up."},
 {name:"Nibs · Dog specialist",clue:"An awake dog guards a dropped cake. DISTRACT and CARRY together to recover it."},
 {name:"Rue · Rescue specialist",clue:"You can choose any action. Check who needs a helper on each beat before committing."},
];
export const freshBoard = ():Board=>({cake:"cooler",wagon:"picnic",dogAwake:false,crumbs:0});
export function createRoom(code:string,host:Player,now:number):Room{return {schemaVersion:ROOM_SCHEMA_VERSION,code,hostId:host.id,players:[host],status:"lobby",round:1,missionId:crypto.randomUUID(),board:freshBoard(),frames:[],log:[],replayStartedAt:0,expiresAt:now+86400000,planningStartedAt:0,planningDeadline:0,planningExtended:false};}
export function resetRoom(room:Room){room.status="lobby";room.round=1;room.missionId=crypto.randomUUID();room.board=freshBoard();room.frames=[];room.log=[];room.replayStartedAt=0;room.planningStartedAt=0;room.planningDeadline=0;room.planningExtended=false;room.players.forEach(p=>{p.plan=null;p.waitReason=null;});}
export function beginPlanning(room:Room,now:number){room.status="planning";room.planningStartedAt=now;room.planningDeadline=now+PLANNING_MS;room.planningExtended=false;room.players.forEach(p=>{p.plan=null;p.waitReason=null;});}
export function validPlan(value:unknown):value is Plan{return Array.isArray(value)&&value.length===2&&value.every(v=>ACTIONS.some(a=>a.id===v));}
export function resolvePlan(room:Room,now:number){
 if(room.status!=="planning"||room.players.some(p=>!p.plan))throw new Error("The whole crew must commit first.");
 room.frames=[];
 for(let beat=0;beat<2;beat++){
  const before={...room.board}; const actions=room.players.map(p=>({id:p.id,name:p.name,action:p.plan![beat]}));const events:Event[]=[];
  const crew=(a:ResolvedAction)=>actions.filter(p=>p.action===a); const who=(a:ResolvedAction)=>crew(a).map(p=>p.name).join(" + ");
  const add=(type:string,text:string,actors:string[]=[])=>{const e={id:room.log.length+1,round:room.round,beat:beat+1,type,text,actors};room.log.push(e);events.push(e);};
  const ids=(a:Action)=>crew(a).map(p=>p.id);
  for(const waiting of crew("wait")){
   const reason=room.players.find(p=>p.id===waiting.id)?.waitReason;
   add("crew_waited",`${waiting.name} waits: ${reason==="host"?"the host revealed the plan before they locked any moves":"no moves were locked before the planning timer ended"}.`,[waiting.id]);
  }
  const distracted=crew("distract").length>0;
  if(distracted){
   const cakeNote=room.board.cake==="grass"?"A teammate can collect the dropped cake on this beat.":room.board.cake==="cooler"?"The cake is still in the cooler; its lid needs someone holding it open.":room.board.cake==="wagon"?"The cake is already in the wagon.":"The cake is already home.";
   add(room.board.dogAwake?"dog_distracted":"dog_distraction_attempt",room.board.dogAwake?`${who("distract")} lures the dog away. ${cakeNote}`:`${who("distract")} keeps watch. The dog is still asleep.`,ids("distract"));
  }
  if(crew("open").length)add("cooler_opened",`${who("open")} holds the cooler lid open for this beat.`,ids("open"));
  if(crew("brace").length)add("wagon_braced",`${who("brace")} grips the wagon handle, ready to control a push.`,ids("brace"));
  if(crew("carry").length){
   if(room.board.cake==="cooler"){
    if(crew("open").length){room.board.cake="wagon";add("cake_loaded",`${who("carry")} lifts the cake through the open lid and into the wagon.`,ids("carry"));}
    else add("lid_blocked",`${who("carry")} meets a closed cooler. Someone must OPEN on the same beat.`,ids("carry"));
   }else if(room.board.cake==="grass"){
    if(room.board.dogAwake&&!distracted){room.board.crumbs++;add("dog_blocked",`${who("carry")} cannot reach the cake. The dog guards it and steals some frosting. Pair CARRY with DISTRACT.`,ids("carry"));}
    else{room.board.cake="wagon";add("cake_recovered",`${who("carry")} scoops the cake off the grass and reloads the wagon.`,ids("carry"));}
   }else add("carry_unneeded",`${who("carry")} checks the cake. It is already ${room.board.cake==="home"?"home":"in the wagon"}.`,ids("carry"));
  }
  if(crew("push").length){
   if(crew("brace").length){
    if(room.board.cake==="wagon"){room.board.wagon="home";room.board.cake="home";add("cake_home",`${who("push")} pushes while ${who("brace")} controls the handle. Cake delivered. Beautifully suspicious teamwork.`,[...ids("push"),...ids("brace")]);}
    else add("empty_wagon",`${who("push")} starts pushing, but the bracing crew stops the empty wagon. Load the cake first.`,ids("push"));
   }else{
    const dogNote=room.board.dogAwake?"The dog stays awake.":"The noise wakes the dog.";
    const wagonNote=room.board.cake==="wagon"?"wagon":"empty wagon";
    room.board.wagon="slope";room.board.dogAwake=true;
    add("wagon_runaway",`${who("push")} pushes without a brace. The ${wagonNote} rolls down the slope. ${dogNote}`,ids("push"));
    if(room.board.cake==="wagon"){room.board.cake="grass";room.board.crumbs++;add("cake_spilled","The cake tumbles onto the grass. Still recoverable. The dog is interested.",ids("push"));}
   }
  }
  room.frames.push({beat:beat+1,before,after:{...room.board},actions,events});
  if(room.board.cake==="home")break;
 }
 room.status="replay";room.replayStartedAt=now;
}
export function replayDuration(room:Room){return room.frames.length*3200+800;}
export function advanceReplay(room:Room,now:number){
 if(room.status!=="replay"||now<room.replayStartedAt+replayDuration(room))return false;
 if(room.board.cake==="home"||room.round>=2){
  room.status="finished";room.log.push({id:room.log.length+1,round:room.round,beat:3,type:"crew_returned",text:room.board.cake==="home"?"The whole crew returns home with the cake.":"The crew retreats safely. The cake remains in the backyard.",actors:room.players.map(p=>p.id)});
 }else{room.round++;beginPlanning(room,now);}
 return true;
}
export function report(room:Room){const count=(type:string)=>room.log.filter(e=>e.type===type).length;const won=room.board.cake==="home";const spills=count("cake_spilled");return {won,spills,recoveries:count("cake_recovered"),distractionAttempts:count("dog_distracted")+count("dog_distraction_attempt"),successfulDistractions:count("dog_distracted"),returned:room.log.filter(e=>e.type==="crew_returned").at(-1)?.actors.length??0,wagonHome:room.board.wagon==="home",finding:won?(spills?"Mission successful. Planning process remains under investigation.":"Mission successful. Evidence of an actual plan."):"Crew safe. Cake recovery requires another operation."};}
export function seatOf(room:Room,token:string){const player=room.players.find(p=>p.token===token);if(!player)throw new RoomError("That saved seat is no longer in this room. You can join again from the lobby.",401,"seat_revoked");return player;}
export function publicView(room:Room,token:string,version:number,now:number){const player=seatOf(room,token);return {code:room.code,hostId:room.hostId,players:room.players.map(p=>({id:p.id,name:p.name,role:p.role,ready:!!p.plan,away:now-(p.lastSeenAt??0)>=HOST_AWAY_MS})),you:{id:player.id,role:player.role,plan:player.plan,waitReason:player.waitReason},status:room.status,round:room.round,missionId:room.missionId,board:room.board,frames:room.status==="replay"||room.status==="finished"?room.frames:[],log:room.log,replayStartedAt:room.replayStartedAt,report:report(room),planningDeadline:room.planningDeadline,earlyRevealAt:room.planningStartedAt+EARLY_REVEAL_MS,planningExtended:room.planningExtended,expiresAt:room.expiresAt,version,serverNow:now};}
export type RoomView=ReturnType<typeof publicView>;

// The reveal footer must describe the displayed beat, never the future board.
export function revealNote(room:RoomView,frameIndex:number){
 if(frameIndex<room.frames.length-1)return "Watch this beat. The next moves are still to come.";
 return room.frames[frameIndex]?.after.cake==="home"?"Cake secured. The report is on its way.":room.round===1?"Take a breath. You get a rescue plan.":"The Council is reviewing the evidence.";
}

// Explain the visible starting position, using only the previous plan's public events.
export function planningBriefing(room:Pick<Room,"board"|"log"|"round">){
 const previous=room.log.filter(event=>event.round===room.round-1);
 if(room.board.cake==="cooler"){
  const opened=previous.some(event=>event.type==="cooler_opened");
  return {title:"The cake is still in the cooler.",detail:opened?"The last plan opened the lid, but nobody carried while it was open. Opening and carrying need two raccoons on the same beat.":"The spring-loaded lid shuts after each beat. One raccoon must hold it open while another carries on that same beat."};
 }
 if(room.board.cake==="grass")return {title:"The cake is on the grass.",detail:room.board.dogAwake?"The dog is awake and guarding it. A distraction and a carry must happen on the same beat to collect it.":"The dog is asleep. Someone can carry the dropped cake back into the wagon."};
 if(room.board.cake==="wagon")return {title:"The cake is loaded in the wagon.",detail:"No need to carry it again. A push needs a teammate bracing the wagon on that same beat."};
 return {title:"The cake is home.",detail:"Your crew has completed the delivery."};
}

export function fillMissingPlans(room:Room,reason:WaitReason,now:number){
 if(room.status!=="planning")return;
 for(const player of room.players)if(!player.plan){player.plan=["wait","wait"];player.waitReason=reason;}
 resolvePlan(room,now);
}
export function needsRefresh(room:Room,token:string,now:number){
 const player=seatOf(room,token);
 return now-player.lastSeenAt>=PRESENCE_INTERVAL_MS||room.status==="planning"&&now>=room.planningDeadline||room.status==="replay"&&now>=room.replayStartedAt+replayDuration(room);
}
export function refreshRoom(room:Room,token:string,now:number){
 const player=seatOf(room,token);
 if(now-player.lastSeenAt>=PRESENCE_INTERVAL_MS)player.lastSeenAt=now;
 if(room.status==="planning"&&now>=room.planningDeadline)fillMissingPlans(room,"deadline",now);
 else advanceReplay(room,now);
}
export type RoomCommand={operation?:unknown;missionId?:unknown;round?:unknown;plan?:unknown;playerId?:unknown};
export function applyRoomCommand(room:Room,token:string,command:RoomCommand,now:number){
 const player=seatOf(room,token);
 // Persist clock advancement even when a late command is rejected. The caller
 // saves this result atomically, then returns any error to the requesting player.
 refreshRoom(room,token,now);
 try {
  if(command.missionId!==room.missionId||command.round!==room.round)throw new RoomError("The round changed. Check the board and choose again.");
  const host=()=>{if(player.id!==room.hostId)throw new RoomError("Only the host can do that.",403);};
  const lobby=()=>{if(room.status!=="lobby")throw new RoomError("Return to the lobby before changing the crew.");};
  const planning=()=>{if(room.status!=="planning")throw new RoomError("The crew is already moving. Wait for the next plan.");};
  switch(command.operation){
   case "start":
    host();lobby();if(room.players.length<2)throw new RoomError("Invite at least one friend before starting.");beginPlanning(room,now);break;
   case "reset":
    host();resetRoom(room);break;
   case "extend":
    host();planning();if(room.planningExtended)throw new RoomError("The extra minute has already been used for this plan.");room.planningDeadline+=EXTENSION_MS;room.planningExtended=true;break;
   case "reveal":
    host();planning();if(now<room.planningStartedAt+EARLY_REVEAL_MS)throw new RoomError("Give the crew at least 30 seconds to plan.");fillMissingPlans(room,"host",now);break;
   case "takeover": {
    if(player.id===room.hostId)break;
    const previous=room.players.find(p=>p.id===room.hostId);
    if(previous&&now-previous.lastSeenAt<HOST_AWAY_MS)throw new RoomError("The host is still connected. Hosting can be claimed after 45 seconds without contact.");
    room.hostId=player.id;player.lastSeenAt=now;break;
   }
   case "remove":
    host();lobby();if(command.playerId===player.id)throw new RoomError("Use Leave room to release your own seat.");
    if(typeof command.playerId!=="string")throw new RoomError("Choose a crew member to remove.",400);
    room.players=room.players.filter(p=>p.id!==command.playerId);break;
   case "leave":
    lobby();room.players=room.players.filter(p=>p.id!==player.id);
    if(room.hostId===player.id)room.hostId=room.players.find(p=>now-p.lastSeenAt<HOST_AWAY_MS)?.id??room.players[0]?.id??"";
    if(!room.players.length)room.expiresAt=now;
    return {left:true};
   case "commit":
    if(!validPlan(command.plan))throw new RoomError("Choose one action for each beat.",400);
    if(player.plan&&JSON.stringify(player.plan)===JSON.stringify(command.plan))break;
    planning();if(player.plan)throw new RoomError("Your plan is locked. Wait for the reveal.");
    player.plan=[...command.plan];player.waitReason=null;
    if(room.players.every(p=>p.plan))resolvePlan(room,now);break;
   default: throw new RoomError("Unknown room action.",400);
  }
  return {left:false};
 }catch(error){if(error instanceof RoomError)return {error};throw error;}
}
