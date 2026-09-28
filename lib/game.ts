export const ACTIONS = [
 {id:"open", name:"Open cooler", detail:"Hold the lid open for this beat.", icon:"open"},
 {id:"carry", name:"Carry cake", detail:"Load the cake, or recover it from the grass.", icon:"cake"},
 {id:"brace", name:"Brace wagon", detail:"Control the wagon while a teammate pushes.", icon:"brace"},
 {id:"push", name:"Push wagon", detail:"Head home. Without a brace, the wagon rolls away.", icon:"push"},
 {id:"distract", name:"Distract dog", detail:"Keep the dog busy for this beat.", icon:"dog"},
] as const;
export type Action = typeof ACTIONS[number]["id"];
export type Plan = [Action, Action];
export type Board = {cake:"cooler"|"wagon"|"grass"|"home";wagon:"picnic"|"slope"|"home";dogAwake:boolean;crumbs:number};
export type Player = {id:string;token:string;name:string;role:number;plan:Plan|null};
export type Event = {id:number;round:number;beat:number;type:string;text:string;actors:string[]};
export type Frame = {beat:number;before:Board;after:Board;actions:{id:string;name:string;action:Action}[];events:Event[]};
export type Room = {code:string;hostId:string;players:Player[];status:"lobby"|"planning"|"replay"|"finished";round:number;missionId:string;board:Board;frames:Frame[];log:Event[];replayStartedAt:number;expiresAt:number};
export const ROLES = [
 {name:"Pip · Cooler specialist",clue:"The lid springs shut. OPEN and CARRY must happen on the same beat."},
 {name:"Moss · Wagon specialist",clue:"PUSH needs BRACE on the same beat. Otherwise the cake spills and the dog wakes up."},
 {name:"Nibs · Dog specialist",clue:"An awake dog guards a dropped cake. DISTRACT and CARRY together to recover it."},
 {name:"Rue · Rescue specialist",clue:"You can choose any action. Check who needs a helper on each beat before committing."},
];
export const freshBoard = ():Board=>({cake:"cooler",wagon:"picnic",dogAwake:false,crumbs:0});
export function createRoom(code:string,host:Player,now:number):Room{return {code,hostId:host.id,players:[host],status:"lobby",round:1,missionId:crypto.randomUUID(),board:freshBoard(),frames:[],log:[],replayStartedAt:0,expiresAt:now+86400000};}
export function resetRoom(room:Room){room.status="lobby";room.round=1;room.missionId=crypto.randomUUID();room.board=freshBoard();room.frames=[];room.log=[];room.replayStartedAt=0;room.players.forEach(p=>p.plan=null);}
export function validPlan(value:unknown):value is Plan{return Array.isArray(value)&&value.length===2&&value.every(v=>ACTIONS.some(a=>a.id===v));}
export function resolvePlan(room:Room,now:number){
 if(room.status!=="planning"||room.players.some(p=>!p.plan))throw new Error("The whole crew must commit first.");
 room.frames=[];
 for(let beat=0;beat<2;beat++){
  const before={...room.board}; const actions=room.players.map(p=>({id:p.id,name:p.name,action:p.plan![beat]}));const events:Event[]=[];
  const crew=(a:Action)=>actions.filter(p=>p.action===a); const who=(a:Action)=>crew(a).map(p=>p.name).join(" + ");
  const add=(type:string,text:string,actors:string[]=[])=>{const e={id:room.log.length+1,round:room.round,beat:beat+1,type,text,actors};room.log.push(e);events.push(e);};
  const ids=(a:Action)=>crew(a).map(p=>p.id);
  const distracted=crew("distract").length>0;
  if(distracted)add(room.board.dogAwake?"dog_distracted":"dog_distraction_attempt",room.board.dogAwake?`${who("distract")} lures the dog away. The cake is reachable this beat.`:`${who("distract")} keeps watch. The dog is still asleep.`,ids("distract"));
  if(crew("open").length)add("cooler_opened",`${who("open")} holds the cooler lid open for this beat.`,ids("open"));
  if(crew("brace").length)add("wagon_braced",`${who("brace")} grips the wagon handle, ready to control a push.`,ids("brace"));
  if(crew("carry").length){
   if(room.board.cake==="cooler"){
    if(crew("open").length){room.board.cake="wagon";add("cake_loaded",`${who("carry")} lifts the cake through the open lid and into the wagon.`,ids("carry"));}
    else add("lid_blocked",`${who("carry")} meets a closed cooler. Someone must OPEN on the same beat.`,ids("carry"));
   }else if(room.board.cake==="grass"){
    if(room.board.dogAwake&&!distracted){room.board.crumbs++;add("dog_blocked",`${who("carry")} cannot reach the cake. The dog guards it and steals some frosting. Pair CARRY with DISTRACT.`,ids("carry"));}
    else{room.board.cake="wagon";add("cake_recovered",`${who("carry")} scoops the cake off the grass and reloads the wagon.`,ids("carry"));}
   }else add("carry_unneeded",`${who("carry")} checks the cake. It is already in the wagon.`,ids("carry"));
  }
  if(crew("push").length){
   if(crew("brace").length){
    if(room.board.cake==="wagon"){room.board.wagon="home";room.board.cake="home";add("cake_home",`${who("push")} pushes while ${who("brace")} controls the handle. Cake delivered. Beautifully suspicious teamwork.`,[...ids("push"),...ids("brace")]);}
    else add("empty_wagon",`${who("push")} starts pushing, but the bracing crew stops the empty wagon. Load the cake first.`,ids("push"));
   }else{
    room.board.wagon="slope";room.board.dogAwake=true;
    add("wagon_runaway",`${who("push")} pushes without a brace. The wagon rolls down the slope and wakes the dog.`,ids("push"));
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
 }else{room.status="planning";room.round++;room.players.forEach(p=>p.plan=null);}
 return true;
}
export function report(room:Room){const count=(type:string)=>room.log.filter(e=>e.type===type).length;const won=room.board.cake==="home";const spills=count("cake_spilled");return {won,spills,recoveries:count("cake_recovered"),distractionAttempts:count("dog_distracted")+count("dog_distraction_attempt"),successfulDistractions:count("dog_distracted"),returned:room.log.filter(e=>e.type==="crew_returned").at(-1)?.actors.length??0,wagonHome:room.board.wagon==="home",finding:won?(spills?"Mission successful. Planning process remains under investigation.":"Mission successful. Evidence of an actual plan."):"Crew safe. Cake recovery requires another operation."};}
export function publicView(room:Room,token:string,version:number,now:number){const player=room.players.find(p=>p.token===token);if(!player)throw new Error("This room belongs to another session. Join with the room code.");return {code:room.code,hostId:room.hostId,players:room.players.map(p=>({id:p.id,name:p.name,role:p.role,ready:!!p.plan})),you:{id:player.id,role:player.role,plan:player.plan},status:room.status,round:room.round,missionId:room.missionId,board:room.board,frames:room.status==="replay"||room.status==="finished"?room.frames:[],log:room.log,replayStartedAt:room.replayStartedAt,report:report(room),version,serverNow:now};}
export type RoomView=ReturnType<typeof publicView>;
