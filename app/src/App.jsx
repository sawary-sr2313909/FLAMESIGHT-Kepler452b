import AIChat from "./AIChat";
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

const platforms = ["All platforms", "Cygnus", "ISS"];

export default function App() {
  const [experiments, setExperiments] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All platforms");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

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

        const parse = text => Papa.parse(text, {
          header: true,
          skipEmptyLines: true
        }).data;

        setExperiments(parse(aText));
        setEvidence(parse(bText));
      } catch (err) {
        setError(err.message);
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
        <div className="nav-item active">
          <Database size={18} /> Experiment Explorer
        </div>
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
            <span className="eyebrow">RESEARCH INTELLIGENCE PLATFORM</span>
            <h1>Mission Control</h1>
          </div>
          <span className="status"><span className="dot"/> DATA LOADED</span>
        </header>

        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">BEYOND EARTH. BEYOND ASSUMPTIONS.</span>
            <h2>Fire behaves differently in space.<br/>
              <em>Understanding it changes everything.</em>
            </h2>
            <p>
              Transform NASA microgravity combustion research
              into accessible, traceable scientific evidence
              for safer human space exploration.
            </p>
            <span className="hero-tag">
              <ShieldCheck size={15}/> NASA Evidence-Grounded Research
            </span>
          </div>
          <div className="hero-symbol"><Flame size={120}/></div>
        </section>

        {error && <div className="error">{error}</div>}

        <section className="stats">
          <div className="stat">
            <Database size={22}/>
            <strong>{experiments.length}</strong>
            <span>NASA Studies</span>
          </div>
          <div className="stat">
            <Microscope size={22}/>
            <strong>{evidence.length}</strong>
            <span>Evidence Records</span>
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

        <section className="explorer">
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
              />
            </div>
            <div className="select-wrap">
              <Filter size={16}/>
              <select
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

          {filtered.length === 0 && !error &&
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
