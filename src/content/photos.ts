const notes=[
 ['Last light','Orange clouds and the setting sun above the tree line.'],
 ['Along the median','Street lamps illuminate cars and a bicycle beside a divided road.'],
 ['Under the canopy','A roadside tree and vegetation border a narrow pool of light.'],
 ['Sharing the edge','Two pedestrians walk by the kerb as bicycles and motorcycles pass.'],
 ['Between vehicles','A pedestrian carrying a bag crosses among evening traffic.'],
 ['A quieter lane','A cyclist and a walker follow a tree-lined lane with no visible divider.'],
 ['Light on the footpath','Illuminated palms line a paved path beside the shops.'],
 ['A break in the paving','A tiled path meets a rough verge and an opening beside the road.'],
 ['At the barrier','Motorcycles pass temporary barriers beside a highway warning sign.'],
 ['At pavement level','A dog walks beside vegetation along the edge of a tiled footpath.']
];
export const photos=notes.map(([title,detail],i)=>({id:'photo-'+i,title,alt:detail,detail,url:'/field/study-'+(i+1)+'.webp',label:'FIELD PHOTO / '+String(i+1).padStart(2,'0')}));
