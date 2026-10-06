import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVE_SEAT_KEY,isSession,readSavedSeats,rememberSeat,forgetSeat,isTerminalRoomError} from '../lib/seat-storage.ts';

function storage(){const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};}
const seat=i=>({code:'ABCDEF',token:`secret-${i}`,playerId:`p${i}`,name:`Raccoon ${i}`,expiresAt:10_000});
test('several seats survive closing a tab and each tab keeps its own active seat',()=>{
 const local=storage(),tabA=storage(),tabB=storage();
 for(const i of [0,1])rememberSeat(local,seat(i));
 tabA.setItem(ACTIVE_SEAT_KEY,JSON.stringify(seat(0)));tabB.setItem(ACTIVE_SEAT_KEY,JSON.stringify(seat(1)));
 tabA.removeItem(ACTIVE_SEAT_KEY);assert.equal(JSON.parse(tabB.getItem(ACTIVE_SEAT_KEY)).token,seat(1).token);
 assert.deepEqual(readSavedSeats(local,1).map(s=>s.playerId),['p0','p1']);
 const newTab=storage();assert.equal(newTab.getItem(ACTIVE_SEAT_KEY),null); // A new tab must explicitly choose a seat.
});
test('expired or damaged records do not become resume choices',()=>{
 const local=storage();rememberSeat(local,seat(0));local.setItem('cake-caper-seat:broken','not JSON');
 local.setItem('cake-caper-seat:missing','{"code":"ABCDEF"}');local.setItem('unrelated','{}');
 assert.equal(readSavedSeats(local,1).length,1);assert.equal(readSavedSeats(local,10_000).length,0);
 assert.equal(isSession({code:'ABCDEF',token:'old-session-token'}),true);
 assert.equal(isSession({code:'ABCDEF',token:null}),false);
});
test('forgetting a revoked seat preserves the other raccoon on this device',()=>{
 const local=storage();rememberSeat(local,seat(0));rememberSeat(local,seat(1));forgetSeat(local,seat(0).token);
 assert.deepEqual(readSavedSeats(local,1),[seat(1)]);
});
test('unavailable storage is recoverable and only terminal room errors retire a seat',()=>{
 const blocked={get length(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
 assert.deepEqual(readSavedSeats(blocked),[]);assert.equal(rememberSeat(blocked,seat(0)),false);
 for(const code of ['seat_revoked','room_expired','room_updated'])assert.equal(isTerminalRoomError(code),true);
 for(const code of ['room_unavailable','room_action_rejected',undefined])assert.equal(isTerminalRoomError(code),false);
});
