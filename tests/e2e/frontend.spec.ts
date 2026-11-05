import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{page.on('pageerror',error=>{throw error;});page.on('console',msg=>{if(msg.type()==='error'&&/hydrat/i.test(msg.text()))throw new Error(msg.text());});await page.route('**/api/search',r=>r.fulfill({json:[{name:'Fixture starting place',lat:20.276,lon:73.008},{name:'Fixture destination',lat:20.28,lon:73.012}]}));await page.route('**/api/route',r=>r.fulfill({json:[{distance:.741,duration:533,coordinates:[[73.008,20.276],[73.012,20.28]],steps:['Walk to the selected destination.']}]}));await page.route('**/tile.openstreetmap.org/**',r=>r.abort());});
test('all public and legal routes render without horizontal overflow',async({page})=>{for(const url of ['/','/features','/technology','/impact','/experience','/privacy','/terms','/cookies','/disclaimer','/accessibility','/community-guidelines','/contact']){await page.goto(url);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}});
test('homepage street fits its canvas and keeps its geometry on scroll', async ({page}) => {
  await page.goto('/');
  const canvas=page.locator('[data-pedestrian-scene] canvas');
  await canvas.scrollIntoViewIfNeeded();
  const coverage=()=>canvas.evaluate(el=>{
    const c=el as HTMLCanvasElement, {width:w,height:h}=c;
    const pixels=c.getContext('2d')!.getImageData(0,0,w,h).data;
    let left=w,right=0,top=h,bottom=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>150){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    return left>0&&right<w-1&&top>0&&bottom<h-1&&(right-left)/w>.93&&(bottom-top)/h>.93;
  });
  await expect.poll(coverage).toBe(true);
  await canvas.evaluate(el=>window.scrollBy({top:el.getBoundingClientRect().top+el.clientHeight*.6,behavior:'instant'}));
  await expect.poll(coverage).toBe(true);
  await expect(page.locator('.tideform')).toHaveCount(0);
  await expect(page.getByRole('region',{name:'Interactive Silvassa map'})).toHaveCount(0);
  await expect(page.getByPlaceholder('A place in Silvassa')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Try Out',exact:true}).first()).toHaveAttribute('href','/app');
});
test('search, route result and local report draft',async({page})=>{await page.goto('/app');await page.getByPlaceholder('A place in Silvassa').fill('Silvassa');await page.getByRole('button',{name:'Search places'}).click();await page.getByRole('button',{name:'Fixture starting place',exact:true}).click();await page.getByRole('button',{name:'Search places'}).click();await page.getByRole('button',{name:'Fixture destination',exact:true}).click();await page.getByRole('button',{name:'Find walking routes ↗'}).click();await expect(page.getByText('0.74 km')).toBeVisible();await page.getByRole('tab',{name:'Reports',exact:true}).click();await page.getByLabel('Observation').fill('Fixture obstruction for frontend test');await page.getByRole('button',{name:'Save local draft'}).click();await expect(page.getByText('Unverified local draft')).toBeVisible();});
test('map appearance persists after revisiting Try Out', async ({page}) => {
  await page.goto('/app');
  const reveal = page.getByRole('button',{name:'View on map',exact:true});
  const theme = (name:string) => page.getByRole('button',{name,exact:true});
  await reveal.click();
  await theme('Light').click();
  await expect(theme('Light')).toHaveAttribute('aria-pressed','true');
  await page.reload();
  await reveal.click();
  await expect(theme('Light')).toHaveAttribute('aria-pressed','true');
  await theme('Dark').click();
  await expect(theme('Dark')).toHaveAttribute('aria-pressed','true');
  await theme('Auto').click();
  await expect(theme('Auto')).toHaveAttribute('aria-pressed','true');
});
test('search dialog keyboard and card navigation',async({page})=>{await page.goto('/');await page.locator('.command-trigger').click();await page.getByLabel('Search pages and tools').fill('Features');await page.getByLabel('Search pages and tools').press('ArrowDown');await expect(page.getByRole('link',{name:'Features ↗',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await page.getByRole('button',{name:'Next capability'}).click();await expect(page.getByRole('heading',{name:'Keep someone close'})).toBeVisible();});
test('demo ad starts only on click and returns to its button when playback ends', async ({page}) => {
  const requests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
  await page.goto('/');
  const trigger = page.getByRole('button', {name: /Watch demo ad/});
  const player = page.getByRole('dialog', {name: 'routorrX demo ad'});
  const video = page.locator('.film-modal video');
  await expect(trigger).toBeVisible();
  await expect(video).not.toHaveAttribute('src', /.+/);
  expect(requests).toHaveLength(0);
  await trigger.click();
  await expect(player).toBeVisible();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
  const duration = await video.evaluate(el => (el as HTMLVideoElement).duration);
  expect(duration).toBeCloseTo(15, 0);
  await expect(player).toBeHidden({timeout: 20000});
  await expect(trigger).toBeFocused();
  await expect(video).not.toHaveAttribute('src', /.+/);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await trigger.click();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime)).toBeLessThan(2);
  await page.keyboard.press('Escape');
  await expect(player).toBeHidden();
  await expect(trigger).toBeFocused();
});
test('API failure remains visible and tabs work with keyboard',async({page})=>{await page.route('**/api/search',r=>r.fulfill({status:503,json:{error:'Fixture provider unavailable'}}));await page.goto('/app');await page.getByPlaceholder('A place in Silvassa').fill('Silvassa');await page.getByRole('button',{name:'Search places'}).click();await expect(page.getByRole('status')).toHaveText('Fixture provider unavailable');await page.getByRole('tab',{name:'Plan a walk'}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Safety',exact:true})).toBeFocused();await expect(page.getByLabel('Emergency phone number')).toHaveValue('112');});
test('OpenRouter panel is honest while disconnected and distance slider works by keyboard',async({page})=>{await page.goto('/');const slider=page.getByRole('slider',{name:'Walking distance preference preview'});await slider.focus();await page.keyboard.press('ArrowRight');await expect(slider).toHaveValue('4');await page.goto('/app');await page.getByText('Explain my route · OpenRouter',{exact:true}).click();await expect(page.getByText('Not connected yet.',{exact:false})).toBeVisible();});
test('reduced motion keeps the pedestrian model intact while scrolling', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  const scene = page.locator('[data-pedestrian-scene]');
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toBeVisible();
  const frame=()=>scene.locator('canvas').evaluate(el=>(el as HTMLCanvasElement).toDataURL());
  await expect.poll(()=>scene.locator('canvas').evaluate(el=>{
    const c=el as HTMLCanvasElement;
    return c.getContext('2d')!.getImageData(c.width>>1,c.height>>1,1,1).data[3];
  })).toBeGreaterThan(0);
  const before=await frame();
  await scene.evaluate(el => {
    const rect = el.getBoundingClientRect();
    window.scrollBy({top:rect.top + rect.height * .6,behavior:'instant'});
  });
  await expect.poll(frame).toBe(before);
});
test('invalid provider data and corrupted stored reports remain recoverable',async({page})=>{await page.addInitScript(()=>localStorage.setItem('rx-reports',JSON.stringify([null,{note:'bad'}])));await page.route('**/api/search',r=>r.fulfill({json:[{name:'Broken place',lat:999,lon:73}]}));await page.goto('/app');await page.getByPlaceholder('A place in Silvassa').fill('Silvassa');await page.getByRole('button',{name:'Search places'}).click();await expect(page.getByRole('status')).toHaveText('The service returned invalid data. Please try again later.');await page.getByRole('tab',{name:'Reports',exact:true}).click();await expect(page.getByRole('heading',{name:'Notice something?'})).toBeVisible();await expect(page.locator('.report')).toHaveCount(0);});
