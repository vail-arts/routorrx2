'use client';
import {useEffect,useRef} from 'react';

const title='VAIL ARTS';
const trailLength=8;
const wakeDuration=780;

// One point sprite per bright sample of the letters, with a short, fading pointer trail.
const vertex=`
  attribute vec4 grain;
  uniform vec4 view; // CSS width, height, sampling pitch, device scale
  uniform vec4 touches[8]; // x, y, strength, radius
  uniform vec3 origin;
  uniform vec4 grab; // pickup and destination in frame coordinates
  uniform float tension, arrival;
  varying float silver;
  void main(){
    vec2 home=origin.xy+grain.xy*origin.z, pos=home;
    float seed=grain.w, angle=seed*6.28318;
    vec2 drift=vec2(cos(angle),sin(angle));
    float depth=0.;
    for(int i=0;i<8;i++){
      vec2 delta=home-touches[i].xy;
      float dist=length(delta);
      float force=touches[i].z*(1.-smoothstep(0.,max(1.,touches[i].w),dist));
      vec2 normal=delta/max(1.,dist);
      pos+=(normal*.65+drift*.75+vec2(-normal.y,normal.x)*.35)*force*touches[i].w*.65;
      depth+=force;
    }
    vec2 excursion=pos-home;
    pos=home+excursion/(1.+length(excursion)/72.);
    vec2 travel=grab.zw-grab.xy;
    float pickup=1.-smoothstep(view.x*.09,view.x*.52,distance(home,grab.xy));
    float weight=tension*pickup*(.22+.88*seed);
    pos+=(travel+drift*length(travel)*.23)*weight;
    pos+=drift*arrival*mix(14.,min(100.,view.x*.16),seed);
    gl_Position=vec4(pos/view.xy*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
    gl_PointSize=max(1.,view.z*view.w*origin.z*(1.42+.40*seed+.18*min(depth,2.)));
    silver=mix(.63,1.,seed)*sqrt(grain.z);
  }`;
const fragment=`
  precision mediump float;
  varying float silver;
  void main(){
    float alpha=1.-smoothstep(.23,.5,length(gl_PointCoord-.5));
    gl_FragColor=vec4(vec3(.97),alpha*silver);
  }`;

function makeProgram(gl:WebGLRenderingContext){
  const program=gl.createProgram();
  if(!program)return null;
  for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const){
    const shader=gl.createShader(type);
    if(!shader){gl.deleteProgram(program);return null;}
    gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if(gl.getProgramParameter(program,gl.LINK_STATUS))return program;
  gl.deleteProgram(program);return null;
}

function particleMask(word:HTMLElement,pitch:number){
  const mask=document.createElement('canvas');
  mask.width=Math.ceil(word.offsetWidth/pitch);mask.height=Math.ceil(word.offsetHeight/pitch);
  const ctx=mask.getContext('2d');
  if(!ctx)return new Float32Array();
  const style=getComputedStyle(word),bounds=word.getBoundingClientRect();
  const scale=word.offsetWidth/bounds.width;
  const baseline=word.querySelector('.wordmark-baseline')!.getBoundingClientRect().top;
  const text=word.querySelector('.wordmark-ink')!.firstChild!;
  ctx.scale(1/pitch,1/pitch);ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  ctx.fillStyle='#fff';
  const range=document.createRange();
  for(let i=0;i<title.length;i++){
    range.setStart(text,i);range.setEnd(text,i+1);
    ctx.fillText(title[i],(range.getBoundingClientRect().left-bounds.left)*scale,(baseline-bounds.top)*scale);
  }
  const pixels=ctx.getImageData(0,0,mask.width,mask.height).data,points:number[]=[];
  for(let i=0;i<pixels.length/4;i++){
    const alpha=pixels[i*4+3];
    if(alpha<=34)continue;
    const seed=Math.sin(i*78.233)*43758.5453;
    const jitter=seed-Math.floor(seed);
    points.push((i%mask.width+.32+jitter*.36)*pitch,(Math.floor(i/mask.width)+.68-jitter*.36)*pitch,alpha/255,jitter);
  }
  return new Float32Array(points);
}

