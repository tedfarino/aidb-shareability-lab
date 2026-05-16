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
    key: string;
    status: "copied" | "failed";
  } | null>(null);
  const selected = episodes.find((episode) => episode.title === selectedTitle) ?? episodes[0];
  const moments = selected.moments.filter(
    (moment) =>
      selectedAudienceChannel === "All" || moment.audienceChannel === selectedAudienceChannel,
  );
  const rankedMoments = moments.length > 0 ? moments : selected.moments;
  const outboundTests = rankedMoments.slice(0, 3).map((moment) => {
    const platform =
      moment.clipCandidate.bestChannel === "Email/newsletter"
        ? "Email"
        : moment.clipCandidate.bestChannel;
    const assetType =
      platform === "Email"
        ? "Newsletter blurb"
        : platform === "X"
          ? "X post"
          : "LinkedIn post";

    return {
      platform,
      audienceChannel: moment.audienceChannel,
      assetType,
      trackingLinkType: "UTM source link",
      metric: moment.clipCandidate.firstTestMetric,
    };
  });
  const audienceCounts = rankedMoments.reduce(
    (counts, moment) => ({
      ...counts,
      [moment.audienceChannel]: (counts[moment.audienceChannel] ?? 0) + 1,
    }),
    {} as Record<AudienceChannel, number>,
  );
  const topAudienceChannel =
    Object.entries(audienceCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "None";
  const systemSummary = [
    ["Share moments", rankedMoments.length],
    ["Channel share assets", rankedMoments.length * 3],
    ["Clip candidates", rankedMoments.length],
    ["Outbound tests", outboundTests.length],
    ["Top audience/channel", topAudienceChannel],
  ];
  const automationRoadmap = [
    ["Episode ingest", "planned"],
    ["Transcript analysis", "planned"],
    ["Asset generation", "prototyped"],
    ["Human review", "prototyped"],
    ["Outbound queue", "prototyped"],
    ["Posting", "manual only"],
    ["Metrics ingest", "planned"],
    ["Learning loop", "planned"],
  ];
  const targetChannels = Array.from(new Set(outboundTests.map((test) => test.platform))).join(", ");
  const intakeContract = [
    ["Episode URL", selected.link],
    ["Episode title", selected.title],
    ["Transcript source", "Transcript source pending"],
    ["Publish date", selected.date],
    ["Target channels", targetChannels || "Pending channel selection"],
    ["Run status", "Contract draft"],
    ["Next automation step", "Attach transcript source"],
  ];
  const dataSources = [
    ["AIDB RSS or episode page", "used"],
    ["YouTube/transcript source", "planned"],
    ["X API for taste calibration", "prototyped"],
    ["UTM analytics", "planned"],
    ["Manual LinkedIn/X/email posting", "manual"],
    ["Optional clipping tool/human review", "prototyped"],
  ];
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

          <section className="system-summary" aria-label="Growth system summary">
            <div className="panel-header">
              <BarChart3 size={16} aria-hidden="true" />
              Growth system summary
            </div>
            <div className="summary-grid">
              {systemSummary.map(([label, value]) => (
                <div className="summary-item" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="automation-roadmap" aria-label="Automation roadmap">
            <div className="panel-header">
              <Sparkles size={16} aria-hidden="true" />
              Automation roadmap
            </div>
            <p className="review-note">
              Operator console prototype for automated growth workflows. No backend or auto-posting.
            </p>
            <div className="roadmap-grid">
              {automationRoadmap.map(([stage, status]) => (
                <div className="roadmap-step" key={stage}>
                  <span>{stage}</span>
                  <strong>{status}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="intake-contract" aria-label="Episode intake contract">
            <div className="panel-header">
              <Clipboard size={16} aria-hidden="true" />
              Episode Intake Contract
            </div>
            <p className="review-note">
              Read-only contract for a future background job. Not a live ingestion form.
            </p>
            <div className="intake-grid">
              {intakeContract.map(([label, value]) => (
                <div className="intake-field" key={label}>
                  <span>{label}</span>
                  {label === "Episode URL" ? (
                    <a href={value} rel="noreferrer" target="_blank">
                      {value}
                    </a>
                  ) : (
                    <strong>{value}</strong>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="data-sources" aria-label="Data sources and integrations">
            <div className="panel-header">
              <BriefcaseBusiness size={16} aria-hidden="true" />
              Data Sources + Integrations
            </div>
            <p className="review-note">
              Intended sources and tools for future automation. No integrations are connected here.
            </p>
            <div className="source-grid">
              {dataSources.map(([source, status]) => (
                <div className="source-item" key={source}>
                  <span>{source}</span>
                  <strong>{status}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="outbound-queue" aria-label="Outbound test queue">
            <div className="panel-header">
              <Send size={16} aria-hidden="true" />
              Outbound test queue
            </div>
            <p className="review-note">
              Manual distribution plan only. Nothing posts automatically.
            </p>
            <div className="outbound-grid">
              {outboundTests.map((test) => (
                <article className="outbound-test" key={`${test.platform}-${test.audienceChannel}`}>
                  <strong>
                    {test.platform} / {test.assetType}
                  </strong>
                  <dl>
                    <div>
                      <dt>Audience/channel</dt>
                      <dd>{test.audienceChannel}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>Needs human review</dd>
                    </div>
                    <div>
                      <dt>Tracking link type</dt>
                      <dd>{test.trackingLinkType}</dd>
                    </div>
                    <div>
                      <dt>Metric to check</dt>
                      <dd>{test.metric}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

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
            {rankedMoments.map((moment) => {
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
                        Channel share assets
                      </div>
                    </div>
                    <div className="asset-list">
                      {[
                        ["LinkedIn", moment.shareAssets.linkedIn],
                        ["X", moment.shareAssets.x],
                        ["Email/newsletter", moment.shareAssets.email],
                      ].map(([label, copy]) => {
                        const copyKey = `${moment.title}:${label}`;
                        return (
                          <div className="share-asset" key={label}>
                            <div className="asset-header">
                              <strong>{label}</strong>
                              <button
                                className="icon-button"
                                type="button"
                                title={`Copy ${label} asset`}
                                aria-label={`Copy ${label} asset for ${moment.title}`}
                                onClick={async () => {
                                  try {
                                    if (!navigator.clipboard?.writeText) {
                                      throw new Error("Clipboard API unavailable");
                                    }
                                    await navigator.clipboard.writeText(copy);
                                    setCopyState({ key: copyKey, status: "copied" });
                                  } catch {
                                    setCopyState({ key: copyKey, status: "failed" });
                                  }
                                }}
                              >
                                <Clipboard size={16} aria-hidden="true" />
                              </button>
                            </div>
                            <p>{copy}</p>
                            {copyState?.key === copyKey ? (
                              <small>
                                {copyState.status === "copied"
                                  ? "Copied"
                                  : "Copy unavailable in this browser"}
                              </small>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="clip-card" aria-label={`Selection and clip candidate for ${moment.title}`}>
                    <div className="panel-header">
                      <Sparkles size={16} aria-hidden="true" />
                      Selection + clip candidate
                    </div>
                    <p className="review-note">Human-reviewed candidate, not an auto-clipped asset.</p>
                    <dl>
                      <div>
                        <dt>Why this moment matters</dt>
                        <dd>{moment.clipCandidate.whyThisMoment}</dd>
                      </div>
                      <div>
                        <dt>Best channel</dt>
                        <dd>{moment.clipCandidate.bestChannel}</dd>
                      </div>
                      <div>
                        <dt>Suggested clip hook</dt>
                        <dd>{moment.clipCandidate.hook}</dd>
                      </div>
                      <div>
                        <dt>Suggested clip title</dt>
                        <dd>{moment.clipCandidate.title}</dd>
                      </div>
                      <div>
                        <dt>Timestamp placeholder</dt>
                        <dd>{moment.clipCandidate.timestamp}</dd>
                      </div>
                      <div>
                        <dt>Risk note</dt>
                        <dd>{moment.clipCandidate.riskNote}</dd>
                      </div>
                      <div>
                        <dt>First test metric</dt>
                        <dd>{moment.clipCandidate.firstTestMetric}</dd>
                      </div>
                    </dl>
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
