
import { useState } from "react";
import {
  ShieldCheck, FileText, Download,
  ExternalLink, AlertTriangle
} from "lucide-react";

const known = value =>
  value && String(value).trim() !== "" &&
  String(value).toUpperCase() !== "N/A";

export default function SafetyBrief({ experiments, evidence }) {
  const [material, setMaterial] = useState("PMMA");
  const [platform, setPlatform] = useState("ISS");
  const [report, setReport] = useState(null);

  const materialTerms = {
    PMMA: ["pmma", "acrylic"],
    Fabric: ["fabric", "textile", "cotton", "sibal"],
    Liquid: ["liquid", "droplet"]
  };

  function generate() {
    const ranked = experiments.map(study => {
      const fuel = `${study.fuel} ${study.composition}`.toLowerCase();
      const match = materialTerms[material].some(
        term => fuel.includes(term)
      );

      const records = evidence.filter(
        e => e.experiment_id === study.experiment_id
      );

      const observed = records.filter(
        e => e.evidence_type === "Observed Result"
      );

      const score =
        (match ? 40 : 0) +
        (study.platform === platform ? 20 : 0) +
        (observed.length ? 20 : records.length ? 5 : 0);

      return { ...study, score, records, match };
    })
      .filter(study => study.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    setReport({
      material,
      platform,
      date: new Date().toLocaleDateString(),
      studies: ranked
    });
  }

  function exportReport() {
    if (!report) return;

    const lines = [
      "FLAMESIGHT — RESEARCH EVIDENCE BRIEF",
      `Generated: ${report.date}`,
      `Material: ${report.material}`,
      `Research platform: ${report.platform}`,
      "",
      "TOP MATCHING STUDIES",
      ""
    ];

    report.studies.forEach((study, i) => {
      lines.push(`${i + 1}. ${study.experiment_id}`);
      lines.push(`Title: ${study.experiment_name}`);
      lines.push(`Relevance score: ${study.score}/80`);
      lines.push(`Objective: ${study.objective}`);
      lines.push(`Source: ${study.source_url}`);

      study.records.forEach(record => {
        lines.push(`Evidence type: ${record.evidence_type}`);
        lines.push(`Finding: ${record.scientific_finding}`);
        lines.push(`Interpretation: ${record.engineering_implication}`);
        lines.push(`Evidence source: ${record.source_url}`);
      });

      lines.push("");
    });

    lines.push(
      "LIMITATIONS",
      "This document is a research navigation aid.",
      "Scores are heuristic relevance measures, not fire probabilities.",
      "Research objectives are not experimental findings.",
      "Missing evidence cannot be treated as proof of safety.",
      "The brief is not certified engineering safety guidance."
    );

    const blob = new Blob(
      [lines.join("\n")],
      { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "FLAMESIGHT_Evidence_Brief.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="brief-section" id="brief">
      <div className="section-heading">
        <div>
          <span className="eyebrow">EVIDENCE TO DECISION SUPPORT</span>
          <h2>Mission Evidence Brief</h2>
          <p>
            Generate a traceable summary of relevant
            NASA combustion research.
          </p>
        </div>
        <ShieldCheck size={28} color="#7dbdec"/>
      </div>

      <div className="brief-controls">
        <label>
          Material
          <select value={material}
            onChange={e => {
              setMaterial(e.target.value);
              setReport(null);
            }}>
            <option value="PMMA">PMMA / Acrylic</option>
            <option value="Fabric">Fabric / Textile</option>
            <option value="Liquid">Liquid Fuel</option>
          </select>
        </label>

        <label>
          Research platform
          <select value={platform}
            onChange={e => {
              setPlatform(e.target.value);
              setReport(null);
            }}>
            <option value="ISS">ISS</option>
            <option value="Cygnus">Cygnus</option>
          </select>
        </label>

        <button className="generate-btn" onClick={generate}>
          <FileText size={18}/>
          Generate Evidence Brief
        </button>
      </div>

      {report && (
        <div className="brief-report">
          <div className="brief-report-header">
            <div>
              <span className="eyebrow">FLAMESIGHT REPORT</span>
              <h3>Research Evidence Brief</h3>
              <p>
                {report.material} · {report.platform} · {report.date}
              </p>
            </div>
            <button onClick={exportReport} className="export-btn">
              <Download size={16}/> Export TXT
            </button>
          </div>

          {report.studies.map((study, index) => (
            <div className="brief-study" key={study.experiment_id}>
              <div className="brief-study-title">
                <span>#{index + 1}</span>
                <h4>{study.experiment_id}</h4>
                <span>{study.score}/80</span>
              </div>

              <p>{study.objective}</p>

              {study.records.length > 0 ? (
                study.records.map(record => (
                  <div className="brief-evidence" key={record.evidence_id}>
                    <strong>{record.evidence_type}</strong>
                    <p>{record.scientific_finding}</p>
                    <small>
                      Interpretation: {record.engineering_implication}
                    </small>
                    <a href={record.source_url}
                      target="_blank" rel="noreferrer">
                      Evidence source <ExternalLink size={13}/>
                    </a>
                  </div>
                ))
              ) : (
                <p className="brief-no-evidence">
                  No extracted experimental findings are available
                  for this study in the current dataset.
                </p>
              )}

              <a href={study.source_url}
                target="_blank" rel="noreferrer">
                NASA study source <ExternalLink size={14}/>
              </a>
            </div>
          ))}

          <div className="brief-limitations">
            <AlertTriangle size={21}/>
            <div>
              <strong>Scientific limitations</strong>
              <p>
                Results are ranked using study-level metadata.
                The score measures search relevance only.
                Research objectives are not observed results.
                Conditions may differ from real missions.
                This is not a certified fire risk assessment.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
