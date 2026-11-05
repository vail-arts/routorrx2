import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const temp=mkdtempSync(join(tmpdir(),'routorrx-tests-'));
execFileSync(process.execPath,['node_modules/typescript/bin/tsc','src/lib/core.ts','src/lib/validation.ts','--target','ES2022','--module','commonjs','--types','node','--skipLibCheck','--outDir',temp]);
const {point,withinCity,decodePolyline,Budget,weatherAdvice}=createRequire(import.meta.url)(join(temp,'core.js'));
process.on('exit',()=>rmSync(temp,{recursive:true,force:true}));
test('coordinates reject malformed and nonfinite inputs',()=>{for(const p of [null,{}, {lat:NaN,lon:1},{lat:91,lon:1},{lat:1,lon:-181},{lat:'20',lon:73}])assert.throws(()=>point(p));assert.equal(point({lat:20,lon:73}).name,'Selected location');});
test('pilot distance restriction',()=>{assert.ok(withinCity({lat:20.27,lon:73},{lat:20.28,lon:73}));assert.ok(!withinCity({lat:20,lon:73},{lat:21,lon:73}));});
test('decodes Valhalla polyline6 in longitude latitude order',()=>{assert.deepEqual(decodePolyline('_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI'),[[-120.2,38.5],[-120.95,40.7],[-126.453,43.252]]);assert.throws(()=>decodePolyline('~~~~~~'));});
test('request cap cannot be bypassed by switching services',()=>{const b=new Budget();b.take('search',10000,2);assert.throws(()=>b.take('search',10500,2),/wait/);b.take('route',12000,2);assert.throws(()=>b.take('weather',14000,2),/budget/);b.take('weather',86420000,2);});
test('zero request budget fails closed',()=>assert.throws(()=>new Budget().take('route',10000,0),/budget/));
test('weather advisory is deterministic',()=>{assert.match(weatherAdvice(36),/High heat/);assert.match(weatherAdvice(29),/Warm/);});

const {validResponse,isDraft}=createRequire(import.meta.url)(join(temp,'validation.js'));
test('provider responses reject malformed geometry and values',()=>{assert.ok(!validResponse('route',[{distance:1,duration:10,coordinates:[[181,20],[73,20]],steps:[]}]));assert.ok(!validResponse('search',[{name:'Place',lat:'20',lon:73}]));assert.ok(validResponse('search',[]));assert.ok(!validResponse('weather',{temperature_2m:30,relative_humidity_2m:150,time:'now',weather_code:0}));});
test('assistant rejects missing, blank and oversized output',()=>{for(const value of [null,{}, {answer:' '},{answer:'a'.repeat(6001)}])assert.ok(!validResponse('assistant',value));assert.ok(validResponse('assistant',{answer:'Check the crossing on site.'}));});
test('corrupted local reports are rejected',()=>{for(const value of [null,{}, {id:'x',type:'path',note:'test',point:null,created:'bad',status:'verified'}])assert.ok(!isDraft(value));});
