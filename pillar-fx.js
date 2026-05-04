/* ============================================================
   ETHOS EMPIRE — PILLAR-FX.JS  v6
   Mobile-lite: all 4 animations now run on phones too.
   Mobile path:
     • Canvas opacity 0.45  (dimmed — saves GPU composite cost)
     • 30 fps cap            (halves CPU/GPU work vs 60 fps)
     • shadowBlur = 0        (single biggest GPU drain removed)
     • Reduced particle/node counts
     • Heaviest sub-effects skipped (disco ball, orbit ball, dust)
   Desktop path is unchanged from v5.
   ============================================================ */
(function () {
  'use strict';

  const LOOP = 20000;
  const TAU  = Math.PI * 2;

  /* Detect mobile / coarse-pointer devices */
  const MOBILE = window.innerWidth < 768 ||
    window.matchMedia('(pointer: coarse)').matches;

  /* Mobile frame budget — skip frame if under 33 ms since last (≈30 fps) */
  function shouldSkipFrame(lastTime, now) {
    return MOBILE && (now - lastTime) < 33;
  }

  /* On mobile: zero shadowBlur before every draw, restore after */
  function sb(ctx, val) { ctx.shadowBlur = MOBILE ? 0 : val; }
  function sc(ctx, col) { if (!MOBILE) ctx.shadowColor = col; }

  /* Seeded hash — deterministic, sr(n) → 0…1 */
  function sr(n) {
    n=(n^0xDEADBEEF)>>>0; n=Math.imul(n^(n>>>16),0x45d9f3b)>>>0;
    n=Math.imul(n^(n>>>16),0x45d9f3b)>>>0; return((n^(n>>>16))>>>0)/4294967296;
  }

  /* 3-D rotation helpers */
  function rx(p,a){return{x:p.x,y:p.y*Math.cos(a)-p.z*Math.sin(a),z:p.y*Math.sin(a)+p.z*Math.cos(a)};}
  function ry(p,a){return{x:p.x*Math.cos(a)+p.z*Math.sin(a),y:p.y,z:-p.x*Math.sin(a)+p.z*Math.cos(a)};}
  function rz(p,a){return{x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a),z:p.z};}
  function sm(t,t0,dt){const x=Math.min(1,Math.max(0,(t-t0)/dt));return x*x*(3-2*x);}

  /* Apply mobile canvas opacity once after creation */
  function applyMobileCanvas(canvas) {
    /* Promote canvas to its own GPU compositor layer */
    canvas.style.willChange = 'transform';
    canvas.style.transform  = 'translateZ(0)';
    canvas.style.contain    = 'strict';
    if (MOBILE) canvas.style.opacity = '0.45';
  }

  /* Utility: wire up IntersectionObserver to start/stop a rAF loop */
  function watchVisibility(section, startFn, stopFn) {
    if (!section) { startFn(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { e.isIntersecting ? startFn() : stopFn(); });
    }, { threshold: 0.55 });
    io.observe(section);
  }

  /* ============================================================
     ANIMATION 1 — DISCIPLINE: Brain neuron network + disco ball
     Mobile-lite: neuron network only, no disco ball/orbit ball,
     fewer nodes and pulses.
     ============================================================ */
  /* ============================================================
     ANIMATION 1 — DISCIPLINE: Triple nested 3D cube (hypercube)
     Three counter-rotating cubes with glowing edges, vertex orbs,
     orbiting particles and an ambient energy ring.
     Mobile-lite: single cube, reduced orbiters, no shadowBlur.
     ============================================================ */
  function startDiscipline(wrap) {
    const canvas = document.createElement('canvas'); wrap.appendChild(canvas);
    applyMobileCanvas(canvas);
    const ctx = canvas.getContext('2d');

    let cW, cH, CX, CY, SC, FOV_D, ZD, animId = 0, lastTime = 0;

    function setup() {
      cW = canvas.width  = wrap.offsetWidth  || window.innerWidth;
      cH = canvas.height = wrap.offsetHeight || window.innerHeight;
      CX = cW * 0.62; CY = cH * 0.50;
      SC = Math.min(cW, cH) * 0.21;
      FOV_D = SC * 9; ZD = SC * 4;
    }
    let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(setup, 180); });
    setup();

    /* Unit cube geometry */
    const UVERTS = [
      {x:-1,y:-1,z:-1},{x:1,y:-1,z:-1},{x:1,y:1,z:-1},{x:-1,y:1,z:-1},
      {x:-1,y:-1,z: 1},{x:1,y:-1,z: 1},{x:1,y:1,z: 1},{x:-1,y:1,z: 1}
    ];
    const EDGES = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    const FACES = [
      {v:[0,1,2,3],n:{x:0,y:0,z:-1}}, {v:[5,4,7,6],n:{x:0,y:0,z:1}},
      {v:[0,1,5,4],n:{x:0,y:-1,z:0}}, {v:[3,2,6,7],n:{x:0,y:1,z:0}},
      {v:[0,3,7,4],n:{x:-1,y:0,z:0}}, {v:[1,2,6,5],n:{x:1,y:0,z:0}}
    ];

    /* Orbiting particle spheres */
    const ORB_N = MOBILE ? 5 : 13;
    const ORBS = Array.from({length: ORB_N}, (_, i) => ({
      rad:   1.55 + sr(i*7+1) * 0.85,
      spd:   (1 + Math.floor(sr(i*7+2) * 3)) * (sr(i*7+3) > 0.5 ? 1 : -1),
      phase: sr(i*7+4) * TAU,
      tiltX: (sr(i*7+5) - 0.5) * 1.7,
      tiltZ: (sr(i*7+6) - 0.5) * 1.1,
      size:  2.8 + sr(i*7+7) * 3.2,
      hOff:  sr(i*7+8) * 360
    }));

    function proj(p) {
      const s = FOV_D / (FOV_D + p.z * SC + ZD);
      return {x: CX + p.x * SC * s, y: CY + p.y * SC * s, s};
    }

    function xform(v, scale, aX, aY, aZ) {
      let p = {x: v.x * scale, y: v.y * scale, z: v.z * scale};
      p = rx(p, aX); p = ry(p, aY); p = rz(p, aZ);
      return p;
    }

    /* Draw one cube at a given scale / rotation / colour offset */
    function drawCube(tf, scale, aX, aY, aZ, hueBase, lineW, glowR) {
      const tv = UVERTS.map(v => { const raw = xform(v, scale, aX, aY, aZ); return {raw, pr: proj(raw)}; });
      const pulse = 0.5 + 0.5 * Math.sin(tf * TAU * 2.2 + hueBase * 0.017);

      /* Faces — sorted back-to-front, glass fill on front-facing only */
      const fd = FACES.map((face, fi) => {
        let n = xform(face.n, 1, aX, aY, aZ);
        const diffuse = Math.max(0, n.z);
        const avgZ = face.v.reduce((s, vi) => s + tv[vi].raw.z, 0) / face.v.length;
        return {face, diffuse, avgZ, isFront: n.z > -0.05, hue: (hueBase + fi * 60) % 360};
      });
      fd.sort((a, b) => a.avgZ - b.avgZ);
      fd.forEach(d => {
        if (!d.isFront) return;
        const pts = d.face.v.map(vi => tv[vi].pr);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath();
        ctx.fillStyle = `hsla(${d.hue.toFixed(0)},78%,52%,${(0.04 + d.diffuse * 0.17).toFixed(3)})`;
        ctx.fill();
      });

      /* Edges — colour-cycling with glow */
      ctx.lineCap = 'round';
      EDGES.forEach((edge, ei) => {
        const p0 = tv[edge[0]].pr, p1 = tv[edge[1]].pr;
        const hue = (hueBase + ei * 30) % 360;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `hsla(${hue.toFixed(0)},100%,68%,${(0.55 + pulse * 0.40).toFixed(3)})`;
        ctx.lineWidth = lineW + pulse * 0.9;
        sb(ctx, glowR + pulse * 7); sc(ctx, `hsl(${hue.toFixed(0)},100%,74%)`);
        ctx.stroke(); ctx.shadowBlur = 0;
      });

      /* Vertices — bright glowing orbs at each corner */
      UVERTS.forEach((_, vi) => {
        const pr = tv[vi].pr;
        const hue = (hueBase + vi * 45) % 360;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, (scale * 4.8 + pulse * 2.8), 0, TAU);
        ctx.fillStyle = `hsla(${hue.toFixed(0)},100%,80%,${(0.65 + pulse * 0.35).toFixed(2)})`;
        sb(ctx, 16 + pulse * 10); sc(ctx, `hsl(${hue.toFixed(0)},100%,78%)`);
        ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    /* Orbiting particle spheres that fly around the whole structure */
    function drawOrbs(tf, gh) {
      ORBS.forEach(o => {
        const a = tf * TAU * o.spd + o.phase;
        let pos = {x: Math.cos(a) * o.rad, y: 0, z: Math.sin(a) * o.rad};
        pos = rx(pos, o.tiltX); pos = rz(pos, o.tiltZ);
        const pr = proj(pos);
        const hue = (gh + o.hOff) % 360;
        const pulse = 0.55 + 0.45 * Math.sin(tf * TAU * 3 + o.phase);
        const sz = o.size * pulse * Math.max(0.5, pr.s);
        ctx.beginPath(); ctx.arc(pr.x, pr.y, sz, 0, TAU);
        ctx.fillStyle = `hsla(${hue.toFixed(0)},96%,68%,0.82)`;
        sb(ctx, 12 + pulse * 8); sc(ctx, `hsl(${hue.toFixed(0)},100%,72%)`);
        ctx.fill(); ctx.shadowBlur = 0;
      });
    }

    /* Tilted equatorial energy ring */
    function drawRing(tf, gh) {
      const N = MOBILE ? 24 : 48, ringR = 1.82, tilt = 0.38, rotA = tf * TAU;
      ctx.lineWidth = 1.6;
      for (let i = 0; i < N; i++) {
        const a0 = rotA + (i / N) * TAU, a1 = rotA + ((i + 0.74) / N) * TAU;
        const hue = (gh + i * (360 / N)) % 360;
        const bright = 0.5 + 0.5 * Math.sin(a0 * 4 + tf * TAU * 3);
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(a0) * ringR * SC, CY + Math.sin(a0) * ringR * SC * Math.cos(tilt));
        ctx.lineTo(CX + Math.cos(a1) * ringR * SC, CY + Math.sin(a1) * ringR * SC * Math.cos(tilt));
        ctx.strokeStyle = `hsla(${hue.toFixed(0)},100%,65%,${(0.20 + bright * 0.45).toFixed(3)})`;
        sb(ctx, 7); sc(ctx, `hsl(${hue.toFixed(0)},100%,62%)`);
        ctx.stroke(); ctx.shadowBlur = 0;
      }
    }

    function frame(now) {
      if (shouldSkipFrame(lastTime, now)) { animId = requestAnimationFrame(frame); return; }
      lastTime = now;

      const tf = (now % LOOP) / LOOP;
      const gh = tf * 360;

      ctx.clearRect(0, 0, cW, cH);

      /* Ambient radial glow behind the cube */
      const gp = 0.5 + 0.5 * Math.sin(tf * TAU);
      const ag = ctx.createRadialGradient(CX, CY, 0, CX, CY, SC * (1.7 + 0.3 * gp));
      ag.addColorStop(0, `hsla(${gh.toFixed(0)},85%,22%,${(0.09 + 0.04 * gp).toFixed(3)})`);
      ag.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ag; ctx.fillRect(0, 0, cW, cH);

      /* Rotation axes — multi-frequency wobble for organic feel */
      const aY =  tf * TAU * 0.90;
      const aX =  tf * TAU * 0.52 + Math.sin(tf * TAU * 1.4) * 0.28;
      const aZ =  Math.sin(tf * TAU * 0.38) * 0.18;

      /* Draw ring behind the cubes */
      drawRing(tf, gh);

      /* Outer cube */
      drawCube(tf, 1.00,  aX,        aY,        aZ,       gh,           2.4, 15);

      /* Middle cube — counter-rotating on Y, faster X wobble */
      if (!MOBILE) {
        drawCube(tf, 0.57, -aX * 1.5, -aY * 1.7,  aZ * 2.1, (gh + 120) % 360, 1.5, 11);
      }

      /* Inner cube — fastest, rolling Z as well */
      drawCube(tf, 0.27,  aX * 2.4,  aY * 2.6, -aZ * 3.2, (gh + 240) % 360, 1.0,  8);

      /* Orbiting particles on top */
      drawOrbs(tf, gh);

      animId = requestAnimationFrame(frame);
    }

    watchVisibility(
      wrap.closest('section'),
      () => { if (!animId) animId = requestAnimationFrame(frame); },
      () => { if (animId)  { cancelAnimationFrame(animId); animId = 0; } }
    );
  }

  /* ============================================================
     ANIMATION 2 — CONFIDENCE: 3D colour-cycling icosahedron
     Mobile-lite: fewer orbiters/dust, no shadowBlur.
     ============================================================ */
  function startConfidence(wrap) {
    const canvas=document.createElement('canvas');wrap.appendChild(canvas);
    applyMobileCanvas(canvas);
    const ctx=canvas.getContext('2d');
    const phi=(1+Math.sqrt(5))/2;
    const IVERTS=[[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],[1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1]].map(v=>{const l=Math.hypot(v[0],v[1],v[2]);return{x:v[0]/l,y:v[1]/l,z:v[2]/l};});
    const IFACES=[[0,1,8],[0,8,4],[0,4,5],[0,5,9],[0,9,1],[3,10,2],[3,2,11],[3,11,7],[3,7,6],[3,6,10],[1,6,8],[8,6,10],[8,10,4],[4,10,2],[4,2,5],[5,2,11],[5,11,9],[9,11,7],[9,7,1],[1,7,6]];
    const OVERTS=[{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
    const OFACES=[[0,2,4],[0,4,3],[0,3,5],[0,5,2],[1,4,2],[1,3,4],[1,5,3],[1,2,5]];

    /* Mobile: fewer orbiters and dust particles */
    const orbiterCount = MOBILE ? 5 : 12;
    const dustCount    = MOBILE ? 12 : 28;
    const ORBITERS=Array.from({length:orbiterCount},(_,i)=>({radFrac:.26+sr(i*7)*.22,speed:1+Math.floor(sr(i*7+1)*3),phase:sr(i*7+2)*TAU,tiltX:(sr(i*7+3)-.5)*1.4,tiltZ:(sr(i*7+4)-.5)*1.0,sizeFrac:.025+sr(i*7+5)*.032,hOff:sr(i*7+6)*360,spinSpd:1+Math.floor(sr(i*7+7)*4)}));
    const DUST=Array.from({length:dustCount},(_,i)=>({xFrac:.15+sr(i*11+1)*.7,spd:1+Math.floor(sr(i*11+2)*3),ph:sr(i*11+3),r:1+sr(i*11+4)*2.2,hOff:sr(i*11+5)*360}));
    let cW,cH,CX,CY,FOV,ZDIST,icoScale,octScale,animId=0,lastTime=0;
    function setup(){cW=canvas.width=wrap.offsetWidth||window.innerWidth;cH=canvas.height=wrap.offsetHeight||window.innerHeight;CX=cW*.62;CY=cH*.5;const m=Math.min(cW,cH);FOV=m*1.5;ZDIST=m*.55;icoScale=m*.25;octScale=m*.11;}
    let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(setup,180);});setup();
    function proj(p){const s=FOV/(FOV+p.z+ZDIST);return{x:CX+p.x*s,y:CY+p.y*s,s};}

    function drawPoly(verts,faces,angY,angX,angZ,scale,hueBase){
      const tv=verts.map(v=>{let p={x:v.x*scale,y:v.y*scale,z:v.z*scale};p=rx(p,angX);p=ry(p,angY);p=rz(p,angZ);return{raw:p,pr:proj(p)};});
      const fd=faces.map((f,i)=>{const v0=tv[f[0]].raw,v1=tv[f[1]].raw,v2=tv[f[2]].raw;const e1={x:v1.x-v0.x,y:v1.y-v0.y,z:v1.z-v0.z};const e2={x:v2.x-v0.x,y:v2.y-v0.y,z:v2.z-v0.z};let nx=e1.y*e2.z-e1.z*e2.y,ny=e1.z*e2.x-e1.x*e2.z,nz=e1.x*e2.y-e1.y*e2.x;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;const isFront=nz>=0,diffuse=Math.max(0,.45*nz+.3*ny-.25*nx);return{f,tv,depth:(v0.z+v1.z+v2.z)/3,diffuse,isFront,hue:(hueBase+i*(360/faces.length))%360};});
      fd.sort((a,b)=>a.depth-b.depth);
      fd.forEach(d=>{const p0=d.tv[d.f[0]].pr,p1=d.tv[d.f[1]].pr,p2=d.tv[d.f[2]].pr;ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.closePath();ctx.fillStyle=`hsla(${d.hue.toFixed(1)},${d.isFront?92:60}%,${(d.isFront?28+d.diffuse*38:10).toFixed(1)}%,${(d.isFront?.72+d.diffuse*.24:.08).toFixed(3)})`;ctx.fill();if(d.isFront){ctx.strokeStyle=`hsla(${d.hue.toFixed(1)},100%,72%,0.55)`;ctx.lineWidth=.9;sb(ctx,10);sc(ctx,`hsl(${d.hue.toFixed(1)},100%,65%)`);ctx.stroke();ctx.shadowBlur=0;}});
    }

    function drawOrbiters(tf,gh){
      ORBITERS.forEach(o=>{const a=tf*TAU*o.speed+o.phase;let pos={x:Math.cos(a)*o.radFrac*icoScale*3.8,y:0,z:Math.sin(a)*o.radFrac*icoScale*3.8};pos=rx(pos,o.tiltX);pos=rz(pos,o.tiltZ);const s=FOV/(FOV+pos.z+ZDIST),pr={x:CX+pos.x*s,y:CY+pos.y*s};const hue=(gh+o.hOff)%360,sz=o.sizeFrac*Math.min(cW,cH)*s;const sa=tf*TAU*o.spinSpd+o.phase;ctx.beginPath();for(let k=0;k<3;k++){const ka=sa+k*TAU/3;k===0?ctx.moveTo(pr.x+Math.cos(ka)*sz,pr.y+Math.sin(ka)*sz):ctx.lineTo(pr.x+Math.cos(ka)*sz,pr.y+Math.sin(ka)*sz);}ctx.closePath();ctx.fillStyle=`hsla(${hue.toFixed(1)},95%,58%,0.55)`;sb(ctx,14);sc(ctx,`hsl(${hue.toFixed(1)},100%,65%)`);ctx.fill();ctx.strokeStyle=`hsla(${hue.toFixed(1)},100%,78%,0.7)`;ctx.lineWidth=.8;ctx.stroke();ctx.shadowBlur=0;});
    }

    function drawEnergyRing(tf,gh){
      const N=MOBILE?18:36,ringR=icoScale*1.35,tilt=.42,ringA=tf*TAU;ctx.lineWidth=1.2;
      for(let i=0;i<N;i++){const a0=ringA+(i/N)*TAU,a1=ringA+((i+.7)/N)*TAU;const hue=(gh+i*(360/N))%360,bright=.5+.5*Math.sin(a0*3+tf*TAU*2);ctx.beginPath();ctx.moveTo(CX+Math.cos(a0)*ringR,CY+Math.sin(a0)*ringR*Math.cos(tilt));ctx.lineTo(CX+Math.cos(a1)*ringR,CY+Math.sin(a1)*ringR*Math.cos(tilt));ctx.strokeStyle=`hsla(${hue.toFixed(1)},100%,65%,${(.25+bright*.45).toFixed(3)})`;sb(ctx,8);sc(ctx,`hsl(${hue.toFixed(1)},100%,60%)`);ctx.stroke();ctx.shadowBlur=0;}
    }

    function drawDust(tf,gh){
      if(MOBILE) return; /* skip dust on mobile */
      DUST.forEach(d=>{const progress=(tf*d.spd+d.ph)%1;const fade=progress<.06?progress/.06:progress>.9?(1-progress)/.1:1;if(fade<.01)return;const y=CY+cH*.45-progress*cH*1.3;const hue=(gh+d.hOff)%360,pulse=.7+.3*Math.sin(tf*TAU*d.spd*3+d.ph*TAU);ctx.beginPath();ctx.arc(cW*d.xFrac,y,d.r*pulse,0,TAU);ctx.fillStyle=`hsla(${hue.toFixed(1)},95%,65%,${(fade*.75).toFixed(3)})`;ctx.shadowBlur=8;ctx.shadowColor=`hsl(${hue.toFixed(1)},100%,65%)`;ctx.fill();ctx.shadowBlur=0;});
    }

    function frame(now){
      if(shouldSkipFrame(lastTime,now)){animId=requestAnimationFrame(frame);return;}
      lastTime=now;
      const T=now%LOOP,tf=T/LOOP,a=tf*TAU,gh=tf*360;
      ctx.clearRect(0,0,cW,cH);
      const pulse=.5+.5*Math.sin(tf*TAU);
      const ag=ctx.createRadialGradient(CX,CY,icoScale*.05,CX,CY,icoScale*(1.6+.2*pulse));
      ag.addColorStop(0,`hsla(${gh},80%,25%,${(.1+.03*pulse).toFixed(3)})`);ag.addColorStop(.55,`hsla(${gh},60%,15%,0.04)`);ag.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ag;ctx.fillRect(0,0,cW,cH);
      drawEnergyRing(tf,gh);drawPoly(OVERTS,OFACES,-a*2,a,0,octScale,(gh+180)%360);
      drawPoly(IVERTS,IFACES,a,.44,0,icoScale,gh);drawOrbiters(tf,gh);drawDust(tf,gh);
      animId=requestAnimationFrame(frame);
    }

    watchVisibility(
      wrap.closest('section'),
      ()=>{ if(!animId) animId=requestAnimationFrame(frame); },
      ()=>{ if(animId){ cancelAnimationFrame(animId); animId=0; } }
    );
  }

  /* ============================================================
     ANIMATION 3 — HEALTH: Low-poly 3D heart + octagon rings
     Mobile-lite: reduced mesh (fewer quads), no dust/sparkles.
     ============================================================ */
  function startHealth(wrap) {
    const canvas=document.createElement('canvas');wrap.appendChild(canvas);
    applyMobileCanvas(canvas);
    const ctx=canvas.getContext('2d');
    const PH={SPIN:0.25,ORBIT_IN:0.30,ORBIT:0.75,FLY:0.85,DONE:1.00};

    /* Mobile: reduce mesh resolution to cut draw calls */
    const NU=MOBILE?8:14, NV=MOBILE?7:11;
    function hPt(uf,vf){const u=uf*TAU,t=vf*Math.PI,r=Math.pow(Math.sin(t),3),y=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16;return{x:r*Math.cos(u),y,z:r*Math.sin(u)};}
    const BV=[];for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++)BV.push(hPt(i/NU,j/NV));
    const PAL=[{h:4,s:93,l:40},{h:22,s:95,l:53},{h:344,s:87,l:59},{h:48,s:90,l:57}];
    const pickCol=(seed)=>{const r=sr(seed);return r<0.38?0:r<0.63?1:r<0.87?2:3;};
    const QUADS=[];
    for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const qi=QUADS.length,a=j*(NU+1)+i,b=j*(NU+1)+(i+1),c=(j+1)*(NU+1)+i,d=(j+1)*(NU+1)+(i+1);QUADS.push({a,b,c,d,ci:pickCol(qi*13+7),oRad:1.05+sr(qi*7+8)*0.60,oSpd:1+Math.floor(sr(qi*7+9)*3),oPh:sr(qi*7+10)*TAU,oInc:(sr(qi*7+11)-.5)*Math.PI*0.80,oAsc:sr(qi*7+12)*TAU});}
    const RINGS=[{rFrac:1.85,tX:0.26,tZ:0,sPd:1},{rFrac:2.30,tX:-0.52,tZ:0.28,sPd:-1},{rFrac:1.55,tX:0.80,tZ:-0.16,sPd:2}];
    const N_OCT=8;
    const DUST_H=MOBILE?[]:Array.from({length:44},(_,i)=>({xFrac:0.03+sr(i*13+1)*0.94,spd:1+Math.floor(sr(i*13+2)*3),ph:sr(i*13+3),r:1.4+sr(i*13+4)*2.4,hOff:sr(i*13+5)*360}));
    const SPARKS_H=MOBILE?[]:Array.from({length:10},(_,i)=>({rFrac:1.10+sr(i*7+1)*0.55,spd:1+Math.floor(sr(i*7+2)*3),ph:sr(i*7+3)*TAU,tX:(sr(i*7+4)-.5)*1.1,r:1.8+sr(i*7+5)*2.2,hOff:sr(i*7+6)*360}));
    let cW,cH,CX,CY,SC,FOV_H,ZD,animId=0,lastTime=0;
    function setup(){cW=canvas.width=wrap.offsetWidth||window.innerWidth;cH=canvas.height=wrap.offsetHeight||window.innerHeight;CX=cW*0.64;CY=cH*0.50;SC=Math.min(cW,cH)*0.19;FOV_H=SC*8;ZD=SC*3.5;}
    let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(setup,180);});setup();
    function proj(p){const s=FOV_H/(FOV_H+p.z*SC+ZD);return{x:CX+p.x*SC*s,y:CY-p.y*SC*s};}
    function orbitDisp(q,tf){const sc3=(p,s)=>({x:p.x*s,y:p.y*s,z:p.z*s}),ZERO={x:0,y:0,z:0};const posAt=(t)=>{const a=q.oPh+t*TAU*q.oSpd;let p={x:q.oRad*Math.cos(a),y:0,z:q.oRad*Math.sin(a)};p=rx(p,q.oInc);p=ry(p,q.oAsc);return p;};const flyOrigin=posAt(PH.ORBIT);if(tf<PH.SPIN)return ZERO;if(tf<PH.ORBIT_IN)return sc3(posAt(tf),sm(tf,PH.SPIN,PH.ORBIT_IN-PH.SPIN));if(tf<PH.ORBIT)return posAt(tf);if(tf<PH.FLY)return sc3(flyOrigin,1+sm(tf,PH.ORBIT,PH.FLY-PH.ORBIT)*3.5);return sc3(flyOrigin,4.5*(1-sm(tf,PH.FLY,PH.DONE-PH.FLY)));}

    function drawOctaRings(tf,orbitAmt,flyAmt){
      const gh=tf*360,baseA=0.22+orbitAmt*0.55+flyAmt*0.15;
      const ringCount=MOBILE?2:3;
      RINGS.slice(0,ringCount).forEach((ring,ri)=>{const ringR=ring.rFrac,rotAng=tf*TAU*ring.sPd,verts=[];const N=MOBILE?6:N_OCT;for(let i=0;i<=N;i++){const a=rotAng+(i/N)*TAU;let p={x:ringR*Math.cos(a),y:0,z:ringR*Math.sin(a)};p=rx(p,ring.tX);if(ring.tZ)p=rz(p,ring.tZ);p=ry(p,tf*TAU);verts.push(p);}for(let i=0;i<N;i++){const v0=verts[i],v1=verts[i+1],avgZ=(v0.z+v1.z)*0.5;const dA=Math.max(0.12,Math.min(1,0.72-avgZ/(ringR*0.9)));const hue=(gh+ri*120+i*(360/N))%360,finalA=(baseA*dA).toFixed(3);const p0=proj(v0),p1=proj(v1);const GAP=0.12,sx=p0.x+(p1.x-p0.x)*GAP,sy=p0.y+(p1.y-p0.y)*GAP,ex=p0.x+(p1.x-p0.x)*(1-GAP),ey=p0.y+(p1.y-p0.y)*(1-GAP);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.strokeStyle=`hsla(${hue.toFixed(0)},92%,65%,${finalA})`;ctx.lineWidth=1.8;sb(ctx,7);sc(ctx,`hsl(${hue.toFixed(0)},100%,60%)`);ctx.stroke();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(p0.x,p0.y,3.0,0,TAU);ctx.fillStyle=`hsla(${hue.toFixed(0)},100%,78%,${finalA})`;sb(ctx,10);sc(ctx,`hsl(${hue.toFixed(0)},100%,70%)`);ctx.fill();ctx.shadowBlur=0;}});
    }

    function drawDust(tf){
      if(MOBILE||DUST_H.length===0) return;
      DUST_H.forEach(d=>{const prog=(tf*d.spd+d.ph)%1,fade=prog<0.07?prog/0.07:prog>0.88?(1-prog)/0.12:1;if(fade<0.01)return;const y=CY+cH*0.44-prog*cH*1.35,hue=(d.hOff+tf*360)%360,pulse=0.7+0.3*Math.sin(tf*TAU*d.spd*3+d.ph*TAU);ctx.beginPath();ctx.arc(cW*d.xFrac,y,d.r*pulse,0,TAU);ctx.fillStyle=`hsla(${hue.toFixed(0)},95%,65%,${(fade*0.68).toFixed(3)})`;ctx.shadowBlur=9;ctx.shadowColor=`hsl(${hue.toFixed(0)},100%,65%)`;ctx.fill();ctx.shadowBlur=0;});
    }

    function drawSparkles(tf){
      if(MOBILE||SPARKS_H.length===0) return;
      SPARKS_H.forEach(s=>{const a=tf*TAU*s.spd+s.ph;let p={x:Math.cos(a)*s.rFrac,y:0,z:Math.sin(a)*s.rFrac};p=rx(p,s.tX);const pr=proj(p),hue=(s.hOff+tf*360)%360,pulse=0.7+0.3*Math.sin(tf*TAU*s.spd*3+s.ph);ctx.beginPath();ctx.arc(pr.x,pr.y,s.r*pulse,0,TAU);ctx.fillStyle=`hsla(${hue.toFixed(0)},95%,68%,0.78)`;ctx.shadowBlur=10;ctx.shadowColor=`hsl(${hue.toFixed(0)},100%,65%)`;ctx.fill();ctx.shadowBlur=0;});
    }

    function frame(now){
      if(shouldSkipFrame(lastTime,now)){animId=requestAnimationFrame(frame);return;}
      lastTime=now;
      const tf=(now%LOOP)/LOOP;
      ctx.clearRect(0,0,cW,cH);
      const angY=tf*TAU,angX=0.28+0.08*Math.sin(tf*TAU*2),rot=(v)=>{let p=rx(v,angX);return ry(p,angY);};
      const inOrbit=(tf>=PH.ORBIT_IN&&tf<PH.ORBIT)?sm(tf,PH.ORBIT_IN,0.05):0,flyAmt=(tf>=PH.ORBIT&&tf<PH.FLY)?sm(tf,PH.ORBIT,PH.FLY-PH.ORBIT):0;
      const gI=0.07+inOrbit*0.08+flyAmt*0.16,gR=SC*(1.4+inOrbit*1.0+flyAmt*3.2),gGrad=ctx.createRadialGradient(CX,CY,0,CX,CY,gR);
      gGrad.addColorStop(0,`rgba(255,30,70,${gI.toFixed(3)})`);gGrad.addColorStop(0.45,`rgba(160,0,30,${(gI*0.4).toFixed(3)})`);gGrad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gGrad;ctx.fillRect(0,0,cW,cH);
      drawOctaRings(tf,inOrbit,flyAmt);
      const faceData=QUADS.map((q)=>{const pa=BV[q.a],pb=BV[q.b],pc=BV[q.c],pd=BV[q.d];const e1={x:pb.x-pa.x,y:pb.y-pa.y,z:pb.z-pa.z},e2={x:pd.x-pa.x,y:pd.y-pa.y,z:pd.z-pa.z};let nx=e1.y*e2.z-e1.z*e2.y,ny=e1.z*e2.x-e1.x*e2.z,nz=e1.x*e2.y-e1.y*e2.x;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;const fn={x:nx,y:ny,z:nz};const od=orbitDisp(q,tf),sh={x:od.x,y:od.y,z:od.z},ov=(v)=>({x:v.x+sh.x,y:v.y+sh.y,z:v.z+sh.z}),rva=rot(ov(pa)),rvb=rot(ov(pb)),rvc=rot(ov(pc)),rvd=rot(ov(pd)),rc=rot({x:((pa.x+pb.x+pc.x+pd.x)*.25)+sh.x,y:((pa.y+pb.y+pc.y+pd.y)*.25)+sh.y,z:((pa.z+pb.z+pc.z+pd.z)*.25)+sh.z}),rfn=rot(fn),diffuse=Math.max(0,0.55*rfn.z+0.28*rfn.y-0.18*rfn.x),isFront=rfn.z>=-0.02,pA=proj(rva),pB=proj(rvb),pC=proj(rvc),pD=proj(rvd),col=PAL[q.ci],orbitBoost=(inOrbit+flyAmt*0.5)*12,litAdj=isFront?diffuse*44+orbitBoost:-24,lit=Math.max(6,Math.min(86,col.l+litAdj)),alph=isFront?0.78+diffuse*0.20:(inOrbit>0.1||flyAmt>0.1?0.12:0.06);return{pA,pB,pC,pD,col,lit,alph,depth:rc.z,isFront,orbiting:inOrbit>0.05||flyAmt>0.05};});
      faceData.sort((a,b)=>a.depth-b.depth);
      faceData.forEach(f=>{const{h,s}=f.col;if(f.orbiting&&!MOBILE){const mx=(f.pA.x+f.pB.x+f.pC.x+f.pD.x)*.25,my=(f.pA.y+f.pB.y+f.pC.y+f.pD.y)*.25,gr=ctx.createRadialGradient(mx,my,0,mx,my,18);gr.addColorStop(0,`hsla(${h},${s}%,${f.lit.toFixed(0)}%,${((inOrbit+flyAmt)*0.10).toFixed(3)})`);gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.fillRect(mx-20,my-20,40,40);}ctx.beginPath();ctx.moveTo(f.pA.x,f.pA.y);ctx.lineTo(f.pB.x,f.pB.y);ctx.lineTo(f.pD.x,f.pD.y);ctx.lineTo(f.pC.x,f.pC.y);ctx.closePath();ctx.fillStyle=`hsla(${h},${s}%,${f.lit.toFixed(0)}%,${f.alph.toFixed(2)})`;ctx.fill();if(f.isFront){ctx.strokeStyle=`hsla(${h},${s}%,${Math.max(5,f.lit*0.48).toFixed(0)}%,0.60)`;ctx.lineWidth=0.75;ctx.stroke();}});
      drawSparkles(tf);drawDust(tf);
      animId=requestAnimationFrame(frame);
    }

    watchVisibility(
      wrap.closest('section'),
      ()=>{ if(!animId) animId=requestAnimationFrame(frame); },
      ()=>{ if(animId){ cancelAnimationFrame(animId); animId=0; } }
    );
  }

  /* ============================================================
     ANIMATION 4 — LEGACY: 3D King Crown + hexagonal rings
     Mobile-lite: reduced mesh, no dust/gemlets, no shadowBlur.
     ============================================================ */
  function startLegacy(wrap) {
    const canvas=document.createElement('canvas');wrap.appendChild(canvas);
    applyMobileCanvas(canvas);
    const ctx=canvas.getContext('2d');

    /* Mobile: reduce mesh resolution */
    const NU=MOBILE?28:50, NV=MOBILE?7:12;
    const R_C=0.82,Y_BOT=-0.58,Y_MID=-0.06,Y_TOP=0.96;
    function crownPt(uf,vf){const u=uf*TAU,profile=(1+Math.cos(5*u))/2,yTop=Y_MID+profile*(Y_TOP-Y_MID),y=Y_BOT+vf*(yTop-Y_BOT);return{x:R_C*Math.cos(u),y,z:R_C*Math.sin(u)};}
    const PAL_C=[{h:48,s:95,l:62},{h:52,s:75,l:82},{h:42,s:92,l:44},{h:50,s:20,l:92},{h:38,s:88,l:28},{h:5,s:90,l:55},{h:215,s:88,l:55},{h:145,s:80,l:48},{h:278,s:78,l:58},{h:195,s:85,l:65}];
    function pickCrownColor(uf,vf){const u=uf*TAU,profile=(1+Math.cos(5*u))/2,valleyDist=Math.abs(Math.cos(5*u+Math.PI));if(vf<0.28&&vf>0.10&&valleyDist>0.88)return 5+(Math.floor(uf*5+0.5)%5);if(vf>0.80&&profile>0.80)return 3;if(vf>0.58&&profile>0.55)return 1;if(profile>0.40&&vf>0.28)return 0;if(profile<0.22)return 4;return 2;}
    const BV_C=[];for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++)BV_C.push(crownPt(i/NU,j/NV));
    const QUADS_C=[];for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){const a=j*(NU+1)+i,b=j*(NU+1)+(i+1),c=(j+1)*(NU+1)+i,d=(j+1)*(NU+1)+(i+1);QUADS_C.push({a,b,c,d,ci:pickCrownColor((i+.5)/NU,(j+.5)/NV)});}
    const RINGS_L=[{rFrac:2.05,tX:0.22,tZ:0,sPd:1},{rFrac:2.60,tX:-0.48,tZ:0.24,sPd:-1},{rFrac:1.65,tX:0.75,tZ:-0.14,sPd:2}];
    const N_HEX=6;
    const DUST_L=MOBILE?[]:Array.from({length:45},(_,i)=>({xFrac:0.04+sr(i*13+1)*0.92,spd:1+Math.floor(sr(i*13+2)*3),ph:sr(i*13+3),r:1.3+sr(i*13+4)*2.2,hOff:sr(i*13+5)>0.70?30+sr(i*13+6)*50:sr(i*13+6)*360}));
    const GEMLETS=MOBILE?[]:Array.from({length:18},(_,i)=>({rFrac:0.95+sr(i*7+1)*1.20,spd:1+Math.floor(sr(i*7+2)*3),ph:sr(i*7+3)*TAU,tX:(sr(i*7+4)-.5)*1.0,r:2.2+sr(i*7+5)*2.8,hOff:sr(i*7+6)*360}));
    let cW,cH,CX,CY,SC,FOV_L,ZD_L,animId=0,lastTime=0;
    function setup(){cW=canvas.width=wrap.offsetWidth||window.innerWidth;cH=canvas.height=wrap.offsetHeight||window.innerHeight;CX=cW*0.64;CY=cH*0.50;SC=Math.min(cW,cH)*0.20;FOV_L=SC*8;ZD_L=SC*3.5;}
    let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(setup,180);});setup();
    function proj(p){const s=FOV_L/(FOV_L+p.z*SC+ZD_L);return{x:CX+p.x*SC*s,y:CY-p.y*SC*s};}

    function drawRings(tf){
      const gh=tf*360;
      const ringCount=MOBILE?2:3;
      RINGS_L.slice(0,ringCount).forEach((ring,ri)=>{const ringR=ring.rFrac,rotAng=tf*TAU*ring.sPd,verts=[];for(let i=0;i<=N_HEX;i++){const a=rotAng+(i/N_HEX)*TAU;let p={x:ringR*Math.cos(a),y:0,z:ringR*Math.sin(a)};p=rx(p,ring.tX);if(ring.tZ)p=rz(p,ring.tZ);p=ry(p,tf*TAU);verts.push(p);}for(let i=0;i<N_HEX;i++){const v0=verts[i],v1=verts[i+1],avgZ=(v0.z+v1.z)*0.5,dA=Math.max(0.15,Math.min(1,0.75-avgZ/(ringR*0.9)));const hue=(30+((gh*0.7+ri*80+i*60)%120))%360;const p0=proj(v0),p1=proj(v1),GAP=0.10;const sx=p0.x+(p1.x-p0.x)*GAP,sy=p0.y+(p1.y-p0.y)*GAP,ex=p0.x+(p1.x-p0.x)*(1-GAP),ey=p0.y+(p1.y-p0.y)*(1-GAP);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.strokeStyle=`hsla(${hue.toFixed(0)},90%,68%,${dA.toFixed(2)})`;ctx.lineWidth=2.0;sb(ctx,8);sc(ctx,`hsl(${hue.toFixed(0)},100%,65%)`);ctx.stroke();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(p0.x,p0.y,3.5,0,TAU);ctx.fillStyle=`hsla(${hue.toFixed(0)},100%,85%,${dA.toFixed(2)})`;sb(ctx,12);sc(ctx,`hsl(${hue.toFixed(0)},100%,72%)`);ctx.fill();ctx.shadowBlur=0;}});
    }

    function drawSpireTips(tf,angY,angX,bob){
      const rot=(v)=>{let p=rx(v,angX);return ry(p,angY);};
      for(let s=0;s<5;s++){const u=s/5*TAU,tip={x:R_C*Math.cos(u),y:Y_TOP+bob,z:R_C*Math.sin(u)},rTip=rot(tip),pr=proj(rTip);const pulse=0.55+0.45*Math.sin(tf*TAU*3+s*TAU/5);
        if(MOBILE){/* simplified spire: just a small glowing dot */ctx.beginPath();ctx.arc(pr.x,pr.y,4*pulse,0,TAU);ctx.fillStyle=`rgba(255,248,200,${(pulse*0.7).toFixed(2)})`;ctx.fill();continue;}
        const sz=SC*0.095*pulse;for(let k=0;k<8;k++){const a=k*Math.PI/4+tf*TAU;const len=k%2===0?sz:sz*0.55;ctx.beginPath();ctx.moveTo(pr.x,pr.y);ctx.lineTo(pr.x+Math.cos(a)*len,pr.y+Math.sin(a)*len);ctx.strokeStyle=`rgba(255,248,200,${(pulse*0.85).toFixed(2)})`;ctx.lineWidth=k%2===0?2.0:1.2;ctx.shadowBlur=10;ctx.shadowColor='#FFE87C';ctx.stroke();ctx.shadowBlur=0;}ctx.beginPath();ctx.arc(pr.x,pr.y,3.8*pulse,0,TAU);ctx.fillStyle=`rgba(255,255,240,${pulse.toFixed(2)})`;ctx.shadowBlur=16;ctx.shadowColor='#FFFACD';ctx.fill();ctx.shadowBlur=0;}
    }

    function drawDust(tf){
      if(MOBILE||DUST_L.length===0) return;
      DUST_L.forEach(d=>{const prog=(tf*d.spd+d.ph)%1,fade=prog<0.07?prog/0.07:prog>0.88?(1-prog)/0.12:1;if(fade<0.01)return;const y=CY+cH*0.44-prog*cH*1.35,pulse=0.7+0.3*Math.sin(tf*TAU*d.spd*3+d.ph*TAU);ctx.beginPath();ctx.arc(cW*d.xFrac,y,d.r*pulse,0,TAU);ctx.fillStyle=`hsla(${d.hOff.toFixed(0)},92%,68%,${(fade*0.75).toFixed(3)})`;ctx.shadowBlur=9;ctx.shadowColor=`hsl(${d.hOff.toFixed(0)},100%,65%)`;ctx.fill();ctx.shadowBlur=0;});
    }

    function drawGemlets(tf){
      if(MOBILE||GEMLETS.length===0) return;
      GEMLETS.forEach(s=>{const a=tf*TAU*s.spd+s.ph;let p={x:Math.cos(a)*s.rFrac,y:0,z:Math.sin(a)*s.rFrac};p=rx(p,s.tX);const pr=proj(p);const hue=(s.hOff+tf*360)%360;const pulse=0.65+0.35*Math.sin(tf*TAU*s.spd*2+s.ph);ctx.beginPath();ctx.arc(pr.x,pr.y,s.r*pulse,0,TAU);ctx.fillStyle=`hsla(${hue.toFixed(0)},95%,72%,0.80)`;ctx.shadowBlur=12;ctx.shadowColor=`hsl(${hue.toFixed(0)},100%,68%)`;ctx.fill();ctx.shadowBlur=0;});
    }

    function frame(now){
      if(shouldSkipFrame(lastTime,now)){animId=requestAnimationFrame(frame);return;}
      lastTime=now;
      const tf=(now%LOOP)/LOOP;
      ctx.clearRect(0,0,cW,cH);
      const angY=tf*TAU,angX=0.24+0.06*Math.sin(tf*TAU*2),bob=0.06*Math.sin(tf*TAU);
      const rot=(v)=>{let p=rx({x:v.x,y:v.y+bob,z:v.z},angX);return ry(p,angY);};
      const gPulse=0.5+0.5*Math.sin(tf*TAU);
      const gGrad=ctx.createRadialGradient(CX,CY,SC*0.1,CX,CY,SC*(1.8+0.3*gPulse));
      gGrad.addColorStop(0,`rgba(220,160,10,${(0.12+0.04*gPulse).toFixed(3)})`);gGrad.addColorStop(0.5,'rgba(160,100,0,0.05)');gGrad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gGrad;ctx.fillRect(0,0,cW,cH);
      drawRings(tf);
      const faceData=QUADS_C.map((q)=>{const pa=BV_C[q.a],pb=BV_C[q.b],pc=BV_C[q.c],pd=BV_C[q.d];const e1={x:pb.x-pa.x,y:pb.y-pa.y,z:pb.z-pa.z},e2={x:pd.x-pa.x,y:pd.y-pa.y,z:pd.z-pa.z};let nx=e1.y*e2.z-e1.z*e2.y,ny=e1.z*e2.x-e1.x*e2.z,nz=e1.x*e2.y-e1.y*e2.x;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;const fn={x:nx,y:ny,z:nz};const ov=(v)=>({x:v.x,y:v.y+bob,z:v.z}),rva=rot(ov(pa)),rvb=rot(ov(pb)),rvc=rot(ov(pc)),rvd=rot(ov(pd)),rc=rot({x:(pa.x+pb.x+pc.x+pd.x)*.25,y:(pa.y+pb.y+pc.y+pd.y)*.25+bob,z:(pa.z+pb.z+pc.z+pd.z)*.25}),rfn=rot(fn),diffuse=Math.max(0,0.55*rfn.z+0.30*rfn.y-0.15*rfn.x),sideFill=Math.max(0,0.20*rfn.x+0.10*rfn.z),isFront=rfn.z>=-0.08,pA=proj(rva),pB=proj(rvb),pC=proj(rvc),pD=proj(rvd),col=PAL_C[q.ci],litAdj=isFront?diffuse*52+sideFill*18:-26,lit=Math.max(6,Math.min(92,col.l+litAdj)),alph=isFront?0.82+diffuse*0.16:0.06;return{pA,pB,pC,pD,col,lit,alph,depth:rc.z,isFront};});
      faceData.sort((a,b)=>a.depth-b.depth);
      faceData.forEach(f=>{const{h,s}=f.col;ctx.beginPath();ctx.moveTo(f.pA.x,f.pA.y);ctx.lineTo(f.pB.x,f.pB.y);ctx.lineTo(f.pD.x,f.pD.y);ctx.lineTo(f.pC.x,f.pC.y);ctx.closePath();ctx.fillStyle=`hsla(${h},${s}%,${f.lit.toFixed(0)}%,${f.alph.toFixed(2)})`;ctx.fill();if(f.isFront){const edgeLit=f.col.ci>=5?f.lit*1.3:f.lit*0.48,edgeAlph=f.col.ci>=5?0.85:0.55;ctx.strokeStyle=`hsla(${h},${s}%,${Math.min(92,edgeLit).toFixed(0)}%,${edgeAlph})`;ctx.lineWidth=f.col.ci>=5?1.1:0.7;ctx.stroke();}});
      drawSpireTips(tf,angY,angX,bob);drawGemlets(tf);drawDust(tf);
      animId=requestAnimationFrame(frame);
    }

    watchVisibility(
      wrap.closest('section'),
      ()=>{ if(!animId) animId=requestAnimationFrame(frame); },
      ()=>{ if(animId){ cancelAnimationFrame(animId); animId=0; } }
    );
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function init() {
    const d = document.getElementById('discipline-anim');
    const c = document.getElementById('confidence-anim');
    const h = document.getElementById('health-anim');
    const l = document.getElementById('legacy-anim');
    if (d) startDiscipline(d);
    if (c) startConfidence(c);
    if (h) startHealth(h);
    if (l) startLegacy(l);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();