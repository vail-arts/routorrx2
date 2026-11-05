'use client';
import {useState} from 'react';
import ContinuousTabs from './watermelon/ContinuousTabs';
import {RadialCarousel} from './watermelon/RadialCarousel';
import {plates} from '@/content/plates';
import {photos} from '@/content/photos';

const collections=[{id:'photos',label:'Photographs (10)'},{id:'art',label:'Illustrations & film'}] as const;
export default function PlateBrowser(){
 const [group,select]=useState<'photos'|'art'>('photos');
 return <><ContinuousTabs label="Plate collection" items={collections} value={group} onChange={select}/>
 <RadialCarousel key={group} items={group==='photos'?photos:plates} radius={220} thumbnailSize={group==='photos'?54:90} centerSize={420}/></>;
}
