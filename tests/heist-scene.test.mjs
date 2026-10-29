import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,resolvePlan} from '../lib/game.ts';
import {heistScene} from '../lib/heist-scene.ts';

function resolve(plans){
 const players=plans.map((plan,i)=>({id:`p${i}`,token:`t${i}`,name:`Tester ${i}`,role:i,plan}));
 const room=createRoom('ABCDEF',players[0],1000);room.players=players;room.status='planning';resolvePlan(room,1000);return room;
}
test('the stage and map use the displayed beat, even when the final board has already won',()=>{
 const r=resolve([['open','brace'],['carry','push']]);
 assert.equal(r.board.cake,'home');
 const first=heistScene(r.board,r.frames[0]);
 assert.equal(first.board.cake,'wagon');assert.equal(first.delivered,false);assert.equal(first.open,true);
 assert.match(first.title,/aboard/);
 const second=heistScene(r.board,r.frames[1]);
 assert.equal(second.board.cake,'home');assert.equal(second.delivered,true);assert.equal(second.braced,true);assert.equal(second.open,false);
});
test('an unsecured loaded wagon spills, while an empty runaway does not invent a cake animation',()=>{
 const loaded=resolve([['open','distract'],['carry','push']]);
 const spill=heistScene(loaded.board,loaded.frames[1]);assert.equal(spill.spilled,true);assert.equal(spill.runaway,true);assert.equal(spill.board.cake,'grass');
 const empty=resolve([['open','carry'],['open','push']]);
 const runaway=heistScene(empty.board,empty.frames[1]);assert.equal(runaway.spilled,false);assert.equal(runaway.runaway,true);assert.equal(runaway.board.cake,'cooler');
});
test('planning and final scenes show persistent state without replaying old actions',()=>{
 const r=resolve([['open','distract'],['carry','push']]);
 const planning=heistScene(r.board);
 assert.equal(planning.spilled,false);assert.equal(planning.runaway,false);assert.equal(planning.open,false);assert.match(planning.title,/Rescue/);
 const finished=heistScene(r.board,undefined,true);assert.equal(finished.finished,true);assert.match(finished.title,/raccoons accounted/);assert.equal(finished.board.cake,'grass');
});
