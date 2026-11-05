'use client';
import dynamic from 'next/dynamic';
import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
import type {Place,ReportDraft,WalkRoute} from '@/types/api';
import {communityEnabled,submitReport} from '@/lib/community';
import CommunityFeed from './CommunityFeed';
import ReportPhoto from './ReportPhoto';

// 1. Import the Map safely
const SafetyMap = dynamic(() => import('./SafetyMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
});

interface Props {
  point: Place | null;
  route: WalkRoute | null;
  reports: ReportDraft[];
  ready: boolean;
  save: (rows: ReportDraft[]) => boolean;
  view: (p: Place) => void;
  notify: (s: string) => void;
}

export default function ReportPanel({point, route, reports, ready, save, view, notify}: Props) {
  const [photo, setPhoto] = useState('');
  const [pending, setPending] = useState('');
  const [notice, setNotice] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const job = useRef<AbortController | null>(null);

  useEffect(() => () => job.current?.abort(), []);

  function store(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!point) { notify('Select a starting point at the road issue first.'); return; }
    if (reports.length >= 20) { notify('Clear or export your existing drafts. The local limit is 20.'); return; }
    
    const form = e.currentTarget;
    const data = new FormData(form);
    const note = String(data.get('note') || '').trim();
    const rating = Number(data.get('rating'));
    
    if (note.length < 5) { notify('Describe the issue in at least five characters.'); return; }
    
    const draft: ReportDraft = {
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      status: 'Unverified local draft',
      point,
      type: String(data.get('type')),
      note,
      ...(photo && { photo }),
      ...(route?.id && { routeId: route.id }),
      ...(route && rating && { rating })
    };
    
    if (save([draft, ...reports])) {
      form.reset();
      setPhoto('');
      notify('Unverified draft saved on this device. Nothing was submitted.');
    }
  }

  async function publish(draft: ReportDraft) {
    if (!communityEnabled || job.current) return;
    const c = new AbortController();
    job.current = c;
    setPending(draft.id);
    setNotice('');
    try {
      await submitReport(draft, c.signal);
      if (!c.signal.aborted) {
        setSent(ids => [...ids, draft.id]);
        setNotice('Submitted for moderation. It becomes public only after approval.');
      }
    } catch (e) {
      if (!c.signal.aborted) setNotice(e instanceof Error ? e.message : 'Unable to submit report.');
    } finally {
      if (!c.signal.aborted) setPending('');
      job.current = null;
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(reports, null, 2)], {type: 'application/json'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routorrx-private-report-drafts.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <h3>Notice something?</h3>
      <p>{point ? 'Report location: ' + point.name : 'Select the location of the issue as your starting point on the map.'} Save privately first, then choose whether to share.</p>
      
      <form onSubmit={store}>
        <label>Issue
          <select name="type">
            {['Obstructed path','Damaged footpath','Crossing concern','Accessibility barrier','Walk review','Other'].map(t => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>Observation
          <textarea name="note" required minLength={5} maxLength={500} placeholder="What happened here? For Other, describe the issue in your own words."/>
        </label>
        <ReportPhoto photo={photo} change={setPhoto}/>
        <label>Rate this walk
          <select name="rating" disabled={!route} defaultValue="">
            <option value="">Optional rating</option>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} / 5</option>)}
          </select>
        </label>
        <small>{route ? 'Your experience of the selected walk. A rating does not verify safety.' : 'Select a walking route to add a rating.'}</small>
        <button className="button full" disabled={!ready}>Save local draft</button>
      </form>

      {reports.map(r => (
        <article className="report" key={r.id}>
          <span className="badge">{r.status}</span>
          <h4>{r.type}</h4>
          <p>{r.note}</p>
          {r.photo && <img className="report-thumb" src={r.photo} alt="Road issue in private draft"/>}
          <small>{r.point.name} · {new Date(r.created).toLocaleString()}{r.rating ? ' · ' + r.rating + '/5' : ''}</small>
          <button onClick={() => view(r.point)}>View on map ↗</button>
          
          {communityEnabled && (
            <>
              <p>Other walkers may see this location, note, photo and rating after moderation.</p>
              <button disabled={!!pending || sent.includes(r.id) || !!(r.rating && !r.routeId)} onClick={() => void publish(r)}>
                {sent.includes(r.id) ? 'Awaiting moderation' : pending === r.id ? 'Sending…' : 'Submit for public review'}
              </button>
              {r.rating && !r.routeId && <small>This route needs a shared route ID before its rating can be published.</small>}
            </>
          )}
        </article>
      ))}

      {reports.length > 0 && <button className="text-button" onClick={download}>Export private drafts ↓</button>}
      <p role="status">{notice}</p>

      {/* MAP GOES HERE */}
      <div className="mt-8 mb-8">
        <h3 className="mb-4">Live Hazard Map</h3>
        <SafetyMap />
      </div>

      <CommunityFeed/>
    </>
  );
}