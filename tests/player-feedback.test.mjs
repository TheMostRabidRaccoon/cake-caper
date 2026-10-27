import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,resolvePlan,advanceReplay,planningBriefing,report} from '../lib/game.ts';
function room(plans){
 const players=plans.map((plan,i)=>({id:`p${i}`,token:`test-${i}`,name:`Tester ${i+1}`,role:i,plan}));
 const r=createRoom('ABCDEF',players[0],1000);r.players=players;r.status='planning';return r;
}

test('the reported two-player attempt explains the closed lid and never invents accessible cake',()=>{
 const r=room([['open','carry'],['open','push']]);
 resolvePlan(r,1000);
 assert.equal(r.board.cake,'cooler');assert.equal(r.board.wagon,'slope');assert.equal(r.board.dogAwake,true);
 assert.equal(r.log.filter(e=>e.type==='cake_spilled').length,0);
 advanceReplay(r,10000);
 assert.equal(r.round,2);
 assert.match(planningBriefing(r).title,/still in the cooler/);
 assert.match(planningBriefing(r).detail,/opened the lid, but nobody carried while it was open/);
 r.players[0].plan=['push','distract'];r.players[1].plan=['distract','push'];
 resolvePlan(r,11000);advanceReplay(r,20000);
 assert.equal(report(r).won,false);assert.equal(report(r).returned,2);
 const distractions=r.log.filter(e=>e.type==='dog_distracted');
 assert.equal(distractions.length,2);
 for(const event of distractions){assert.match(event.text,/cake is still in the cooler/);assert.doesNotMatch(event.text,/cake is reachable|dropped cake/);}
 for(const event of r.log.filter(e=>e.round===2&&e.type==='wagon_runaway')){
  assert.match(event.text,/empty wagon/);assert.match(event.text,/dog stays awake/);assert.doesNotMatch(event.text,/wakes the dog/);
 }
});

test('second-plan briefings distinguish unopened cake, a loaded wagon, and a dropped cake',()=>{
 const r=room([['distract','brace'],['distract','brace']]);resolvePlan(r,1000);advanceReplay(r,10000);
 assert.match(planningBriefing(r).detail,/spring-loaded lid/);
 assert.doesNotMatch(planningBriefing(r).detail,/last plan opened/);
 r.board.cake='wagon';assert.match(planningBriefing(r).detail,/No need to carry it again/);
 r.board.cake='grass';r.board.dogAwake=true;assert.match(planningBriefing(r).detail,/distraction and a carry/);
 r.board.dogAwake=false;assert.match(planningBriefing(r).detail,/dog is asleep/);
});

test('distraction feedback reflects the cake location and retains actual event counts',()=>{
 for(const cake of ['cooler','wagon','grass','home']){
  const r=room([['distract','brace'],['brace','brace']]);r.board.cake=cake;r.board.dogAwake=true;
  resolvePlan(r,1000);
  const event=r.log.find(e=>e.type==='dog_distracted');
  assert.ok(event);assert.equal(report(r).successfulDistractions,1);
  if(cake==='grass')assert.match(event.text,/collect the dropped cake on this beat/);
  else{assert.match(event.text,new RegExp(cake));assert.doesNotMatch(event.text,/collect the dropped cake|cake is reachable/);}
 }
});

test('a corrected second plan can recover the playtest mistake without changing the puzzle',()=>{
 const r=room([['open','carry'],['open','push']]);resolvePlan(r,1000);advanceReplay(r,10000);
 r.players[0].plan=['open','brace'];r.players[1].plan=['carry','push'];resolvePlan(r,11000);advanceReplay(r,20000);
 assert.equal(report(r).won,true);assert.equal(report(r).spills,0);assert.equal(report(r).returned,2);
});
