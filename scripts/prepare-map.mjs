import {mkdirSync,copyFileSync} from 'node:fs';
mkdirSync('public/vendor',{recursive:true});
for(const file of ['maplibre-gl-worker.mjs','maplibre-gl-shared.mjs'])copyFileSync('node_modules/maplibre-gl/dist/'+file,'public/vendor/'+file);
