import AIChat from "./AIChat";
import MissionXRay from "./MissionXRay";
import Ranking from "./Ranking";
import SafetyBrief from "./SafetyBrief";
import Compare from "./Compare";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Flame, Search, Database, Microscope,
  ArrowUpRight, ShieldCheck, Filter,
  ExternalLink, Orbit, ChevronDown,BrainCircuit
} from "lucide-react";
import "./App.css";
import "./Product.css";

const platforms = ["All platforms", "Cygnus", "ISS"];

export default function App() {
  const [experiments, setExperiments] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All platforms");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [a, b] = await Promise.all([
          fetch("/data/experiments.csv"),
          fetch("/data/evidence.csv")
        ]);

        if (!a.ok || !b.ok) {
          throw new Error("Could not load NASA CSV files.");
        }

        const [aText, bText] = await Promise.all([
          a.text(), b.text()
        ]);

        const parse = text => {
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          if (parsed.errors.length) throw new Error('Invalid NASA CSV data.');
          return parsed.data;
        };

        setExperiments(parse(aText));
        setEvidence(parse(bText));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return experiments.filter(item => {
      const terms = Object.values(item).join(" ").toLowerCase();
      return terms.includes(search.toLowerCase()) &&
        (platform === "All platforms" ||
          item.platform === platform);
    });
  }, [experiments, search, platform]);

  const selectedEvidence = evidence.filter(
    item => item.experiment_id === selected?.experiment_id
  );

  const countByPlatform = name =>
    experiments.filter(item => item.platform === name).length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Flame size={27} />
          <span>FLAMESIGHT</span>
        </div>

        <div className="nav-label">MISSION INTELLIGENCE</div>
        <a className="nav-item active" href="#mission-xray"><ShieldCheck size={18}/> Mission Safety X-Ray</a>
        <a className="nav-item" href="#explorer">
          <Database size={18} /> Experiment Explorer
        </a>
        <a className="nav-item active compare-nav" href="#compare">
  <Microscope size={18} /> Compare Experiments
</a>
<a className="nav-item active compare-nav" href="#ranking">
  <BrainCircuit size={18} /> Evidence Ranking
</a>
        <a className="nav-item active compare-nav" href="#brief">
  <ShieldCheck size={18} /> Mission Safety Brief
</a>
<a className="nav-item active compare-nav" href="#ai-chat">
  <BrainCircuit size={18}/> Ask FLAMESIGHT AI
</a>
        <div className="sidebar-bottom">
          <Orbit size={18} />
          <span>Kepler_452b<br/>NASA Space Apps 2026</span>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">FLAMESIGHT / COMBUSTION EVIDENCE LAB</span>
            <h1>Research Operations <span>/ Mission workspace</span></h1>
          </div>
          <span className="status" role="status"><span className="dot"/> {error ? 'DATA UNAVAILABLE' : loading ? 'LOADING DATA' : 'CURATED DATA READY'}</span>
        </header>

        {error && <div className="error">{error}</div>}

        <MissionXRay experiments={experiments} evidence={evidence} loading={loading} error={error}/>
        <section className="stats">
          <div className="stat">
            <Database size={22}/>
            <strong>{experiments.length}</strong>
            <span>Curated NASA studies</span>
          </div>
          <div className="stat">
            <Microscope size={22}/>
            <strong>{evidence.length}</strong>
            <span>Traceable evidence records</span>
          </div>
          <div className="stat">
            <Orbit size={22}/>
            <strong>{countByPlatform("Cygnus")}</strong>
            <span>Cygnus Studies</span>
          </div>
          <div className="stat">
            <ShieldCheck size={22}/>
            <strong>{countByPlatform("ISS")}</strong>
            <span>ISS Studies</span>
          </div>
        </section>

        <section className="explorer" id="explorer">
          <div className="section-heading">
            <div>
              <span className="eyebrow">NASA COMBUSTION DATABASE</span>
              <h2>Experiment Explorer</h2>
              <p>Explore research investigations and their source material.</p>
            </div>
            <span className="count">{filtered.length} RESULTS</span>
          </div>

          <div className="toolbar">
            <div className="search">
              <Search size={18}/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search experiment, material, objective..."
                aria-label="Search experiments"
              />
            </div>
            <div className="select-wrap">
              <Filter size={16}/>
              <select
                aria-label="Filter by platform"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
              >
                {platforms.map(p =>
                  <option key={p} value={p}>{p}</option>
                )}
              </select>
              <ChevronDown size={15}/>
            </div>
          </div>

          <div className="cards">
            {filtered.map(item => {
              const n = evidence.filter(
                ev => ev.experiment_id === item.experiment_id
              ).length;
              return (
                <button
                  className="experiment-card"
                  key={item.experiment_id}
                  onClick={() => setSelected(item)}
                >
                  <div className="card-top">
                    <span className="experiment-id">{item.experiment_id}</span>
                    <ArrowUpRight size={18}/>
                  </div>
                  <h3>{item.experiment_name}</h3>
                  <p>{item.objective}</p>
                  <div className="chips">
                    <span>{item.platform}</span>
                    <span>{item.gravity}</span>
                  </div>
                  <div className="card-footer">
                    <span>{n} evidence records</span>
                    <span>View details →</span>
                  </div>
                </button>
              );
            })}
          </div>

          {loading && <p className="empty" role="status">Loading NASA research records…</p>}
          {filtered.length === 0 && !error && !loading &&
            <p className="empty">No matching experiments found.</p>}
        </section>
        <Compare
          experiments={experiments}
          evidence={evidence}
        />
        <Ranking
  experiments={experiments}
  evidence={evidence}
