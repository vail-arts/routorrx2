// Orthographic street model. Fit the complete model to its display area.
type Point=[number,number,number]; // east, elevation, south
type Face={points:Point[];tone:number;depth:number};
const fixed:Face[]=[];
let faces=fixed,depth=0;
function face(points:Point[],tone:number){faces.push({points,tone,depth});}
function slab(x:number,z:number,w:number,d:number,y:number,tone:number){
  face([[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d]],tone);
}
function block(x:number,z:number,w:number,d:number,y:number,h:number,tone:number){
  face([[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z]],tone-43);
  face([[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]],tone-24);
  slab(x,z,w,d,y+h,tone);
}
function tree(x:number,z:number,h:number){
  depth=x+z;block(x-.09,z-.09,.18,.18,0,h,122);
  const ring:Point[]=Array.from({length:7},(_,i)=>[x+Math.cos(i*.898)*.65,h+.56,z+Math.sin(i*.898)*.62]);
  const top:Point=[x-.13,h+1.38,z],bottom:Point=[x,h-.18,z];
  for(const i of [4,5,3,6,2,0,1]){
    const next=ring[(i+1)%7];face([ring[i],next,bottom],93+i*5);face([ring[i],top,next],143+i*6);
  }
}
depth=-100;block(-5,-3.5,10,7,-.38,.38,102);
depth=-99;slab(-5,-1.2,10,2.55,.01,59);
block(-5,-3.5,10,2.3,.01,.09,172);block(-5,1.35,10,2.15,.01,.09,177);
for(let x=-4.7;x<5;x+=1.1)slab(x,.02,.56,.045,.03,125);
for(let z=-1.12;z<1.3;z+=.36)slab(.8,z,1.35,.17,.04,224);
for(let x=-4.5;x<5;x+=.9)for(const [z,d] of [[-3.5,2.3],[1.35,2.15]])slab(x,z,.018,d,.105,142);
// A small shop with glazed bays, horizontal fascia and a striped canopy.
depth=-6;block(-4.7,-3.35,3.8,1.65,.1,2.12,163);
block(-4.8,-3.43,4,1.83,2.22,.14,214);
for(let i=0;i<4;i++){
  block(-4.56+i*.92,-1.70,.77,.035,.29,1.32,76);
  block(-4.49+i*.92,-1.66,.032,.025,.32,1.23,161);
}
for(let i=0;i<12;i++)block(-4.76+i*.327,-1.74,.327,.55,1.72,.13,i%2?124:216);
depth=-5;block(-.55,-3.4,1.71,1.6,.1,1.52,131);
block(-.62,-3.48,1.85,1.78,1.62,.12,191);
tree(3.75,-2.55,1.22);tree(-3.95,2.57,1.15);
depth=1.7;for(const x of [-1.15,.05])block(x,2.8,.12,.32,.1,.37,97);
for(let j=0;j<3;j++)block(-1.38,2.69+j*.14,1.8,.11,.47,.09,161+j*8);
block(-1.38,3.05,1.8,.12,.69,.2,175);
for(const x of [-2.65,2.65,4.4]){depth=x+1.52;block(x,1.52,.12,.12,.1,.49,91);}
function lantern(x:number,z:number){depth=x+z;block(x,z,.075,.075,.1,2.48,111);block(x-.08,z-.08,.23,.23,2.58,.32,226);block(x-.14,z-.14,.35,.35,2.9,.07,128);}
lantern(3.03,2.37);lantern(-.18,-1.45);

function walker(x:number,z:number,phase:number,coat:number,alongZ=false){
  depth=x+z+.12;
  const stride=Math.sin(phase)*.13;
  for(const side of [-1,1]){
    const dx=alongZ?side*.078:side*stride,dz=alongZ?side*stride:side*.078;
    block(x+dx-.045,z+dz-.05,.09,.10,.10,.34,coat*.66);
  }
  const bob=.021*Math.cos(phase*2);
  block(x-.13,z-.10,.26,.21,.42+bob,.33,coat);
  for(const side of [-1,1])block(x+side*(alongZ?.16:-stride)-.035,z+side*(alongZ?-stride:.135)-.035,.07,.07,.43+bob,.23,coat-13);
  block(x-.078,z-.075,.156,.15,.77+bob,.18,205);
  block(x-.084,z-.08,.168,.16,.91+bob,.065,91);
}
const grey=(v:number)=>'rgb('+Math.round(v)+' '+Math.round(v)+' '+Math.round(v)+')';
const ink=Array.from({length:256},(_,i)=>grey(i));
const groundX=([x,,z]:Point)=>x*.87-z*.66;
const groundY=([x,y,z]:Point)=>x*.35+z*.46-y*.98;
const points=fixed.flatMap(face=>face.points);
const left=Math.min(...points.map(groundX)),right=Math.max(...points.map(groundX));
const top=Math.min(...points.map(groundY)),bottom=Math.max(...points.map(groundY));
export const streetAspect=(right-left)/(bottom-top);

export function paintStreet(ctx:CanvasRenderingContext2D,width:number,height:number,t:number){
  ctx.clearRect(0,0,width,height);
  faces=fixed.slice();
  // Ping-pong paths keep walkers within the pavement instead of jumping at a loop.
  const path=(v:number)=>1-Math.abs((v%2)-1);
  walker(-2.5+5.9*path(t*.1+.4),1.91,t*5,215);
  walker(1.48,-2+4*path(t*.14+.25),t*5.4+1,107,true);
  walker(1.08,-1.95+4.1*path(t*.13+1.1),t*5.1,191,true);
  walker(-3.5+6*path(t*.092+.19),-1.35,t*4.8,131);
  const scale=.97*Math.min(width/(right-left),height/(bottom-top));
  const ox=(width-scale*(left+right))/2,oy=(height-scale*(top+bottom))/2;
  for(const f of faces.sort((a,b)=>a.depth-b.depth)){
    ctx.fillStyle=ink[Math.max(0,Math.min(255,Math.round(f.tone)))];
    ctx.beginPath();
    f.points.forEach((p,i)=>{
      const x=ox+scale*groundX(p),y=oy+scale*groundY(p);
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    });
    ctx.closePath();ctx.fill();
  }
}
