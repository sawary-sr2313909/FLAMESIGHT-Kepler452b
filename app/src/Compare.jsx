
import { useState } from "react";
import {
  GitCompareArrows,
  ExternalLink,
  ArrowLeftRight
} from "lucide-react";

const fields = [
  ["Platform", "platform"],
  ["Gravity", "gravity"],
  ["Fuel", "fuel"],
  ["Composition", "composition"],
  ["Sample length (cm)", "sample_length_cm"],
  ["Sample width (cm)", "sample_width_cm"],
  ["Airflow (cm/s)", "airflow_cm_s"],
  ["Research objective", "objective"]
];

function show(value) {
  return value && value.trim() !== ""
    ? value
    : "N/A";
}

export default function Compare({ experiments, evidence }) {
  const [firstId, setFirstId] = useState("SAFFIRE-I");
  const [secondId, setSecondId] = useState("SAFFIRE-III");

  const first = experiments.find(
    item => item.experiment_id === firstId
  );

  const second = experiments.find(
    item => item.experiment_id === secondId
  );

  const firstEvidence = evidence.filter(
    e => e.experiment_id === firstId
  );

  const secondEvidence = evidence.filter(
    e => e.experiment_id === secondId
  );

  if (experiments.length === 0) {
    return <p className="empty">Loading experiments...</p>;
  }

  return (
    <section className="compare-section" id="compare">
      <div className="section-heading">
        <div>
          <span className="eyebrow">RESEARCH COMPARISON</span>
          <h2>Compare Experiments</h2>
          <p>
            Explore experimental conditions side by side.
            Differences do not automatically imply causation.
          </p>
        </div>
        <GitCompareArrows size={28} color="#7dbdec" />
      </div>

      <div className="compare-selectors">
        <div>
          <label>EXPERIMENT A</label>
          <select
            value={firstId}
            onChange={e => setFirstId(e.target.value)}
          >
            {experiments.map(item => (
              <option
                key={item.experiment_id}
                value={item.experiment_id}
              >
                {item.experiment_id}
              </option>
            ))}
          </select>
        </div>

        <button
          className="swap-button"
          onClick={() => {
            setFirstId(secondId);
            setSecondId(firstId);
          }}
          title="Swap experiments"
        >
          <ArrowLeftRight size={20}/>
        </button>

        <div>
          <label>EXPERIMENT B</label>
          <select
            value={secondId}
            onChange={e => setSecondId(e.target.value)}
          >
            {experiments.map(item => (
              <option
                key={item.experiment_id}
                value={item.experiment_id}
              >
                {item.experiment_id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {firstId === secondId && (
        <p className="compare-warning">
          Select two different experiments for comparison.
        </p>
      )}

      {first && second && (
        <>
          <div className="compare-table">
            <div className="compare-row compare-header">
              <span>PARAMETER</span>
              <strong>{first.experiment_id}</strong>
              <strong>{second.experiment_id}</strong>
            </div>

            {fields.map(([label, key]) => {
              const a = show(first[key]);
              const b = show(second[key]);
              const different =
                a !== b && a !== "N/A" && b !== "N/A";

              return (
                <div
                  className={
                    "compare-row" +
                    (different ? " compare-different" : "")
                  }
                  key={key}
                >
                  <span>{label}</span>
                  <div>{a}</div>
                  <div>{b}</div>
                </div>
              );
            })}
          </div>

          <div className="comparison-evidence">
            {[
              [first, firstEvidence],
              [second, secondEvidence]
            ].map(([item, records], i) => (
              <div className="comparison-evidence-card" key={i}>
                <h3>{item.experiment_id} Evidence</h3>

                {records.length === 0 ? (
                  <p>
                    No extracted evidence is available
                    for this study yet.
                  </p>
                ) : (
                  records.map(record => (
                    <div key={record.evidence_id}>
                      <small>{record.evidence_type}</small>
                      <p>{record.scientific_finding}</p>
                      <a
                        href={record.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View evidence source
                        <ExternalLink size={13}/>
                      </a>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>

          <div className="compare-note">
            <strong>Scientific interpretation notice</strong>
            <p>
              This comparison displays reported study
              metadata and selected evidence. N/A means
              unavailable in the current dataset.
              Differences between investigations do not
              establish fire risk or causal relationships.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
