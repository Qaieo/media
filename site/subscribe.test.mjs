import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';
const env = { KIT_API_KEY: 'test-only', KIT_FORM_ID: '123', ASSETS: { fetch: () => new Response('asset') } };
function request(fields = {email:'reader@example.test'}) {
 return new Request('https://qaieo.com/api/subscribe', {method:'POST', body:new URLSearchParams(fields)});
}
test('inactive creation followed by form enrollment; server-only key', async t => {
 const calls=[];
 t.mock.method(globalThis,'fetch',async (url, options)=>{calls.push({url,options}); return Response.json({subscriber:{id:42,state:'inactive'}});});
 assert.equal((await worker.fetch(request(),env)).status,200);
 assert.equal(calls.length,2);
 assert.deepEqual(JSON.parse(calls[0].options.body),{email_address:'reader@example.test',state:'inactive'});
 assert.equal(calls[1].url,'https://api.kit.com/v4/forms/123/subscribers/42');
 assert.equal(calls[0].options.headers['X-Kit-Api-Key'],'test-only');
});
test('invalid, bot and missing configuration do not call Kit',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('must not call');});
 assert.equal((await worker.fetch(request({email:'bad'}),env)).status,400);
 assert.equal((await worker.fetch(request({email:'reader@example.test',company:'bot'}),env)).status,200);
 assert.equal((await worker.fetch(request(),{})).status,503);
});
test('cancelled subscription is not re-enrolled',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({subscriber:{id:42,state:'cancelled'}});});
 assert.equal((await worker.fetch(request(),env)).status,409);assert.equal(calls,1);
});
test('provider failure and timeout return generic errors',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('sensitive provider body',{status:429}));
 const failed=await worker.fetch(request(),env);assert.equal(failed.status,502);assert.doesNotMatch(await failed.text(),/sensitive/);
 t.mock.method(globalThis,'fetch',async()=>{throw Error('timeout');});
 assert.equal((await worker.fetch(request(),env)).status,502);
});
test('form failure is not reported as a successful signup',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>++calls===1 ? Response.json({subscriber:{id:42,state:'inactive'}}) : new Response('',{status:500}));
 assert.equal((await worker.fetch(request(),env)).status,502);
});
