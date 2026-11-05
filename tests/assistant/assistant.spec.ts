import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 page.on('pageerror',e=>{throw e;});
 await page.route('**/api/search',r=>r.fulfill({json:[{name:'Test place',lat:20.27,lon:73}]}));
 await page.route('**/api/route',r=>r.fulfill({json:[{distance:1,duration:800,coordinates:[[73,20.27],[73.01,20.28]],steps:['Walk along Test Street.']}]}));
 await page.goto('/app');await page.getByPlaceholder('A place in Silvassa').fill('Test place');
 for(let i=0;i<2;i++){await page.getByRole('button',{name:'Search places'}).click();await page.getByRole('button',{name:'Test place',exact:true}).click();}
 await page.getByRole('button',{name:'Find walking routes ↗'}).click();await expect(page.getByText('1.00 km')).toBeVisible();await page.getByText('Explain my route · OpenRouter',{exact:true}).click();
});
test('consent gates request; payload excludes coordinates and contacts',async({page})=>{
 let body:unknown;await page.route('**/api/assistant',r=>{body=r.request().postDataJSON();return r.fulfill({json:{answer:'Test explanation from the mocked backend.'}});});
 const button=page.getByRole('button',{name:'Explain this route',exact:true});await expect(button).toBeDisabled();expect(body).toBeUndefined();
 await page.getByRole('checkbox').check();await button.click();await expect(page.getByText('Test explanation from the mocked backend.')).toBeVisible();
 expect(body).toEqual({question:'Explain this walk in plain language.',route:{distance:1,duration:800,steps:['Walk along Test Street.']}});
 await page.getByRole('button',{name:/STARTING POINT/}).click();await page.getByRole('button',{name:'Search places'}).click();await page.getByRole('button',{name:'Test place',exact:true}).click();await expect(page.getByText('Test explanation from the mocked backend.')).toHaveCount(0);
});
test('quota error and invalid response can be retried',async({page})=>{
 let calls=0;await page.route('**/api/assistant',r=>{calls++;return calls===1?r.fulfill({status:429,json:{error:'Test quota reached'}}):calls===2?r.fulfill({json:{answer:null}}):r.fulfill({json:{answer:'Valid retry response'}});});
 await page.getByRole('checkbox').check();const send=page.getByRole('button',{name:'Explain this route',exact:true});await send.click();await expect(page.getByRole('alert').filter({hasText:'Test quota reached'})).toHaveText('Test quota reached');await send.click();await expect(page.getByRole('alert').filter({hasText:'The service returned invalid data.'})).toHaveText('The service returned invalid data. Please try again later.');await send.click();await expect(page.getByText('Valid retry response')).toBeVisible();
});