export default function WordmarkParticles(){
  const ref=useRef<HTMLElement>(null);
  useEffect(()=>{
    const word=ref.current!,frame=word.closest<HTMLElement>('.studio-frame')!,canvas=frame.querySelector('canvas')!;
    const quiet=matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)');
    let gl:WebGLRenderingContext|null=null,program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null;
    let view:WebGLUniformLocation|null=null,touches:WebGLUniformLocation|null=null,arrival:WebGLUniformLocation|null=null;
    let origin:WebGLUniformLocation|null=null,grab:WebGLUniformLocation|null=null,tension:WebGLUniformLocation|null=null;
    const pull={fromX:0,fromY:0,x:0,y:0,strength:0,held:false};
    let pointerId:number|null=null,lastFrame=0;
    let visible=false,dirty=true,attempted=false,raf=0,count=0,started=0,pitch=0,dpr=1;
    const wake:{x:number;y:number;at:number;power:number}[]=[];
    const uniforms=new Float32Array(trailLength*4);

    function initialize(){
      gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:true});
      if(!gl)return false;
      program=makeProgram(gl);if(!program)return false;
      gl.useProgram(program);buffer=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      const attr=gl.getAttribLocation(program,'grain');
      gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,4,gl.FLOAT,false,0,0);
      view=gl.getUniformLocation(program,'view');touches=gl.getUniformLocation(program,'touches[0]');
      arrival=gl.getUniformLocation(program,'arrival');origin=gl.getUniformLocation(program,'origin');
      grab=gl.getUniformLocation(program,'grab');tension=gl.getUniformLocation(program,'tension');
      gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      started=performance.now();return true;
    }
    function render(now:number){
      raf=0;
      if(!program){
        if(attempted)return;
        attempted=true;if(!initialize())return;
      }
      if(!gl)return;
      const width=canvas.clientWidth,height=canvas.clientHeight;
      if(!width||!height)return;
      if(dirty){
        dpr=Math.min(2,window.devicePixelRatio||1,2400/Math.max(width,height));
        pitch=Math.max(1.15,word.offsetWidth/475);
        canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
        gl.viewport(0,0,canvas.width,canvas.height);
        const points=particleMask(word,pitch);count=points.length/4;
        gl.bufferData(gl.ARRAY_BUFFER,points,gl.STATIC_DRAW);dirty=false;
      }
      if(!count){frame.removeAttribute('data-particles');word.removeAttribute('tabindex');return;}
      while(wake.length&&now-wake[0].at>=wakeDuration)wake.shift();
      uniforms.fill(0);
      const radius=Math.max(40,Math.min(105,width*.14));
      wake.forEach((p,i)=>{
        const age=Math.max(0,(now-p.at)/wakeDuration);
        const strength=Math.min(1,.2+age*12)*(1-age)**2*p.power;
        uniforms.set([p.x,p.y,strength,radius],i*4);
      });
      const forming=Math.max(0,1-(now-started)/1000)**3;
      const bounds=canvas.getBoundingClientRect(),letters=word.getBoundingClientRect(),scale=width/bounds.width;
      gl.uniform3f(origin,(letters.left-bounds.left)*scale,(letters.top-bounds.top)*scale,letters.width*scale/word.offsetWidth);
      const follow=1-Math.exp(-Math.min(60,now-(lastFrame||now-16))/(pull.held?90:140));
      lastFrame=now;pull.strength+=((pull.held?1:0)-pull.strength)*follow;
      if(!pull.held&&pull.strength<.002)pull.strength=0;
      gl.uniform4f(grab,pull.fromX,pull.fromY,pull.x,pull.y);gl.uniform1f(tension,pull.strength);
      gl.uniform4f(view,width,height,pitch,dpr);gl.uniform4fv(touches,uniforms);
      gl.uniform1f(arrival,forming);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.POINTS,0,count);
      if(!frame.hasAttribute('data-particles')){frame.setAttribute('data-particles','');word.tabIndex=0;}
      word.toggleAttribute('data-forming',forming>0);
      word.toggleAttribute('data-scattering',wake.length>0);
      if(wake.length||forming>0||Math.abs((pull.held?1:0)-pull.strength)>.001)schedule();
    }
    function schedule(){if(!raf&&visible&&!document.hidden&&!quiet.matches)raf=requestAnimationFrame(render);}
    function sampleAgain(){dirty=true;schedule();}
    function sync(){
      cancelAnimationFrame(raf);raf=0;
      if(quiet.matches||!visible||document.hidden){
        release();pull.strength=0;wake.length=0;frame.removeAttribute('data-particles');
        word.removeAttribute('tabindex');word.removeAttribute('data-scattering');
      }
      schedule();
    }
    function point(e:PointerEvent){
      const rect=canvas.getBoundingClientRect(),scale=canvas.clientWidth/rect.width;
      return {x:Math.max(0,Math.min(canvas.clientWidth,(e.clientX-rect.left)*scale)),
        y:Math.max(0,Math.min(canvas.clientHeight,(e.clientY-rect.top)*scale))};
    }
    function pickup(x:number,y:number){
      const rect=canvas.getBoundingClientRect(),letters=word.getBoundingClientRect(),scale=canvas.clientWidth/rect.width;
      const left=(letters.left-rect.left)*scale,right=(letters.right-rect.left)*scale;
      pull.fromX=Math.max(left,Math.min(right,x));pull.fromY=(letters.top+letters.height/2-rect.top)*scale;
      pull.x=x;pull.y=y;pull.held=true;frame.setAttribute('data-grabbing','');schedule();
    }
    function down(e:PointerEvent){
      if(!count||!visible||quiet.matches||!e.isPrimary||e.button!==0)return;
      const p=point(e);pickup(p.x,p.y);pointerId=e.pointerId;frame.setPointerCapture(e.pointerId);
      contact(e);
    }
    function release(){
      pull.held=false;frame.removeAttribute('data-grabbing');
      const id=pointerId;pointerId=null;
      if(id!==null&&frame.hasPointerCapture(id))frame.releasePointerCapture(id);
      if(pull.strength)schedule();
    }
    function up(e:PointerEvent){if(e.pointerId===pointerId)release();}
    function key(e:KeyboardEvent){
      if(e.key==='Escape'){release();return;}
      const directions:Record<string,number[]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      const dir=directions[e.key];if(!dir||!count||quiet.matches)return;
      e.preventDefault();
      if(!pull.held)pickup(canvas.clientWidth/2,canvas.clientHeight/2);
      pull.x=Math.max(0,Math.min(canvas.clientWidth,pull.x+dir[0]*canvas.clientWidth*.15));
      pull.y=Math.max(0,Math.min(canvas.clientHeight,pull.y+dir[1]*canvas.clientHeight*.15));schedule();
    }
    function contact(e:PointerEvent){
      if(!visible||quiet.matches||!count||(pointerId!==null&&pointerId!==e.pointerId))return;
      const {x,y}=point(e);
      if(pointerId===e.pointerId){pull.x=x;pull.y=y;schedule();}
      const now=performance.now(),last=wake.at(-1);
      if(last&&now-last.at<24&&e.type!=='pointerdown')return;

      const distance=last?Math.hypot(x-last.x,y-last.y):30;
      wake.push({x,y,at:now,power:Math.min(1,.40+distance/48)});
      if(wake.length>trailLength)wake.shift();
      schedule();
    }
    function restored(){attempted=false;sampleAgain();}
    function lost(e:Event){e.preventDefault();cancelAnimationFrame(raf);raf=0;program=null;count=0;frame.removeAttribute('data-particles');word.removeAttribute('tabindex');word.removeAttribute('data-scattering');}
    const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
    const resize=new ResizeObserver(sampleAgain);resize.observe(word);resize.observe(canvas);visibility.observe(frame);
    frame.addEventListener('pointermove',contact,{passive:true});frame.addEventListener('pointerdown',down);
    frame.addEventListener('pointerup',up);frame.addEventListener('pointercancel',up);frame.addEventListener('lostpointercapture',up);
    word.addEventListener('keydown',key);word.addEventListener('blur',release);
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('blur',release);
    quiet.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
    document.fonts.addEventListener('loadingdone',sampleAgain);
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
    return ()=>{
      cancelAnimationFrame(raf);resize.disconnect();visibility.disconnect();gl?.deleteBuffer(buffer);gl?.deleteProgram(program);
      frame.removeEventListener('pointermove',contact);frame.removeEventListener('pointerdown',down);
      frame.removeEventListener('pointerup',up);frame.removeEventListener('pointercancel',up);frame.removeEventListener('lostpointercapture',up);
      word.removeEventListener('keydown',key);word.removeEventListener('blur',release);
      window.removeEventListener('scroll',schedule);window.removeEventListener('blur',release);
      quiet.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);
      document.fonts.removeEventListener('loadingdone',sampleAgain);
      canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);
    };
  },[]);
  return <><div className="studio-type"><strong ref={ref} className="particle-wordmark" aria-description="Drag to scatter. Arrow keys move the particles. Escape brings them home."><span className="wordmark-ink">{title}</span><i className="wordmark-baseline" aria-hidden="true"/></strong></div><canvas className="studio-particles" aria-hidden="true"/></>;
}
