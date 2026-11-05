import {expect,test} from '@playwright/test';
test('attach a photo, moderate a rated report and read it in an independent session',async({page,browser})=>{
 const point={name:'Fixture crossing',lat:20.27,lon:73},route={id:'walk-1',distance:1,duration:720,coordinates:[[73,20.27],[73.01,20.28]],steps:['Continue']};
 const row={id:'published-1',type:'Other',note:'Loose stones at the crossing',point,created:new Date().toISOString(),rating:4,routeId:route.id,status:'published'};
 let analysisCalls=0,writes=0;
 async function journey(p:typeof page){
  await p.route('**/api/search',r=>r.fulfill({json:[point]}));
  await p.route('**/api/route',r=>r.fulfill({json:[route]}));
  await p.goto('/app');await p.getByPlaceholder('A place in Silvassa').fill('crossing');
  for(let i=0;i<2;i++){await p.getByRole('button',{name:'Search places'}).click();await p.getByRole('button',{name:point.name,exact:true}).click();}
  await p.getByRole('button',{name:/Find walking routes/}).click();await expect(p.getByText('1.00 km')).toBeVisible();
 }
 await journey(page);await page.getByRole('tab',{name:'Reports'}).click();
 await page.getByRole('combobox',{name:'Issue',exact:true}).selectOption('Other');
 await page.getByLabel('Observation').fill(row.note);await page.getByLabel('Rate this walk').selectOption('4');
 await page.getByRole('button',{name:'Add issue photo'}).click();const dialog=page.getByRole('dialog',{name:'Issue photo'});
 await expect(dialog.getByLabel('Take a photo')).toHaveAttribute('capture','environment');
 await dialog.getByLabel('Choose from device').setInputFiles('public/icon-192.png');await expect(dialog).not.toBeVisible();
 await expect(page.getByAltText('Selected road issue')).toBeVisible();
 await page.route('**/api/reports/analyze',r=>{analysisCalls++;expect(Object.keys(r.request().postDataJSON())).toEqual(['photo']);return r.fulfill({json:{observation:'Possible loose gravel.'}});});
 await page.getByText('routorrX AI · Photo analysis',{exact:true}).click();expect(analysisCalls).toBe(0);
 await page.getByRole('button',{name:'Send photo for analysis'}).click();await expect(page.getByText('Possible loose gravel.')).toBeVisible();
 await page.getByRole('button',{name:'Save local draft'}).click();await expect(page.getByAltText('Road issue in private draft')).toBeVisible();
 await page.route('**/api/reports',r=>{writes++;const d=r.request().postDataJSON();expect(d).toMatchObject({note:row.note,routeId:route.id,rating:4,type:'Other'});expect(d.photo).toMatch(/^data:image\/jpeg;base64,/);return r.fulfill({json:{id:'pending-1',status:'pending'}});});
 expect(writes).toBe(0);await page.getByRole('button',{name:'Submit for public review'}).click();await expect(page.getByRole('button',{name:'Awaiting moderation'})).toBeVisible();
 const viewer=await browser.newContext({baseURL:test.info().project.use.baseURL});
 try{
  const other=await viewer.newPage();await journey(other);
  await other.route('**/api/reports?**',r=>{expect(new URL(r.request().url()).searchParams.get('routeId')).toBe('walk-1');return r.fulfill({json:{items:[row],nextCursor:null}});});
  await other.getByText('Explain my route · OpenRouter',{exact:true}).click();await other.getByRole('button',{name:'Refresh reports'}).click();
  await expect(other.getByText(row.note)).toBeVisible();await expect(other.getByText(/Walker rating 4\/5/)).toBeVisible();
  await other.route('**/api/assistant',r=>{expect(r.request().postDataJSON().reportIds).toEqual([row.id]);return r.fulfill({json:{answer:'A walker reported loose stones.'}});});
  await other.getByRole('checkbox').check();await other.getByRole('button',{name:'Explain this route',exact:true}).click();
  await expect(other.getByText('A walker reported loose stones.')).toBeVisible();
 }finally{await viewer.close();}
});
