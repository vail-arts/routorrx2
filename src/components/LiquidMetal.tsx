'use client';
import {useEffect,useRef} from 'react';
export default function LiquidMetal(){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{
const c=ref.current;if(!c)return;const gl=c.getContext('webgl',{alpha:true,antialias:false});if(!gl)return;
const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);return s;};
const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;uniform vec2 resolution;uniform float time;uniform float intensity;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.02+13.1;a*=.5;}return v;}
void main(){vec2 p=gl_FragCoord.xy/resolution*3.;p.x*=resolution.x/resolution.y;float t=time*.035;vec2 q=vec2(fbm(p+t),fbm(p+3.));vec2 r=vec2(fbm(p+4.*q+t),fbm(p+4.*q+5.));float f=fbm(p+3.*r);float ramp=smoothstep(.44,.58,f);float spec=pow(ramp,8.);float dark=pow(1.-ramp,3.);float v=(.025+spec*.38-dark*.025)*(1.+intensity*.2);gl_FragColor=vec4(vec3(v),1.);}`);
const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
const resolution=gl.getUniformLocation(program,'resolution');
const time=gl.getUniformLocation(program,'time');
const intensity=gl.getUniformLocation(program,'intensity');
const media=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,last=0,target=0,value=0,scale=.42,visible=false;
const move=()=>{target=1};
const resize=()=>{c.width=Math.max(1,Math.min(850,c.clientWidth*scale));c.height=Math.max(1,Math.min(600,c.clientHeight*scale));gl.viewport(0,0,c.width,c.height);};
function draw(t:number){
  frame=requestAnimationFrame(draw);
  if(t-last<50)return;
  if(last&&t-last>140&&scale>.27){scale=.27;resize();}
  last=t;value+=(target-value)*.06;target*=.95;
  gl!.uniform2f(resolution,c!.width,c!.height);gl!.uniform1f(time,t/1000);gl!.uniform1f(intensity,value);gl!.drawArrays(gl!.TRIANGLES,0,6);
}
function sync(){
  cancelAnimationFrame(frame);last=0;
  if(visible&&!document.hidden&&!media.matches)frame=requestAnimationFrame(draw);
}
const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
observer.observe(c);
const size=new ResizeObserver(resize);size.observe(c);
document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);c.parentElement?.addEventListener('pointermove',move,{passive:true});
return()=>{observer.disconnect();size.disconnect();cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',sync);c.parentElement?.removeEventListener('pointermove',move);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.deleteBuffer(buffer);};},[]);return <canvas aria-hidden="true" ref={ref} className="liquid"/>}
