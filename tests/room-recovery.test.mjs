import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,beginPlanning,applyRoomCommand,refreshRoom,needsRefresh,publicView,revealNote,validPlan,requireCurrentRoom,RoomError,PLANNING_MS,HOST_AWAY_MS,PRESENCE_INTERVAL_MS,replayDuration} from '../lib/game.ts';
import {updateVersionedRoom} from '../lib/versioned-room.ts';

const start=1_000;
function setup(count=2){
 const players=Array.from({length:count},(_,i)=>({id:`p${i}`,token:`secret-${i}`,name:`Raccoon ${i}`,role:i,plan:null,lastSeenAt:start,waitReason:null}));
 const room=createRoom('ABCDEF',players[0],start);room.players=players;return room;
}
const command=(room,operation,extra={})=>({operation,missionId:room.missionId,round:room.round,...extra});
const act=(room,index,operation,now=start,extra={})=>applyRoomCommand(room,`secret-${index}`,command(room,operation,extra),now);
test('old rooms produce a recoverable update message without rewriting their plans',()=>{
 const r=setup();delete r.schemaVersion;r.players[0].plan=['open','brace'];
 assert.throws(()=>requireCurrentRoom(r),e=>e.code==='room_updated'&&e.status===409);
 assert.deepEqual(r.players[0].plan,['open','brace']);
});
function memoryStore(room){
 let saved={room:structuredClone(room),version:0};
 return {
  read:async()=>structuredClone(saved),
  write:async(next,version)=>{if(saved.version!==version)return false;saved={room:structuredClone(next),version:version+1};return true;},
  snapshot:()=>structuredClone(saved),
 };
}

test('deadline preserves a locked plan and supplies explicit, non-strategic waits',()=>{
 const r=setup();act(r,0,'start');act(r,0,'commit',start+1,{plan:['open','brace']});
 refreshRoom(r,'secret-0',start+PLANNING_MS);
 assert.equal(r.status,'replay');assert.deepEqual(r.players[0].plan,['open','brace']);assert.deepEqual(r.players[1].plan,['wait','wait']);
 assert.equal(r.players[1].waitReason,'deadline');assert.equal(r.log.filter(e=>e.type==='crew_waited').length,2);
 assert.match(r.log.find(e=>e.type==='crew_waited').text,/timer ended/);
 const log=structuredClone(r.log);refreshRoom(r,'secret-0',start+PLANNING_MS+1);assert.deepEqual(r.log,log);
 assert.equal(validPlan(['wait','wait']),false);
});

test('two unattended plans reach a finished room, which the host can reset',()=>{
 const r=setup();act(r,0,'start');refreshRoom(r,'secret-0',r.planningDeadline);
 const nextAt=r.replayStartedAt+replayDuration(r);refreshRoom(r,'secret-0',nextAt);
 assert.equal(r.round,2);assert.equal(r.status,'planning');assert.equal(r.planningDeadline,nextAt+PLANNING_MS);assert.ok(r.players.every(p=>p.plan===null));
 refreshRoom(r,'secret-0',r.planningDeadline);refreshRoom(r,'secret-0',r.replayStartedAt+replayDuration(r));
 assert.equal(r.status,'finished');assert.equal(r.log.filter(e=>e.type==='crew_returned').length,1);
 act(r,0,'reset',nextAt+PLANNING_MS+10_000);assert.equal(r.status,'lobby');
});

test('early reveal has a grace period and explains why an unlocked player waits',()=>{
 const r=setup();act(r,0,'start');
 assert.ok(act(r,0,'reveal',start+29_999).error);assert.equal(r.status,'planning');
 assert.equal(act(r,1,'reveal',start+30_000).error.status,403);
 assert.equal(act(r,0,'reveal',start+30_000).error,undefined);
 assert.ok(r.players.every(p=>p.waitReason==='host'));assert.match(r.log[0].text,/host revealed/);
});

test('only the host can grant one extra minute, and a late extension cannot undo the deadline',()=>{
 const r=setup();act(r,0,'start');const deadline=r.planningDeadline;
 assert.equal(act(r,1,'extend').error.status,403);assert.equal(r.planningDeadline,deadline);
 assert.equal(act(r,0,'extend').error,undefined);assert.equal(r.planningDeadline,deadline+60_000);
 assert.ok(act(r,0,'extend').error);assert.equal(r.planningDeadline,deadline+60_000);
 assert.ok(act(r,0,'extend',r.planningDeadline).error);assert.equal(r.status,'replay');
});

test('a commit at the deadline is rejected after the timeout is retained',()=>{
 const r=setup();act(r,0,'start');const result=act(r,1,'commit',r.planningDeadline,{plan:['carry','push']});
 assert.ok(result.error);assert.equal(r.status,'replay');assert.deepEqual(r.players[1].plan,['wait','wait']);
});

test('duplicate commits are idempotent and a different plan cannot overwrite a locked one',()=>{
 const r=setup();act(r,0,'start');const plan=['open','brace'];
 act(r,0,'commit',start+1,{plan});assert.equal(act(r,0,'commit',start+2,{plan}).error,undefined);
 assert.ok(act(r,0,'commit',start+3,{plan:['push','push']}).error);assert.deepEqual(r.players[0].plan,plan);
 act(r,1,'commit',start+4,{plan:['carry','push']});const log=structuredClone(r.log);
 assert.equal(act(r,0,'commit',start+5,{plan}).error,undefined);assert.deepEqual(r.log,log);
});