/>
<SafetyBrief
  experiments={experiments}
  evidence={evidence}
/>
<AIChat experiments={experiments} />
        <footer>
          FLAMESIGHT · Kepler_452b · NASA Space Apps Challenge 2026
          <span>Research prototype · Not a certified fire-risk assessment</span>
        </footer>
        <details className="disclosure"><summary>Scientific limitations & AI-use disclosure</summary><p>NASA sources are linked research references; curated records are selected extractions and have not been independently verified by this application. Research objectives describe intended work, not demonstrated results. All cabin geometry and mission scenarios are illustrative. Relevance scores are research navigation heuristics, not fire probabilities or certified safety advice.</p><p>AI assistance: Codex assisted with code, interface design, 3D cabin and SVG fallback authoring, matching logic and tests. Gemini generates optional interpretations from curated records. Existing NASA CSV values and schemas are preserved; no measurements were generated or imputed. The conceptual habitat uses original code-authored geometry, without NASA logos or mission imagery. The editable Spline scene is rendered through an approved published React code export; the website itself has not been deployed by this work. Component names map only to illustrative interface zones, not NASA study test hardware. Review challenge submission requirements and maintain this disclosure with the project.</p></details>
      </main>

      {selected && (
        <div className="modal-overlay"
          onClick={() => setSelected(null)}>
          <div className="modal"
            onClick={e => e.stopPropagation()}>
            <button className="close"
              onClick={() => setSelected(null)}>✕</button>
            <span className="eyebrow">NASA INVESTIGATION</span>
            <h2>{selected.experiment_id}</h2>
            <h3>{selected.experiment_name}</h3>
            <p>{selected.objective}</p>
            <div className="details">
              <div><span>Platform</span><b>{selected.platform}</b></div>
              <div><span>Gravity</span><b>{selected.gravity}</b></div>
              <div><span>Fuel</span><b>{selected.fuel}</b></div>
              <div><span>Composition</span><b>{selected.composition}</b></div>
              <div><span>Airflow</span><b>{selected.airflow_cm_s} cm/s</b></div>
            </div>
            <h3>Scientific Evidence</h3>
            {selectedEvidence.length
              ? selectedEvidence.map(ev => (
                <div className="evidence" key={ev.evidence_id}>
                  <span className="evidence-type">{ev.evidence_type}</span>
                  <p>{ev.scientific_finding}</p>
                  <small>{ev.engineering_implication}</small>
                  <a href={ev.source_url} target="_blank"
                    rel="noreferrer">
                    View source <ExternalLink size={13}/>
                  </a>
                </div>
              ))
              : <p className="empty">No extracted evidence recorded yet.</p>
            }
            <a className="source-link"
              href={selected.source_url}
              target="_blank" rel="noreferrer">
              Open NASA study <ExternalLink size={16}/>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
