import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {createRoomPoller} from '../lib/room-polling.ts';

test('returning to a tab refreshes promptly and coalesces wakeups during a request', async t => {
  const requests=[];
  const poller=createRoomPoller(signal=>new Promise(resolve=>requests.push({signal,resolve})), assert.fail, {intervalMs:10_000});
  t.after(()=>poller.stop());
  poller.wake();poller.wake();poller.wake();
  assert.equal(requests.length,1);
  requests[0].resolve();
  await delay(20);
  assert.equal(requests.length,2);
  requests[1].resolve();
  await delay(20);
  assert.equal(requests.length,2);
  poller.wake();
  assert.equal(requests.length,3); // Does not wait for the scheduled poll.
  requests[2].resolve();
});

test('a stalled request times out and polling can recover', async t => {
  let requests=0;
  let reportError;
  const failed=new Promise(resolve=>{reportError=resolve;});
  const poller=createRoomPoller(signal=>{
    requests++;
    if(requests>1)return Promise.resolve();
    return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new Error('timeout')),{once:true}));
  },reportError,{intervalMs:10_000,timeoutMs:20});
  t.after(()=>poller.stop());
  poller.wake();
  assert.equal((await failed).message,'timeout');
  poller.wake();
  await delay(20);
  assert.equal(requests,2);
});

test('leaving a room cancels its request and queued refresh without a stale error', async () => {
  let calls=0,errors=0,signal;
  const poller=createRoomPoller(s=>{
    calls++;signal=s;
    return new Promise((_,reject)=>s.addEventListener('abort',()=>reject(new Error('cancelled')),{once:true}));
  },()=>errors++,{intervalMs:1});
  poller.wake();poller.wake();poller.stop();poller.wake();
  await delay(20);
  assert.equal(signal.aborted,true);
  assert.equal(calls,1);
  assert.equal(errors,0);
});
