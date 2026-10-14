import assert from 'node:assert/strict';
import * as THREE from 'three';
import {routePoint,routeFrame,projectRoute,ROAD_WIDTH,ROUTE_LENGTH} from '../races/js/Route.js';
import {initialLapState,updateLapProgress} from '../races/js/ScenicTrack.js';
import {CarController} from '../races/js/CarController.js';
import {CAR_CONFIGS,CHARACTERS} from '../races/js/config.js';
import {AIBot} from '../races/js/AIBot.js';
import {GameAudio} from '../races/js/Audio.js';
const saved=new Map();globalThis.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,String(v))};
assert.equal(new GameAudio().muted,true);
const quiet=new GameAudio();quiet.setMuted(false);quiet.setVolume(.2);assert.equal(new GameAudio().muted,false);assert.equal(new GameAudio().volume,.2);quiet.setMuted(true);
assert.ok(ROUTE_LENGTH>1000);
assert.ok(routePoint(0).distanceTo(routePoint(1))<1e-8);
for(let i=0;i<100;i++){const t=i/100,p=routePoint(t),r=projectRoute(p);assert.ok(r.distance<.08);assert.ok(Math.abs(r.y-p.y)<.02);}
const f=routeFrame(.35),car=new CarController(CAR_CONFIGS.SPORTS,f.p.clone().addScaledVector(f.normal,30),f.angle);car.resolveWalls();assert.ok(Math.abs(projectRoute(car.position).offset)<ROAD_WIDTH/2);
let lap=initialLapState();updateLapProgress(routePoint(.97),lap);updateLapProgress(routePoint(.01),lap);assert.equal(lap.lap,1,'cannot skip checkpoints');
lap=initialLapState();for(let loops=0;loops<3;loops++)for(let i=1;i<=360;i++)updateLapProgress(routePoint((i%360)/360),lap);assert.equal(lap.lap,4);
const scene=new THREE.Scene();const bots=CHARACTERS.slice(0,4).map((c,i)=>new AIBot(scene,c,i));bots.forEach(b=>b.start());
for(let i=0;i<60*240;i++){for(const b of bots)b.update(1/60,i/60);if(bots.every(b=>b.finished))break;}
console.log(JSON.stringify({routeMetres:Math.round(ROUTE_LENGTH),bots:bots.map(b=>({name:b.character.name,lap:b.lapState.lap,time:Math.round(b.finishTime),finished:b.finished}))},null,2));
assert.ok(bots.every(b=>b.finished),'AI must complete three laps on the replacement circuit');
console.log('PASS: route, collision, lap ordering, AI race completion, quiet defaults and preference persistence');
