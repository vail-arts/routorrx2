import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{page.on('pageerror',err=>{throw err});});

test('walking preferences, routine order and recurring schedule survive reload',async({page})=>{
 await page.goto('/app');
 const activities=page.getByRole('tab',{name:'Activities'});
 await activities.click();
 const knob=page.getByRole('slider',{name:'Preferred duration'});
 await knob.scrollIntoViewIfNeeded();
 const box=(await knob.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+4);await page.mouse.down();
 await page.mouse.move(box.x+box.width-4,box.y+box.height/2,{steps:6});await page.mouse.up();
 await expect(knob).toHaveAttribute('aria-valuenow','34');
 await knob.press('ArrowRight');await expect(knob).toHaveAttribute('aria-valuenow','35');
 await page.getByRole('button',{name:'Pin Evening walk',exact:true}).click();
 await page.getByRole('button',{name:'Move Evening walk up'}).click();
 await page.getByRole('button',{name:'Jogging session',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Activity',exact:true})).toHaveValue('Jogging');
 await page.getByLabel('Walk name').fill('Evening loop');await page.getByLabel('Local date and time').fill('2027-02-14T17:45');
 await page.getByRole('combobox',{name:'Repeat',exact:true}).selectOption('Weekly');await page.getByRole('button',{name:'Add reminder'}).click();
 await page.reload();await activities.click();await expect(knob).toHaveAttribute('aria-valuenow','35');
 await expect(page.locator('.routine-row').first()).toContainText('Evening walk');await expect(page.getByRole('button',{name:'Pin Evening walk',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.local-row')).toContainText('Weekly');await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('Walk name').fill('River loop');await page.getByRole('button',{name:'Save changes'}).click();
 await expect(page.locator('.local-row')).toContainText('River loop');await page.getByRole('button',{name:'Delete',exact:true}).click();await expect(page.locator('.local-row')).toHaveCount(0);
});

test('street plates, radial drag, details and feedback export',async({page})=>{
 await page.goto('/impact');await page.locator('button.plate-card').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Walking after dark'}).click();await expect(page.locator('.detail-copy')).toContainText('trusted contact');
 await page.goto('/technology');await page.getByRole('button',{name:'Browse plates'}).click();
 const wheel=page.locator('.radial-wheel');await wheel.scrollIntoViewIfNeeded();const b=(await wheel.boundingBox())!;
 const thumb=page.locator('.radial-thumb').first();await expect(thumb).toBeVisible();
 await expect(page.locator('.radial-thumb')).toHaveCount(10);
 const before=await thumb.evaluate(el=>getComputedStyle(el).transform);
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+75,b.y+b.height/2,{steps:10});await page.mouse.up();
 await expect.poll(()=>thumb.evaluate(el=>getComputedStyle(el).transform)).not.toBe(before);
 await page.getByRole('button',{name:'At pavement level',exact:true}).click();await expect(page.locator('.radial-photo img')).toHaveAttribute('src','/field/study-10.webp');
 await page.getByRole('button',{name:'Illustrations & film'}).click();await page.getByRole('button',{name:'Browse plates'}).click();await page.getByRole('button',{name:'The last few metres'}).click();await expect(page.locator('.radial-photo img')).toHaveAttribute('src','/atlas/crossing.svg');
 await page.goto('/experience#feedback');await page.getByRole('button',{name:'Needs work'}).click();await page.getByLabel('Feedback topic').selectOption('Incorrect route');
 await page.getByLabel('Your feedback').fill('Please check the indicated crossing.');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download draft'}).click();expect((await download).suggestedFilename()).toBe('routorrx-feedback.json');
});

test('place command carries a real search result into the planner',async({page})=>{
 await page.route('**/api/search',r=>r.fulfill({json:[{name:'Test library',lat:20.276,lon:73.008}]}));
 await page.goto('/');await page.locator('.command-trigger').click();
 await page.getByLabel('Search pages and tools').fill('Library');await page.getByRole('dialog').getByRole('button',{name:'Search places'}).click();
 await page.getByRole('button',{name:'Test library'}).click();await expect(page).toHaveURL('/app');await expect(page.getByRole('button',{name:/DESTINATION Test library/})).toBeVisible();
});

test('four viewport sizes fit public pages and navigation',async({page},info)=>{
 test.skip(info.project.name==='mobile','Widths include mobile here');
 for(const width of [360,768,1024,1440]){
   await page.setViewportSize({width,height:850});
   for(const path of ['/','/features','/technology','/impact','/experience','/app']){
    await page.goto(path);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' '+path).toBe(true);
   }
 }
 await page.setViewportSize({width:360,height:800});await page.goto('/');await page.getByRole('button',{name:/Menu/}).click();await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Features'}).click();await expect(page).toHaveURL('/features');await page.getByRole('link',{name:'Try Out',exact:true}).first().click();await expect(page).toHaveURL('/app');
});

test('real map canvas pans, zooms and keeps its markers across route selection',async({page})=>{
 await page.route('**/tile.openstreetmap.org/**',r=>r.fulfill({path:'public/icon-192.png',contentType:'image/png'}));
 await page.route('**/api/search',r=>r.fulfill({json:[{name:'Test start',lat:20.276,lon:73.008},{name:'Test end',lat:20.279,lon:73.013}]}));
 let calls=0;
 await page.route('**/api/route',r=>{calls++;return r.fulfill({json:[0,1].map(i=>({distance:1+i,duration:800,steps:['Continue'],coordinates:[[73.008,20.276],[73.013+i*.002,20.279]]}))})});
 await page.goto('/app');await page.getByRole('button',{name:'View on map',exact:true}).click();
 const canvas=page.locator('canvas.maplibregl-canvas');await expect(canvas).toBeVisible();
 await page.getByPlaceholder('A place in Silvassa').fill('test');
 for(const name of ['Test start','Test end']){await page.getByRole('button',{name:'Search places'}).click();await page.getByRole('button',{name,exact:true}).click();}
 await page.getByRole('button',{name:/Find walking routes/}).click();
 await page.getByRole('button',{name:'Compare routes'}).click();await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
 const pin=page.locator('.maplibregl-marker').first();await pin.evaluate(el=>el.setAttribute('data-same-pin','yes'));
 await page.locator('.route-option').nth(1).click();await expect(page.locator('.route-option').nth(1)).toHaveAttribute('aria-pressed','true');await expect(pin).toHaveAttribute('data-same-pin','yes');
 await page.getByRole('button',{name:'Dark',exact:true}).click();await expect(canvas).toBeVisible();
 await page.getByRole('button',{name:/Zoom in/i}).click();
 await canvas.scrollIntoViewIfNeeded();
 const b=(await canvas.boundingBox())!;const before=await pin.getAttribute('style');
 await page.mouse.move(b.x+b.width*.43,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.6,b.y+b.height*.6,{steps:12});await page.mouse.up();
 await expect.poll(()=>pin.getAttribute('style')).not.toBe(before);
 await page.getByRole('button',{name:'Close map'}).click();await expect(canvas).toHaveCount(0);
 await page.getByRole('button',{name:/View route on map/}).click();await expect(canvas).toBeVisible();
 await expect(page.locator('.maplibregl-marker')).toHaveCount(2);
 await page.getByRole('button',{name:'Directions ↓'}).click();await expect(page.getByRole('list',{name:'Walking directions'})).toBeFocused();
 await page.getByRole('button',{name:/Find walking routes/}).click();expect(calls).toBe(1);
});

test('silver site background, Impact slider and planner disclosures',async({page})=>{
 await page.goto('/impact');const canvas=page.locator('body > canvas.liquid');
 await expect(canvas).toHaveCSS('position','fixed');await expect(canvas).toBeVisible();
 const slider=page.getByRole('slider',{name:'Illustrative calorie goal'});await slider.press('End');await expect(slider).toHaveValue('350');
 await expect(page.locator('.impact-energy output')).toHaveText('350 kcal');
 await page.getByRole('link',{name:'Try Out',exact:true}).first().click();await expect(canvas).toHaveCount(1);
 const guide=page.getByRole('region',{name:'Walking guide carousel'});
 await guide.getByRole('button',{name:'Next capability'}).click();await expect(guide.getByRole('heading')).toHaveText('Set up your safety tools');await guide.getByRole('button',{name:'Open tool'}).click();await expect(page.getByRole('tab',{name:'Safety'})).toHaveAttribute('aria-selected','true');
 await page.getByRole('tab',{name:'Activities'}).click();await page.getByRole('button',{name:/Walk invitations/}).click();
 await page.getByLabel('Walk invitation',{exact:true}).fill('Sunday morning walk');await page.getByRole('button',{name:'Add draft'}).click();
 await expect(page.locator('.invite-title b')).toHaveText('1');
 await page.getByRole('button',{name:'Remove Sunday morning walk'}).click();await expect(page.locator('.invite-title b')).toHaveText('0');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(canvas).toBeHidden();
});

test('studio handoff, goal duration, destination weather and QR export',async({page})=>{
 await page.goto('/');await expect(page.locator('.studio-type strong')).toHaveText('VAIL ARTS');
 await expect(page.locator('.studio-opening')).toHaveText('VAIL ARTS');await page.locator('.hero').scrollIntoViewIfNeeded();
 await page.goto('/technology');const browser=page.getByRole('button',{name:'01 / Your browser'});await browser.click();await expect(browser).toHaveAttribute('aria-expanded','true');await browser.click();await expect(browser).toHaveAttribute('aria-expanded','false');await expect(page.locator('#street-photos')).toHaveCount(0);
 await page.goto('/impact');await page.getByLabel('Tracker rate (kcal/min)').fill('4');await page.getByRole('button',{name:/Use duration in planner/}).click();await expect(page).toHaveURL('/app');
 await page.getByRole('tab',{name:'Activities'}).click();await expect(page.getByRole('slider',{name:'Preferred duration'})).toHaveAttribute('aria-valuenow','50');
 await page.getByRole('tab',{name:'Plan a walk'}).click();await page.getByRole('button',{name:/DESTINATION/}).click();
 await page.route('**/api/search',r=>r.fulfill({json:[{name:'Library',lat:20.276,lon:73.008}]}));
 let body:unknown;await page.route('**/api/weather',r=>{body=r.request().postDataJSON();return r.fulfill({json:{temperature_2m:26,relative_humidity_2m:42,weather_code:0,time:'2026-11-03T12:00'}})});
 await page.getByPlaceholder('A place in Silvassa').fill('Library');await page.getByRole('button',{name:'Search places'}).click();await page.getByRole('button',{name:'Library',exact:true}).click();
 const weather=page.getByRole('button',{name:'Destination weather · Library'});await expect(weather).toHaveAttribute('aria-expanded','true');expect(body).toBeUndefined();
 await page.getByRole('button',{name:/Refresh weather/}).click();await expect(page.getByText('26°C',{exact:false}).first()).toBeVisible();expect(body).toMatchObject({point:{lat:20.276,lon:73.008}});await weather.click();await expect(weather).toHaveAttribute('aria-expanded','false');
 await page.goto('/experience');await page.getByRole('button',{name:/Share routorrX/}).click();await page.getByRole('button',{name:/More/i,exact:false}).last().click();await page.getByRole('button',{name:'Share via QR'}).click();const file=page.waitForEvent('download');await page.getByRole('button',{name:'Download QR'}).click();expect((await file).suggestedFilename()).toMatch(/\.svg$/);await page.keyboard.press('Escape');
});

test('wordmark-only opening, right dock, hover-only button rims and feature ripples',async({page})=>{
 await page.goto('/');await expect(page.locator('.studio-opening')).toHaveText('VAIL ARTS');
 await page.goto('/features');const cards=page.locator('[data-feature-point]');
 await expect(cards).toHaveCount(6);
 const dock=await page.locator('.studio-dock').boundingBox();expect(dock!.x).toBeGreaterThan((page.viewportSize()?.width||0)/2);
 for(const card of await cards.all()){
   const heading=card.locator('h2'),title=await heading.getAttribute('aria-label');
   await card.focus();await expect.poll(()=>heading.innerText(),{intervals:[10]}).not.toBe(title);
   await expect(heading).toHaveText(title!);
 }
 const trigger=page.locator('.command-trigger');
 await expect.poll(()=>trigger.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('0');
 if(await page.evaluate(()=>matchMedia('(hover:hover)').matches)){
   await trigger.hover();await expect.poll(()=>trigger.evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');
 }
 await page.goto('/app');expect(await page.locator('.planner-tabs button').first().evaluate(el=>getComputedStyle(el,'::after').content)).toBe('none');
});

test('morph rotation and glass dock support keyboard controls',async({page})=>{
 await page.goto('/');const block=page.locator('.morph-block');await block.scrollIntoViewIfNeeded();
 const words=block.locator('.morph-words span');await expect(words).toHaveCount(3);
 await block.getByRole('button',{name:'Pause word rotation'}).click();await expect(words.first()).toHaveCSS('animation-play-state','paused');
 await block.getByRole('button',{name:'Pause word rotation'}).click();await expect(words.first()).toHaveCSS('animation-play-state','running');
 await page.goto('/features');const dock=page.getByRole('navigation',{name:'Studio shortcuts'});await dock.getByRole('link',{name:'Home'}).focus();await expect(dock.locator('.dock-hint')).toHaveText('Home');
 await page.keyboard.press('Tab');await expect(dock.getByRole('link',{name:'GitHub repository'})).toBeFocused();await expect(dock.locator('.dock-hint')).toHaveText('GitHub repository');
 await expect(page.locator('.corner-edition')).toHaveText('routorrX v2 / 02');
});

test('dock parks on upward scroll and opens on downward scroll',async({page})=>{
 await page.goto('/features');const shell=page.locator('.dock-shell');
 await page.evaluate(()=>window.scrollTo({top:750,behavior:'instant'}));
 await expect(shell).toHaveAttribute('data-mode','open');
 await page.evaluate(()=>window.scrollTo({top:350,behavior:'instant'}));
 await expect(shell).toHaveAttribute('data-mode','parked');const opener=page.getByRole('button',{name:'Open studio shortcuts'});
 await opener.click();await expect(shell.getByRole('link',{name:'Home',exact:true})).toBeFocused();
 await expect(shell).toHaveAttribute('data-mode','open');
 await page.evaluate(()=>(document.activeElement as HTMLElement)?.blur());
 await page.evaluate(()=>window.scrollTo({top:150,behavior:'instant'}));await expect(shell).toHaveAttribute('data-mode','parked');
 await page.evaluate(()=>window.scrollTo({top:600,behavior:'instant'}));await expect(shell).toHaveAttribute('data-mode','open');
});

test('studio wordmark scatters on contact, settles and respects reduced motion',async({page,isMobile})=>{
  await page.goto('/');
  const word=page.locator('.particle-wordmark');
  await expect(word).toHaveText('VAIL ARTS');
  await expect(word.locator('[data-glyph]')).toHaveCount(0);
  const frame=page.locator('.studio-frame');
  await expect(frame).toHaveAttribute('data-particles','');
  await expect(word).not.toHaveAttribute('data-forming','');
  const idle=await word.screenshot();
  const box=(await word.boundingBox())!;
  const point={x:box.x+box.width*.06,y:box.y+box.height*.5};
  const contact=async()=>{
    if(isMobile)await page.touchscreen.tap(point.x,point.y);
    else await page.mouse.move(point.x,point.y);
  };
  await contact();
  await expect(word).toHaveAttribute('data-scattering','');
  expect((await word.screenshot()).equals(idle)).toBe(false);
  await page.mouse.move(1,1);
  await expect(word).not.toHaveAttribute('data-scattering','');
  expect((await word.screenshot()).equals(idle)).toBe(true);
  await page.emulateMedia({reducedMotion:'reduce'});
  await contact();await expect(frame.locator('canvas')).toHaveCSS('opacity','0');
  await expect(word.locator('.wordmark-ink')).toHaveCSS('opacity','1');
});

test('spotlight follows the public links and preserves active-page navigation',async({page,isMobile})=>{
  await page.goto('/technology');
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  const menu=page.getByRole('button',{name:/Menu/});
  if(isMobile)await menu.click();
  const active=nav.getByRole('link',{name:'Technology'});
  await expect(active).toHaveAttribute('aria-current','page');
  const marker=nav.locator(':scope > .spotlight-mark');
  await expect(marker).toBeVisible();
  const target=nav.getByRole('link',{name:'Impact'});
  await target.focus();
  const light=nav.locator('.spotlight-light');
  await expect.poll(()=>light.evaluate(el=>(el as HTMLElement).style.transform)).toMatch(/^translate/);
  if(!isMobile){
    const xBefore=await light.evaluate(el=>(el as HTMLElement).style.transform);
    await nav.getByRole('link',{name:'Home'}).hover();
    await expect.poll(()=>light.evaluate(el=>(el as HTMLElement).style.transform)).not.toBe(xBefore);
  }
  expect(await target.evaluate(el=>getComputedStyle(el,'::after').content)).toBe('none');
  await target.press('Enter');await expect(page).toHaveURL('/impact');
  if(isMobile)await menu.click();
  const selected=nav.getByRole('link',{name:'Impact'});
  await expect(selected).toHaveAttribute('aria-current','page');
  const tab=(await selected.boundingBox())!;
  await expect.poll(async()=>{
    const m=(await marker.boundingBox())!;
    return Math.abs(isMobile?(m.y+m.height/2)-(tab.y+tab.height/2):(m.x+m.width/2)-(tab.x+tab.width/2));
  }).toBeLessThan(2);
  if(isMobile){
    await nav.getByRole('link',{name:'Impact'}).press('Escape');
    await expect(menu).toBeFocused();await expect(nav).toBeHidden();
  }
});

test('studio title remains readable without WebGL',async({page})=>{
  await page.addInitScript(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<typeof getContext>){
      if(this.matches('.studio-particles')&&args[0]==='webgl')return null;
      return Reflect.apply(getContext,this,args);
    } as typeof getContext;
  });
  await page.goto('/');
  const word=page.locator('.particle-wordmark');
  await expect(word.locator('.wordmark-ink')).toHaveText('VAIL ARTS');
  await expect(word.locator('.wordmark-ink')).toHaveCSS('opacity','1');
  await expect(page.locator('.studio-frame')).not.toHaveAttribute('data-particles','');
});

test('grab carries lettering across the opening and releases it',async({page,isMobile})=>{
  await page.goto('/');
  const frame=page.locator('.studio-frame'),word=frame.locator('.particle-wordmark');
  await expect(frame).toHaveAttribute('data-particles','');
  await expect(word).not.toHaveAttribute('data-forming','');
  const stage=(await frame.boundingBox())!,letters=(await word.boundingBox())!;
  const from={x:letters.x+letters.width*.56,y:letters.y+letters.height/2};
  const to={x:stage.x+stage.width*.85,y:stage.y+stage.height*.18};
  const corner={x:Math.floor(to.x-32),y:Math.floor(to.y-32),width:64,height:64};
  const idle=await page.screenshot({clip:corner});
  const session=isMobile?await page.context().newCDPSession(page):null;
  if(session){
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});
  }else{
    await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:6});
  }
  await expect(frame).toHaveAttribute('data-grabbing','');
  await expect.poll(async()=>(await page.screenshot({clip:corner})).equals(idle)).toBe(false);
  if(session)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  else await page.mouse.up();
  await expect(frame).not.toHaveAttribute('data-grabbing','');
  await expect.poll(async()=>(await page.screenshot({clip:corner})).equals(idle)).toBe(true);
  await word.focus();await word.press('ArrowDown');await expect(frame).toHaveAttribute('data-grabbing','');
  await word.press('Escape');await expect(frame).not.toHaveAttribute('data-grabbing','');
});

test('invalid issue photos can be dismissed and feedback accepts Other',async({page})=>{
 await page.goto('/app');await page.getByRole('tab',{name:'Reports',exact:true}).click();
 const open=page.getByRole('button',{name:'Add issue photo'});await open.click();
 const sheet=page.getByRole('dialog',{name:'Issue photo'});
 await sheet.getByLabel('Choose from device').setInputFiles({name:'sample.txt',mimeType:'text/plain',buffer:Buffer.from('not an image')});
 await expect(sheet.getByRole('alert')).toContainText('JPEG, PNG or WebP');await page.keyboard.press('Escape');
 await expect(sheet).not.toBeVisible();await expect(open).toBeFocused();
 await page.goto('/experience#feedback');await page.getByRole('button',{name:'Needs work'}).click();
 await page.getByRole('combobox',{name:'Feedback topic'}).selectOption('Other');
 await page.getByLabel('Your feedback').fill('A different observation.');await page.getByRole('button',{name:'Save draft'}).click();
 await expect(page.getByText('Draft saved in this tab.')).toBeVisible();
});
