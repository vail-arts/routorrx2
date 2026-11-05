import {ExpandDetails} from './watermelon/FieldNotes';
const content={
 home:['Before you walk','Working · Search for a start and destination, compare available walking routes and check local weather. Verify crossings and access as you walk.'],
 features:['Pavement, shade and accessibility','Working · Temperature and humidity are available on request. Device-only report drafts can record an obstruction. Planned · Verified shade, footpath continuity, wheelchair access and nearby essential services need surveyed data.'],
 technology:['Street imagery and visual assistance','Planned · Consent-based street imagery and AI-assisted road analysis require evaluation and moderation. Vehicle-approach warnings are a future concept. Neither provides live alerts today.'],
 impact:['Walking after dark','Working · Women and other pedestrians can choose a trusted contact, share a fixed point and open the dialler. Planned · Time-of-day lighting and comfort observations need local verification. Routes carry no safety guarantee.'],
 experience:['Your walking routine','Working locally · Set a walking or jogging pace, compare estimated times, pin routines, save endpoints and plan recurring outings. Schedules stay in this browser.']
} as const;
export default function FieldGuide({page}:{page:keyof typeof content}){
 const [title,body]=content[page];return <section className="section field-guide"><span className="eyebrow">WALKER’S FIELD GUIDE</span><ExpandDetails title={title}><p>{body}</p></ExpandDetails></section>;
}
