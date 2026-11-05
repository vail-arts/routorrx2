import {PlateCard} from './watermelon/FieldNotes';
import {photos} from '@/content/photos';
export default function StreetPhotos(){return <section id="street-photos" className="section"><span className="eyebrow">FIELD NOTEBOOK / 10 PHOTOGRAPHS</span><h2>Evening field notes.</h2><p>Look closer at lighting, pavement and the space people share. These photographs record individual moments.</p><div className="photo-notes">{photos.map(plate=><PlateCard key={plate.id} plate={plate}/>)}</div></section>;}