test('presence is throttled and a present host cannot be displaced',()=>{
 const r=setup();assert.equal(needsRefresh(r,'secret-0',start+PRESENCE_INTERVAL_MS-1),false);
 refreshRoom(r,'secret-0',start+PRESENCE_INTERVAL_MS-1);assert.equal(r.players[0].lastSeenAt,start);
 refreshRoom(r,'secret-0',start+PRESENCE_INTERVAL_MS);assert.equal(r.players[0].lastSeenAt,start+PRESENCE_INTERVAL_MS);
 assert.ok(act(r,1,'takeover',start+HOST_AWAY_MS).error);assert.equal(r.hostId,'p0');
});

test('an absent host can be replaced without changing seats or locked plans',()=>{
 const r=setup();act(r,0,'start');act(r,0,'commit',start,{plan:['open','brace']});
 assert.ok(act(r,1,'takeover',start+HOST_AWAY_MS-1).error);
 assert.equal(act(r,1,'takeover',start+HOST_AWAY_MS).error,undefined);assert.equal(r.hostId,'p1');
 assert.equal(r.players.length,2);assert.deepEqual(r.players[0].plan,['open','brace']);
 assert.equal(act(r,0,'reset',start+HOST_AWAY_MS+1).error.status,403);
});

test('roster edits are restricted to the lobby and removed credentials stop working',()=>{
 const r=setup(3);assert.equal(act(r,1,'remove',start,{playerId:'p2'}).error.status,403);
 act(r,0,'start');assert.ok(act(r,0,'remove',start,{playerId:'p2'}).error);assert.ok(act(r,1,'leave').error);
 act(r,0,'reset');act(r,0,'remove',start,{playerId:'p2'});
 assert.equal(r.players.length,2);assert.throws(()=>publicView(r,'secret-2',1,start),e=>e instanceof RoomError&&e.code==='seat_revoked');
});

test('a leaving host transfers control and the final departure closes the room',()=>{
 const r=setup();assert.equal(act(r,0,'leave').left,true);assert.equal(r.hostId,'p1');
 assert.equal(act(r,1,'leave',start+1).left,true);assert.equal(r.players.length,0);assert.equal(r.expiresAt,start+1);
});

test('old mission and round commands cannot change a later game',()=>{
 const r=setup();const stale=command(r,'start');act(r,0,'reset');
 assert.ok(applyRoomCommand(r,'secret-0',stale,start).error);assert.equal(r.status,'lobby');
 act(r,0,'start');const previous=command(r,'commit',{plan:['open','brace']});
 refreshRoom(r,'secret-0',r.planningDeadline);refreshRoom(r,'secret-0',r.replayStartedAt+replayDuration(r));
 assert.ok(applyRoomCommand(r,'secret-0',previous,r.planningStartedAt+1).error);assert.equal(r.round,2);assert.equal(r.players[0].plan,null);
});

test('concurrent commits both survive a version conflict and resolve only once',async()=>{
 const r=setup();beginPlanning(r,start);const store=memoryStore(r);
 const results=await Promise.all([['open','brace'],['carry','push']].map((plan,i)=>updateVersionedRoom(store.read,store.write,room=>applyRoomCommand(room,`secret-${i}`,command(r,'commit',{plan}),start+1))));
 assert.ok(results.every(result=>!result.result.error));const saved=store.snapshot().room;
 assert.equal(saved.board.cake,'home');assert.equal(saved.frames.length,2);assert.equal(saved.log.filter(e=>e.type==='cake_home').length,1);
});

test('concurrent deadline polls and a late commit do not duplicate waits or replace them',async()=>{
 const r=setup();beginPlanning(r,start);const store=memoryStore(r);const deadline=r.planningDeadline;
 await Promise.all([
  updateVersionedRoom(store.read,store.write,room=>refreshRoom(room,'secret-0',deadline)),
  updateVersionedRoom(store.read,store.write,room=>refreshRoom(room,'secret-1',deadline)),
  updateVersionedRoom(store.read,store.write,room=>applyRoomCommand(room,'secret-1',command(r,'commit',{plan:['carry','push']}),deadline)),
 ]);
 const saved=store.snapshot().room;assert.equal(saved.status,'replay');assert.equal(saved.log.length,4);assert.ok(saved.players.every(p=>p.plan.every(a=>a==='wait')));
 assert.equal(new Set(saved.log.map(e=>e.id)).size,saved.log.length);
});

test('two host takeovers racing each other leave exactly one new host',async()=>{
 const r=setup(3);const store=memoryStore(r);
 const results=await Promise.all([1,2].map(i=>updateVersionedRoom(store.read,store.write,room=>applyRoomCommand(room,`secret-${i}`,command(r,'takeover'),start+HOST_AWAY_MS))));
 assert.equal(results.filter(r=>!r.result.error).length,1);assert.notEqual(store.snapshot().room.hostId,'p0');
});

test('concurrent replay completion records crew return only once',async()=>{
 const r=setup();act(r,0,'start');act(r,0,'commit',start,{plan:['open','brace']});act(r,1,'commit',start,{plan:['carry','push']});
 const store=memoryStore(r);const now=r.replayStartedAt+replayDuration(r);
 await Promise.all([0,1].map(i=>updateVersionedRoom(store.read,store.write,room=>refreshRoom(room,`secret-${i}`,now))));
 assert.equal(store.snapshot().room.log.filter(e=>e.type==='crew_returned').length,1);
});

test('the first reveal beat does not announce a later success or spill',()=>{
 for(const first of [['open','brace'],['open','distract']]){
  const r=setup();act(r,0,'start');act(r,0,'commit',start,{plan:first});act(r,1,'commit',start,{plan:['carry','push']});
  const view=publicView(r,'secret-0',1,start);assert.match(revealNote(view,0),/next moves are still to come/);
  assert.doesNotMatch(revealNote(view,0),/secured|rescue|report/);
  assert.match(revealNote(view,1),r.board.cake==='home'?/Cake secured/:/rescue plan/);
 }
});
