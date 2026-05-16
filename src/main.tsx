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
import { audienceChannels, AudienceChannel, episodes, PackageType, scoreLabels } from "./data";
import "./styles.css";

const packageIcons: Record<PackageType, typeof MessageSquare> = {
  Slack: MessageSquare,
  Email: Mail,
  LinkedIn: Send,
  "Listener brief": BriefcaseBusiness,
};

function App() {
  const [selectedTitle, setSelectedTitle] = useState(episodes[0].title);
  const [selectedAudienceChannel, setSelectedAudienceChannel] = useState<"All" | AudienceChannel>("All");
  const [copyState, setCopyState] = useState<{
    moment: string;
    status: "copied" | "failed";
  } | null>(null);
  const selected = episodes.find((episode) => episode.title === selectedTitle) ?? episodes[0];
  const moments = selected.moments.filter(
    (moment) =>
      selectedAudienceChannel === "All" || moment.audienceChannel === selectedAudienceChannel,
  );
  const rankedMoments = moments.length > 0 ? moments : selected.moments;
  const topMoment = useMemo(
    () =>
      rankedMoments
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
    [rankedMoments],
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <Radio size={16} aria-hidden="true" />
            AIDB Audience Growth Lab
          </p>
          <h1>Turn AIDB episodes into audience-ready share moments.</h1>
          <p>
            A growth-engineering prototype for finding which episode ideas travel beyond the
            current listener and help the show earn its next audience.
          </p>
        </div>
        <div className="hero-panel" aria-label="Top share candidate">
          <div className="panel-header">
            <Sparkles size={18} aria-hidden="true" />
            Best growth moment
          </div>
          <h2>{topMoment.title}</h2>
          <p>{topMoment.why}</p>
          <span className="score-pill">Growth score {topMoment.total}/19</span>
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
            <span>Find: audience growth moment</span>
            <span>Package: share-ready copy</span>
            <span>Measure: tracked source link</span>
          </div>

          <div className="perspective-filter" aria-label="Audience/channel filter">
            {audienceChannels.map((audienceChannel) => (
              <button
                className={audienceChannel === selectedAudienceChannel ? "active" : ""}
                key={audienceChannel}
                onClick={() => setSelectedAudienceChannel(audienceChannel)}
                type="button"
              >
                {audienceChannel}
              </button>
            ))}
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
                      <p className="eyebrow compact">
                        {moment.audienceChannel} / {moment.packageType}
                      </p>
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
                      <dt>Audience/channel</dt>
                      <dd>{moment.recipient}</dd>
                    </div>
                    <div>
                      <dt>Why it travels</dt>
                      <dd>{moment.why}</dd>
                    </div>
                    <div>
                      <dt>After the click</dt>
                      <dd>{moment.afterClick}</dd>
                    </div>
                  </dl>
                  <div className="package-copy">
                    <div className="package-header">
                      <div className="panel-header">
                        <Clipboard size={16} aria-hidden="true" />
                        Share package
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
                  <div className="experiment-card" aria-label={`Experiment plan for ${moment.title}`}>
                    <div className="panel-header">
                      <BarChart3 size={16} aria-hidden="true" />
                      Experiment
                    </div>
                    <dl>
                      <div>
                        <dt>Hypothesis</dt>
                        <dd>{moment.experiment.hypothesis}</dd>
                      </div>
                      <div>
                        <dt>Distribution channel</dt>
                        <dd>{moment.experiment.distributionChannel}</dd>
                      </div>
                      <div>
                        <dt>Success metric</dt>
                        <dd>{moment.experiment.successMetric}</dd>
                      </div>
                      <div>
                        <dt>Next test</dt>
                        <dd>{moment.experiment.nextTest}</dd>
                      </div>
                    </dl>
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
