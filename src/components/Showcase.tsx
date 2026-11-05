import Navigator from './Navigator';
import Link from 'next/link';
export default function Showcase(){return <section className="interactive-showcase" aria-label="Explore the Silvassa walking planner"><div className="showcase-heading"><div><span className="eyebrow">20.276° N / 73.008° E</span><h2>Explore Silvassa.</h2><p>Choose two points. Find your walk. The same planner powers our app.</p></div><Link className="button" href="/app">Try Out</Link></div><Navigator embedded/></section>}
