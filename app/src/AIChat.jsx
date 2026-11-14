
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import {
  BrainCircuit, Send, ExternalLink,
  AlertCircle, LoaderCircle, ShieldCheck
} from "lucide-react";

export default function AIChat({ experiments }) {
  const [experimentId, setExperimentId] = useState("FLEX");
  const [question, setQuestion] = useState(
    "What did FLEX reveal about combustion after visible flame extinction?"
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askAI(e) {
    e.preventDefault();

    if (!question.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
  "/api/interpret",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experimentId, question })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-chat-section" id="ai-chat">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            EVIDENCE-GROUNDED GENERATIVE AI
          </span>
          <h2>Ask FLAMESIGHT AI</h2>
          <p>
            Ask scientific questions about NASA combustion
            experiments and receive source-linked explanations.
          </p>
        </div>
        <BrainCircuit size={28} color="#7dbdec"/>
      </div>

      <form className="ai-chat-panel" onSubmit={askAI}>
        <label htmlFor="chat-experiment">
          SELECT NASA EXPERIMENT
        </label>

        <select
          id="chat-experiment"
          value={experimentId}
          onChange={e => {
            setExperimentId(e.target.value);
            setResult(null);
          }}
        >
          {experiments.map(exp => (
            <option
              key={exp.experiment_id}
              value={exp.experiment_id}
            >
              {exp.experiment_id}
            </option>
          ))}
        </select>

        <label htmlFor="chat-question">
          YOUR RESEARCH QUESTION
        </label>

        <textarea
          id="chat-question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask about combustion behavior..."
          maxLength={500}
          rows={4}
        />

        <button
          type="submit"
          className="ai-chat-submit"
          disabled={loading || question.trim().length < 5}
        >
          {loading
            ? <LoaderCircle size={18} className="spin"/>
            : <Send size={18}/>}
          {loading ? "Analyzing NASA evidence..." : "Generate AI Insight"}
        </button>

        {error && (
          <div className="ai-chat-error">
            <AlertCircle size={18}/>
            {error}
          </div>
        )}

        {result && (
          <div className="ai-chat-result">
            <div className="ai-chat-result-header">
              <ShieldCheck size={20}/>
              <div>
                <strong>Evidence-Grounded AI Response</strong>
                <small>
                  {result.evidenceCount} curated evidence records
                </small>
              </div>
            </div>

           <div className="ai-chat-answer">
  <ReactMarkdown>{result.answer}</ReactMarkdown>
</div>

            <div className="ai-chat-sources">
              <h4>Scientific Sources</h4>

              {result.sources?.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  NASA Source {index + 1}
                  <ExternalLink size={14}/>
                </a>
              ))}
            </div>

            <div className="ai-chat-disclaimer">
              AI-generated interpretation based on curated
              NASA research records. Verify the original
              scientific sources before relying on conclusions.
              Not certified fire-safety guidance.
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
