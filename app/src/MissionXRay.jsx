import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ScanLine, ArrowUpRight } from 'lucide-react';
import { COMPONENTS, MATERIALS, DEMOS, known, rankCoverage } from './evidenceCoverage';
import './MissionXRay.css';
import CabinViewer from './CabinViewer';
import { ZONE_INFO } from './cabinModel';

export default function MissionXRay({ experiments, evidence, loading, error }) {
  const [scenario, setScenario] = useState(DEMOS[0]);
  const [phase, setPhase] = useState('idle');
  const [ai, setAI] = useState(null);
  const [aiBusy, setAIBusy] = useState(false);
  const [aiError, setAIError] = useState('');
  const generation = useRef(0);
  const timer = useRef(null);
  const request = useRef(null);
  useEffect(() => () => { clearTimeout(timer.current); request.current?.abort(); }, []);
  const ranked = useMemo(() => rankCoverage(experiments, evidence, scenario), [experiments, evidence, scenario]);
  const airflows = [...new Set(experiments.map(e => e.airflow_cm_s).filter(v => known(v) && Number.isFinite(Number(v))))];
  const oxygens = [...new Set(experiments.map(e => e.oxygen_percent).filter(v => known(v) && Number.isFinite(Number(v))))];
  const gap = !ranked.some(study => study.sufficient);
  const explanationStudy = ranked.find(study => study.records.length && study.conditions[1].status === 'Matched');
  function change(next) {
    generation.current++;
    clearTimeout(timer.current);
    request.current?.abort();
    setScenario(next); setPhase('idle'); setAI(null); setAIError(''); setAIBusy(false);
  }
  function scan() {
    setPhase('scanning'); setAI(null); setAIError('');
    timer.current = setTimeout(() => setPhase('done'), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2200);
  }
  async function explain() {
    const version = generation.current;
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    setAIBusy(true); setAIError('');
    try {
      const question = `Illustrative scenario: ${scenario.component}; ${scenario.material}; ${scenario.gravity}; airflow ${scenario.airflow || 'unspecified'} cm/s; oxygen ${scenario.oxygen || 'unspecified'}%. Explain evidence for this study, separate objectives/results/interpretation, cite IDs and URLs, and identify unsupported scenario conditions. No safety prediction.`;
      const response = await fetch('/api/interpret', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({experimentId: explanationStudy.experiment_id, question}), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI explanation unavailable.');
      if (generation.current === version) setAI(data);
    } catch (err) { if (generation.current === version) setAIError(err.name === 'AbortError' ? 'AI request timed out. Retrieved evidence remains available; try again.' : err.message); }
    finally { clearTimeout(timeout); if (generation.current === version) setAIBusy(false); }
  }
  return <section className="xray-section" id="mission-xray" aria-labelledby="xray-title">
    <div className="section-heading xray-heading"><div><span className="eyebrow"><span className="section-number">01</span> INTERACTIVE MISSION INTELLIGENCE</span><h2 id="xray-title">Mission Safety <em>X-Ray</em><span className="prototype-tag">RESEARCH PREVIEW</span></h2><p>Inspect the system. Reveal the evidence. Challenge the assumptions.</p></div><div className="xray-heading-note">NASA COMBUSTION RESEARCH<br/><strong>Evidence coverage, made visible.</strong></div></div>
    <div className="xray-demos" aria-label="Demonstration scenarios">{DEMOS.map(demo => <button key={demo.name} onClick={() => change(demo)} aria-pressed={scenario.name === demo.name}>{demo.name}</button>)}</div>
    <div className="xray-workspace">
      <CabinViewer selected={scenario.component} onSelect={component => change({...scenario, component, name: ''})} scanning={phase === 'scanning'}/>
      <div className="xray-config"><div className="config-title"><span className="instrument-label">INSPECTION WORKSPACE</span><span>02 / CONFIGURE</span></div><h3>{scenario.component}</h3><p className="component-description">{ZONE_INFO[scenario.component].description}</p>
        {[['Component','component',COMPONENTS],['Material','material',MATERIALS],['Gravity environment','gravity',['Microgravity','Lunar gravity','Martian gravity','Earth gravity']]].map(([label,key,options]) => <label key={key}>{label}<select value={scenario[key]} onChange={e => change({...scenario,[key]:e.target.value,name:''})}>{options.map(v => <option key={v}>{v}</option>)}</select></label>)}
        <label>Airflow (cm/s)<select value={scenario.airflow} onChange={e => change({...scenario,airflow:e.target.value,name:''})}><option value="">Unspecified</option>{airflows.map(v => <option key={v} value={v}>{v} · reported in dataset</option>)}</select></label>
        <label>Oxygen concentration (%)<select disabled={!oxygens.length} value={scenario.oxygen} onChange={e => change({...scenario,oxygen:e.target.value,name:''})}><option value="">{oxygens.length ? 'Unspecified' : 'Not reported in this dataset'}</option>{oxygens.map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        <button className="xray-scan" onClick={scan} disabled={loading || !!error || !experiments.length || phase === 'scanning'}><ScanLine size={18}/>{phase === 'scanning' ? 'Scanning curated evidence…' : 'Scan Evidence'}</button>
        <span role="status">{error ? 'Dataset unavailable. Scan disabled.' : loading ? 'Loading research records…' : `${experiments.length} studies · ${evidence.length} evidence records`}</span>
        <div className="config-science-note">RESEARCH NAVIGATION ONLY<small>Illustrative materials and components. A dataset gap does not establish a physical hazard.</small></div>
      </div>
    </div>
    <div role="status" aria-live="polite" className="xray-scan-status">{phase === 'idle' ? 'Ready for scan · choose a scenario above' : phase === 'scanning' ? 'Comparing reported conditions…' : gap ? 'EVIDENCE GAP DETECTED' : 'SELECTED CONDITIONS COVERED'}</div>
    {phase === 'done' && <div className="xray-results">
      <div className="xray-limits"><strong>{gap ? 'A gap in this curated dataset—not a hazard prediction.' : 'Metadata coverage—not safety certification.'}</strong><p>Component-level applicability and oxygen are not reported in the current records. Study-level material mentions do not establish that a finding applies to every material or geometry in that study. Missing fields do not mean NASA has never researched a condition. Relevance counts matched metadata fields; it is not a probability of fire. Unspecified conditions remain unknown.</p></div>
      <div className="xray-results-heading"><h3>Evidence coverage / all {ranked.length} studies</h3><span>Matched · Different · Unknown</span></div>
      <div className="coverage-overview" aria-label="Matched condition comparison">{ranked.slice(0,5).map(study=><div key={study.experiment_id}><strong>{study.experiment_id}</strong><div className="coverage-segments">{study.conditions.map(c=><span key={c.label} className={`coverage-${c.status.toLowerCase()}`} title={`${c.label}: ${c.status}`}><i/>{c.label.split(' (')[0]}</span>)}</div><b>{study.matched}/5</b></div>)}<p>Each segment represents one metadata condition. This is evidence relevance, never a fire-risk score.</p></div>
      {ranked.map(study => <details key={study.experiment_id} className="xray-study">
        <summary><span>{study.experiment_id}<small>{study.experiment_name}</small></span><b>{study.matched}/5 matched fields</b></summary>
        <p><strong>Research objective:</strong> {study.objective}</p>
        <div className="xray-conditions">{study.conditions.map(c => <div key={c.label}><strong>{c.label}</strong><span className={`condition-${c.status.toLowerCase()}`}>{c.status}{c.status === 'Unknown' ? ' / unspecified or not reported' : ''}</span><small>Scenario: {c.requested}<br/>Record: {c.reported}</small></div>)}</div>
        {study.records.length ? study.records.map(record => <div className="xray-record" key={record.evidence_id}><span className="eyebrow">{record.evidence_id} / {record.evidence_type}</span><p>{record.scientific_finding}</p><p><strong>Curated engineering interpretation:</strong> {record.engineering_implication}</p><a href={record.source_url} target="_blank" rel="noreferrer">{record.evidence_id} source <ArrowUpRight size={14}/></a></div>) : <p>No extracted results or objectives in the evidence CSV for this study.</p>}
        <a href={study.source_url} target="_blank" rel="noreferrer">Study source <ArrowUpRight size={14}/></a>
      </details>)}
      <div className="xray-limits"><strong>Next research question</strong><p>Which component-level tests report {scenario.material} in {scenario.gravity}, with measured oxygen, {scenario.airflow ? `${scenario.airflow} cm/s airflow` : 'specified airflow'}, pressure and geometry relevant to {scenario.component.toLowerCase()}?</p></div>
      <button className="xray-scan" onClick={explain} disabled={!explanationStudy || aiBusy}>{aiBusy ? 'Requesting Gemini explanation…' : `Explain ${explanationStudy?.experiment_id || 'evidence'} with Gemini`}</button>
      <p className="xray-note">AI-generated interpretation is optional. The scan above is deterministic and works without Gemini.</p>
      {aiError && <p role="alert" className="error">{aiError}</p>}
      {ai && <div className="xray-ai"><strong>AI-generated interpretation · {ai.evidenceCount} records</strong><ReactMarkdown>{ai.answer}</ReactMarkdown>{ai.sources?.map((url,i) => <p key={url}><a href={url} target="_blank" rel="noreferrer">Retrieved source {i+1}</a></p>)}<small>Check every claim against the cited evidence. Objectives are not results. This interpretation is not a validated safety conclusion.</small></div>}
    </div>}
  </section>;
}
