
import { useMemo, useState } from "react";
import { BrainCircuit, ExternalLink } from "lucide-react";

const isKnown = v =>
  v && v.trim() !== "" && v.toUpperCase() !== "N/A";

function calculateScore(item, material, platform, airflow, records) {
  let score = 0;
  const reasons = [];
  const missing = [];

  const fuelText =
    `${item.fuel || ""} ${item.composition || ""}`.toLowerCase();

  const materialTerms = {
    PMMA: ["pmma", "acrylic"],
    Fabric: ["fabric", "textile", "cotton", "sibal"],
    Liquid: ["liquid", "droplet"]
  };

  const materialMatch = materialTerms[material].some(
    term => fuelText.includes(term)
  );

  if (materialMatch) {
    score += 40;
    reasons.push("Matching material (+40)");
  } else if (!isKnown(item.fuel) ||
             item.fuel.toLowerCase() === "multiple materials") {
    missing.push("Material not sufficiently specified");
  }

  if (item.platform === platform) {
    score += 20;
    reasons.push("Matching experiment platform (+20)");
  }

  if (airflow !== "Any") {
    if (isKnown(item.airflow_cm_s) &&
        !Number.isNaN(Number(item.airflow_cm_s))) {
      const difference =
        Math.abs(Number(item.airflow_cm_s) - Number(airflow));

      if (difference <= 5) {
        score += 20;
        reasons.push("Airflow within 5 cm/s (+20)");
      } else if (difference <= 15) {
        score += 10;
        reasons.push("Airflow within 15 cm/s (+10)");
      } else {
        reasons.push("Airflow differs by over 15 cm/s");
      }
    } else {
      missing.push("Airflow value unavailable");
    }
  }

  const observed = records.filter(
    e => e.evidence_type === "Observed Result"
  );

  const objectives = records.filter(
    e => e.evidence_type === "Research Objective"
  );

  if (observed.length > 0) {
    score += 20;
    reasons.push("Extracted observed evidence (+20)");
  } else if (objectives.length > 0) {
    score += 5;
    reasons.push("Research objective documented (+5)");
  } else {
    missing.push("No extracted evidence yet");
  }

  return { score, reasons, missing, records };
}

export default function Ranking({ experiments, evidence }) {
  const [material, setMaterial] = useState("PMMA");
  const [platform, setPlatform] = useState("ISS");
  const [airflow, setAirflow] = useState("Any");

  const ranked = useMemo(() => {
    return experiments.map(item => {
      const records = evidence.filter(
        e => e.experiment_id === item.experiment_id
      );
      return {
        ...item,
        ...calculateScore(
          item, material, platform, airflow, records
        )
      };
    }).sort((a, b) =>
      b.score - a.score ||
      a.experiment_id.localeCompare(b.experiment_id)
    );
  }, [experiments, evidence, material, platform, airflow]);

  return (
    <section className="ranking-section" id="ranking">
      <div className="section-heading">
        <div>
          <span className="eyebrow">TRANSPARENT RESEARCH MATCHING</span>
          <h2>Evidence Ranking Engine</h2>
          <p>
            Find research that best matches selected experimental
            conditions.
          </p>
        </div>
        <BrainCircuit size={28} color="#7dbdec"/>
      </div>

      <div className="ranking-controls">
        <label>
          Material
          <select value={material}
            onChange={e => setMaterial(e.target.value)}>
            <option value="PMMA">PMMA / Acrylic</option>
            <option value="Fabric">Fabric / Textile</option>
            <option value="Liquid">Liquid Fuel</option>
          </select>
        </label>

        <label>
          Research platform
          <select value={platform}
            onChange={e => setPlatform(e.target.value)}>
            <option value="ISS">ISS</option>
            <option value="Cygnus">Cygnus</option>
          </select>
        </label>

        <label>
          Airflow
          <select value={airflow}
            onChange={e => setAirflow(e.target.value)}>
            <option value="Any">Any / Unspecified</option>
            <option value="0">0 cm/s</option>
            <option value="10">10 cm/s</option>
            <option value="20">20 cm/s</option>
            <option value="30">30 cm/s</option>
          </select>
        </label>
      </div>

      <div className="ranking-notice">
        <strong>How ranking works</strong>
        <p>
          Material match: 40 points · Platform match: 20 ·
          Airflow similarity: up to 20 · Extracted evidence:
          up to 20. This is a prototype search heuristic,
          not an AI prediction or a validated scientific risk model.
          An unspecified airflow receives no airflow points.
        </p>
      </div>

      <div className="ranking-results">
        {ranked.map((item, index) => (
          <div className="ranking-card"
            key={item.experiment_id}>

            <div className="ranking-card-header">
              <div>
                <span className="ranking-position">
                  #{index + 1} RESEARCH MATCH
                </span>
                <h3>{item.experiment_id}</h3>
                <p>{item.experiment_name}</p>
              </div>

              <div className="ranking-score">
                <strong>{item.score}/100</strong>
                <span>Relevance heuristic</span>
              </div>
            </div>

            <div className="ranking-track">
              <div style={{ width: `${item.score}%` }}/>
            </div>

            <div className="ranking-reasons">
              {item.reasons.map((reason, i) =>
                <span key={i}>✓ {reason}</span>
              )}
              {item.missing.map((reason, i) =>
                <span className="ranking-missing" key={i}>
                  — {reason}
                </span>
              )}
            </div>

            <p className="ranking-objective">{item.objective}</p>

            <div className="ranking-sources">
              <span>{item.records.length} evidence records</span>
              <a href={item.source_url}
                target="_blank"
                rel="noreferrer">
                NASA source <ExternalLink size={14}/>
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="ranking-disclaimer">
        Ranking is based on available study metadata.
        Missing data does not mean a study is irrelevant.
        Study-level evidence is not a substitute for
        experiment-level validation or mission safety certification.
      </p>
    </section>
  );
}
