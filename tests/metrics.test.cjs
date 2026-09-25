const { test } = require('node:test');
const assert = require('node:assert/strict');
const metrics = require('../metrics.js');
test('calendar periods start at midnight in Mato Grosso do Sul, even across UTC midnight', () => {
  const now = new Date('2026-09-25T02:30:00Z');
  assert.equal(metrics.periodStart('1', now), '2026-09-24T04:00:00.000Z');
  assert.equal(metrics.periodStart('7', now), '2026-09-18T04:00:00.000Z');
  assert.equal(metrics.periodStart('all', now), null);
  assert.equal(metrics.dayKey(now), '2026-09-24');
});
test('conversion deduplicates sessions and excludes historic bubble clicks', () => {
  const rows = [
    { event_type:'page_view',session_id:'a' },{ event_type:'page_view',session_id:'a' },{ event_type:'page_view',session_id:'b' },
    { event_type:'whatsapp_click',session_id:'a',details:{href:''} },
    { event_type:'whatsapp_click',session_id:'a',details:{href:'https://wa.me/123'} },
    { event_type:'whatsapp_click',session_id:'a',details:{href:'https://wa.me/123'} }
  ];
  assert.equal(metrics.summarize(rows).rate,50);
  assert.equal(metrics.summarize(rows).clicks,2);
  assert.equal(metrics.summarize(rows).sessions,2);
});
test('active-time average uses one maximum per page view and includes zero-duration views', () => {
  const row=(event_type,view_id,duration_seconds)=>({event_type,session_id:'a',duration_seconds,details:{version:2,view_id}});
  const data=[row('page_view','1',null),row('time_active','1',10),row('time_active','1',20),row('page_view','2',null),
    {event_type:'time_active',session_id:'old',duration_seconds:600}];
  assert.equal(metrics.summarize(data).average,10);
  assert.equal(metrics.summarize([]).average,null);
});
test('event fetch paginates beyond the API row limit and applies no lower bound for all time', async () => {
  const ranges=[], filters=[];
  const query={select(){return this;},lte(){return this;},gte(...args){filters.push(args);return this;},order(){return this;},range(a,b){ranges.push([a,b]);return Promise.resolve({data:Array.from({length:a===0?1000:1},(_,i)=>({id:a+i})),error:null});}};
  const client={from(){return query;}};
  const rows=await metrics.fetchEvents(client,'all');
  assert.equal(rows.length,1001);assert.deepEqual(ranges,[[0,999],[1000,1999]]);assert.equal(filters.length,0);
});
test('failed queries propagate instead of showing misleading empty statistics', async () => {
  const query={select(){return this;},lte(){return this;},gte(){return this;},order(){return this;},range(){return Promise.resolve({data:null,error:new Error('offline')});}};
  await assert.rejects(metrics.fetchEvents({from:()=>query},'1'),/offline/);
});
