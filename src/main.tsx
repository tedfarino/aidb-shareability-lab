import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Clipboard,
  Mail,
  MessageSquare,
  Radio,
  Send,
  Sparkles,
} from "lucide-react";
import { episodes, PackageType, scoreLabels } from "./data";
import "./styles.css";

const packageIcons: Record<PackageType, typeof MessageSquare> = {
  Slack: MessageSquare,
  Email: Mail,
  LinkedIn: Send,
  "Exec memo": BriefcaseBusiness,
};

function App() {
  const [selectedTitle, setSelectedTitle] = useState(episodes[0].title);
  const [copyState, setCopyState] = useState<{
    moment: string;
    status: "copied" | "failed";
  } | null>(null);
  const selected = episodes.find((episode) => episode.title === selectedTitle) ?? episodes[0];
  const moments = selected.moments;
  const topMoment = useMemo(
    () =>
      moments
        .map((moment) => ({
          ...moment,
          total:
            moment.scores.clarity +
            moment.scores.urgency +
            moment.scores.audienceFit +
            moment.scores.usefulness -
            moment.scores.trustRisk,
        }))
        .sort((a, b) => b.total - a.total)[0],
    [moments],
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <Radio size={16} aria-hidden="true" />
            AIDB Company Champion Kit
          </p>
          <h1>Turn AIDB episodes into workplace-ready briefing objects.</h1>
          <p>
            A growth-engineering prototype for the listener already bringing AI judgment into
            their company, team, or executive channel.
          </p>
        </div>
        <div className="hero-panel" aria-label="Top share candidate">
          <div className="panel-header">
            <Sparkles size={18} aria-hidden="true" />
            Best champion moment
          </div>
          <h2>{topMoment.title}</h2>
          <p>{topMoment.why}</p>
          <span className="score-pill">Champion score {topMoment.total}/19</span>
        </div>
      </section>

      <section className="workspace" aria-label="Episode analysis workspace">
        <aside className="episode-list">
          <h2>May 2026 Episodes</h2>
          {episodes.map((episode) => (
            <button
              className={episode.title === selected.title ? "episode-button active" : "episode-button"}
              key={episode.title}
              onClick={() => setSelectedTitle(episode.title)}
              type="button"
            >
              <span>{episode.title}</span>
              <small>{episode.date}</small>
            </button>
          ))}
        </aside>

        <section className="analysis">
          <div className="method-strip" aria-label="Prototype method">
            <span>Input: episode</span>
            <span>Find: company champion moment</span>
            <span>Package: workplace-ready copy</span>
            <span>Measure: tracked source link</span>
          </div>

          <div className="episode-heading">
            <div>
              <p className="eyebrow compact">Selected episode</p>
              <h2>{selected.title}</h2>
              <p>{selected.theme}</p>
            </div>
            <a href={selected.link} target="_blank" rel="noreferrer">
              Source <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>

          <div className="reason-box">
            <strong>Why this episode</strong>
            <p>{selected.whyPick}</p>
          </div>

          <div className="moment-grid">
            {moments.map((moment) => {
              const Icon = packageIcons[moment.packageType];
              return (
                <article className="moment-card" key={moment.title}>
                  <div className="moment-card-header">
                    <div>
                      <p className="eyebrow compact">{moment.packageType}</p>
                      <h3>{moment.title}</h3>
                    </div>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <p>{moment.what}</p>
                  <dl>
                    <div>
                      <dt>Sharer</dt>
                      <dd>{moment.sharer}</dd>
                    </div>
                    <div>
                      <dt>Recipient</dt>
                      <dd>{moment.recipient}</dd>
                    </div>
                    <div>
                      <dt>Why it travels</dt>
                      <dd>{moment.why}</dd>
                    </div>
                  </dl>
                  <div className="package-copy">
                    <div className="package-header">
                      <div className="panel-header">
                        <Clipboard size={16} aria-hidden="true" />
                        Forwardable package
                      </div>
                      <button
                        className="icon-button"
                        type="button"
                        title="Copy package"
                        aria-label={`Copy package for ${moment.title}`}
                        onClick={async () => {
                          try {
                            if (!navigator.clipboard?.writeText) {
                              throw new Error("Clipboard API unavailable");
                            }
                            await navigator.clipboard.writeText(moment.packageCopy);
                            setCopyState({ moment: moment.title, status: "copied" });
                          } catch {
                            setCopyState({ moment: moment.title, status: "failed" });
                          }
                        }}
                      >
                        <Clipboard size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <p>{moment.packageCopy}</p>
                    {copyState?.moment === moment.title ? (
                      <small>
                        {copyState.status === "copied"
                          ? "Copied"
                          : "Copy unavailable in this browser"}
                      </small>
                    ) : null}
                  </div>
                  <a
                    className="tracked-link"
                    href={buildTrackedLink(selected.link, moment.title)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open tracked source <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                  <ScoreBars scores={moment.scores} />
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function ScoreBars({
  scores,
}: {
  scores: Record<(typeof scoreLabels)[number], number>;
}) {
  return (
    <div className="scores" aria-label="Share scoring rubric">
      <div className="panel-header">
        <BarChart3 size={16} aria-hidden="true" />
        Rubric
      </div>
      {scoreLabels.map((label) => (
        <div className="score-row" key={label}>
          <span>{formatLabel(label)}</span>
          <meter min="0" max="5" value={scores[label]} />
          <strong>{scores[label]}</strong>
        </div>
      ))}
    </div>
  );
}

function formatLabel(label: string) {
  return label.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function buildTrackedLink(sourceLink: string, momentTitle: string) {
  const url = new URL(sourceLink);
  url.searchParams.set("utm_source", "aidb_shareability_lab");
  url.searchParams.set("utm_medium", "share_package");
  url.searchParams.set("utm_campaign", "may_2026_episode_moments");
  url.searchParams.set("utm_content", slugify(momentTitle));
  return url.toString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
