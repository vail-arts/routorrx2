// Local fixture services only. Never load-test public providers.
import {createServer} from 'node:http';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3100';let hits=0;
const fixture=createServer(async(req,res)=>{hits++;let raw='';for await(const part of req)raw+=part;res.setHeader('Content-Type','application/json');if(req.url.startsWith('/search'))res.end(JSON.stringify([{display_name:'Test landmark',lat:'20.27',lon:'73.0'}]));else if(req.url.startsWith('/weather'))res.end(JSON.stringify({current:{temperature_2m:30,relative_humidity_2m:60,time:'2026-11-01T12:00',weather_code:0}}));else{assert.equal(JSON.parse(raw).costing,'pedestrian');res.end(JSON.stringify({trip:{summary:{length:1.2,time:900},legs:[{shape:'_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI',maneuvers:[{instruction:'Test walking instruction'}]}]}}));}});
await new Promise(r=>fixture.listen(3101,'127.0.0.1',r));
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3100','--hostname','127.0.0.1'],{env:{...process.env,SERVICES_ENABLED:'true',VALHALLA_URL:'http://127.0.0.1:3101/route',GEOCODER_URL:'http://127.0.0.1:3101/search',WEATHER_URL:'http://127.0.0.1:3101/weather',DAILY_REQUEST_LIMIT:'20'},stdio:'ignore'});
try{
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const post=(service,body,customOrigin=origin)=>fetch(origin+'/api/'+service,{method:'POST',headers:{Origin:customOrigin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 for(const p of ['/','/features','/technology','/impact','/experience','/app','/manifest.webmanifest','/sw.js','/offline.html'])assert.equal((await fetch(origin+p)).status,200,p);
 assert.equal((await post('search',{query:'Silvassa'},'https://evil.example')).status,403);
 assert.equal((await post('search',{query:'a'.repeat(5000)})).status,413);
 assert.equal((await post('ai',{})).status,503);
 const s=await post('search',{query:'Silvassa'});assert.equal(s.status,200);assert.equal((await s.json())[0].lat,20.27);
 assert.equal((await post('search',{query:'Silvassa'})).status,429);
 const r=await post('route',{from:{lat:20.27,lon:73},to:{lat:20.28,lon:73.01}});assert.equal(r.status,200);const routes=await r.json();assert.equal(routes[0].duration,900);assert.equal(routes[0].coordinates.length,3);
 const w=await post('weather',{point:{lat:20.27,lon:73}});assert.equal(w.status,200);assert.equal((await w.json()).temperature_2m,30);
 assert.equal(hits,3);
 console.log('PASS: 9 page/asset responses; origin, body limit, disabled AI, throttling, and 3 service adapters. Only 3 local fixture calls; no external requests.');
}finally{server.kill('SIGTERM');fixture.close();}
