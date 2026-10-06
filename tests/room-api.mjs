// Opt-in integration check against a LOCAL running dev server and its real D1.
// Uses isolated new rooms, waits for actual server deadlines, and logs no tokens.
import assert from 'node:assert/strict';
const base=process.argv[2]??'http://localhost:5173';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Use a local preview URL.');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function post(body,token,status=200){
 const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(base).origin,...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
 const value=await response.json();assert.equal(response.status,status,`${body.operation}: ${value.error??'unexpected response'}`);return value;
}
async function get(code,token,status=200){
 const response=await fetch(`${base}/api/room?code=${code}`,{headers:{Authorization:`Bearer ${token}`}});
 const value=await response.json();assert.equal(response.status,status,value.error);assert.match(response.headers.get('cache-control'),/no-store/);return value;
}
const cmd=(view,operation,extra={})=>({code:view.code,missionId:view.missionId,round:view.round,operation,...extra});
async function crew(){const host=await post({operation:'create',name:'API Host'});const guest=await post({operation:'join',name:'API Guest',code:host.room.code});return {host,guest};}
async function close(view,host,guest){
 const lobby=await post(cmd(view,'reset'),host.token);
 await post(cmd(lobby,'leave'),guest.token);await post(cmd(lobby,'leave'),host.token);
 assert.equal((await get(view.code,host.token,404)).code,'room_expired');
}

// Start the real two-minute deadline check while the faster cases run.
const idle=await crew();
const idlePlan=await post(cmd(idle.host.room,'start'),idle.host.token);
await post(cmd(idlePlan,'commit',{plan:['open','brace']}),idle.host.token);
console.log('Started real planning deadline check; one player will never commit.');

const {host,guest}=await crew();let view=await post(cmd(host.room,'start'),host.token);
await post(cmd(view,'reset'),guest.token,403);await post(cmd(view,'takeover'),guest.token,409);
view=await post(cmd(view,'extend'),host.token);assert.equal(view.planningExtended,true);
await post(cmd(view,'extend'),host.token,409);
const pair=await Promise.all([
 post(cmd(view,'commit',{plan:['open','brace']}),host.token),
 post(cmd(view,'commit',{plan:['carry','push']}),guest.token),
]);
view=await get(view.code,host.token);assert.equal(view.status,'replay');assert.equal(view.board.cake,'home');
assert.equal(view.frames[0].after.cake,'wagon');assert.equal(view.frames[1].after.cake,'home');
assert.ok(!JSON.stringify(view).includes(host.token)&&!JSON.stringify(view).includes(guest.token));
await post(cmd(view,'commit',{plan:['open','brace']}),host.token);
await sleep(7_300);view=await get(view.code,host.token);assert.equal(view.status,'finished');
assert.equal(view.log.filter(e=>e.type==='cake_home').length,1);assert.equal(view.log.filter(e=>e.type==='crew_returned').length,1);
const lobby=await post(cmd(view,'reset'),host.token);
await post(cmd(lobby,'remove',{playerId:guest.room.you.id}),host.token);
assert.equal((await get(view.code,guest.token,401)).code,'seat_revoked');
await post(cmd(lobby,'leave'),host.token);assert.equal((await get(view.code,host.token,404)).code,'room_expired');
console.log('Passed real D1 concurrent commit, duplicate commit, clean reveal, permissions, removal and final-room closure.');

await sleep(Math.max(0,idlePlan.serverNow+46_000-Date.now()));
let recovered=await get(idlePlan.code,idle.guest.token);
assert.equal(recovered.players.find(p=>p.id===recovered.hostId).away,true);
recovered=await post(cmd(recovered,'takeover'),idle.guest.token);assert.equal(recovered.hostId,idle.guest.room.you.id);
assert.equal(recovered.players.find(p=>p.id===idle.host.room.you.id).ready,true);
console.log('Passed host takeover after actual absence; the previous host’s locked plan survived.');

await sleep(Math.max(0,idlePlan.planningDeadline+100-Date.now()));
await post(cmd(idlePlan,'commit',{plan:['carry','push']}),idle.guest.token,409);
recovered=await get(idlePlan.code,idle.guest.token);
assert.equal(recovered.status,'replay');assert.deepEqual(recovered.you.plan,['wait','wait']);
assert.equal(recovered.log.filter(e=>e.type==='crew_waited').length,2);
const original=await get(idlePlan.code,idle.host.token);assert.deepEqual(original.you.plan,['open','brace']);
await sleep(7_300);recovered=await get(idlePlan.code,idle.guest.token);
assert.equal(recovered.status,'planning');assert.equal(recovered.round,2);assert.ok(recovered.planningDeadline>recovered.serverNow+119_000);
await close(recovered,idle.guest,idle.host);
console.log('Passed real deadline, late commit rejection, visible waits, intact locked plan and full rescue timer.');
