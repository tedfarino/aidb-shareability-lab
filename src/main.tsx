/// <reference types="vite/client" />

import { StrictMode, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  CheckCircle2,
  Columns3,
  ExternalLink,
  Headphones,
  LayoutDashboard,
  Link2,
  Plug,
  Radio,
} from "lucide-react";
import "./styles.css";

type WorkflowStatus =
  | "Podcast Produced"
  | "Review"
  | "YouTube Ready"
  | "Social Approved"
  | "Scheduled"
  | "Published"
  | "Measured";
type OperatorView = "board" | "week";
type AppTab = "today" | "workflow" | "schedule" | "metrics" | "setup";
type Channel = "Podcast" | "RSS" | "LinkedIn" | "X" | "YouTube" | "Spotify";

type WorkflowItem = {
  id: string;
  episodeTitle: string;
  momentTitle: string;
  day: string;
  status: WorkflowStatus;
  channel: Channel;
  owner: string;
  hook: string;
  publishWindow: string;
  sourceLink: string;
  postDraft: string;
  connectorState: string;
  platformPostUrl?: string;
  views: number;
  retentionRate: number;
  replies: number;
  clicks: number;
  tractionScore: number;
};

type Connector = {
  channel: Channel;
  publish: string;
  metrics: string;
  state: string;
  note: string;
};

type ReadinessGate = {
  id: string;
  label: string;
  state: "ready" | "waiting" | "blocked" | string;
  detail: string;
};

type Segment = {
  id: string;
  role: string;
  segmentKey: string;
  title: string;
  tedTake: string;
  listenerStakes: string;
  watchItem: string;
  sourceTitles: string[];
  clusters: string[];
};

type DashboardImport = {
  app: string;
  source: string;
  preparedAt: string;
  latestEpisode: {
    episodeId: string;
    title: string;
    show: string;
    sourceEpisodeDir: string;
    latestRenderDir: string;
    dashboardPath: string;
    scriptReviewPath: string;
    scriptPath: string;
    audioPath: string;
    producedAt: string | null;
    summary: string;
    thesis: string;
    hostPosition: string;
    scriptPreview: string;
    sourceCount: number;
    storyCount: number;
    durationMinutesEstimate: number | null;
    qaStatus: {
      pipelineOk: boolean;
      renderOk: boolean;
      renderMatchesEpisode: boolean;
      editorialAuditPass: boolean;
      gates: Record<string, boolean>;
      blockers: string[];
      dailyStatus?: {
        selected_count?: number;
        accepted_count?: number;
        rejected_count?: number;
      };
    };
    reviewStatus: {
      telegramCalled: boolean;
      sentAt: string;
      approvalStatus: string;
    };
    publishStatus: {
      approvedForPublic: boolean;
      rssFeedUrl: string;
      spotifyEpisodeUrl: string;
      youtubeEpisodeUrl: string;
      preferredSocialUrl: string;
      socialPublishBlocked: boolean;
      blockReason: string;
    };
    topSources: Array<{ id: string; title: string; source: string; url: string; storyCluster: string }>;
    segments: Segment[];
  };
  readinessGate: ReadinessGate[];
  connectors: Connector[];
  workflowItems: WorkflowItem[];
  safety: {
    publishCallsMade: boolean;
    uploadCallsMade: boolean;
    publicPostingRequiresApproval: boolean;
    linkedInAndXRequirePreferredSocialUrl: boolean;
    rssComIsInfrastructureOnly: boolean;
    apiKeyValuesPrinted: boolean;
  };
};

const workflowStatuses: WorkflowStatus[] = [
  "Podcast Produced",
  "Review",
  "YouTube Ready",
  "Social Approved",
  "Scheduled",
  "Published",
  "Measured",
];

const statusMeta: Record<WorkflowStatus, { label: string; description: string }> = {
  "Podcast Produced": { label: "Podcast Produced", description: "5 AM source package" },
  Review: { label: "Review", description: "Listen and approve" },
  "YouTube Ready": { label: "YouTube Ready", description: "Primary public URL" },
  "Social Approved": { label: "Social Approved", description: "Copy cleared" },
  Scheduled: { label: "Scheduled", description: "Connector queue" },
  Published: { label: "Published", description: "Live platform post" },
  Measured: { label: "Measured", description: "Metrics pulled" },
};

const fallbackDashboard: DashboardImport = {
  app: "Growth Engineer Dashboard",
  source: "fallback",
  preparedAt: new Date().toISOString(),
  latestEpisode: {
    episodeId: "no-import-yet",
    title: "Import the latest Charlotte Brief",
    show: "The Charlotte Brief",
    sourceEpisodeDir: "C:\\Users\\tedfa\\Documents\\personal_charlotte_podcast",
    latestRenderDir: "",
    dashboardPath: "",
    scriptReviewPath: "",
    scriptPath: "",
    audioPath: "",
    producedAt: null,
    summary: "Run npm run import:charlotte-latest to load the latest podcast automation output.",
    thesis: "",
    hostPosition: "",
    scriptPreview: "",
    sourceCount: 0,
    storyCount: 0,
    durationMinutesEstimate: null,
    qaStatus: {
      pipelineOk: false,
      renderOk: false,
      renderMatchesEpisode: false,
      editorialAuditPass: false,
      gates: {},
      blockers: ["Charlotte import has not been generated yet."],
    },
    reviewStatus: {
      telegramCalled: false,
      sentAt: "",
      approvalStatus: "not ready - import needed",
    },
    publishStatus: {
      approvedForPublic: false,
      rssFeedUrl: "https://media.rss.com/the-charlotte-brief/feed.xml",
      spotifyEpisodeUrl: "",
      youtubeEpisodeUrl: "",
      preferredSocialUrl: "",
      socialPublishBlocked: true,
      blockReason: "Import and YouTube/Spotify URL needed before LinkedIn/X.",
    },
    topSources: [],
    segments: [],
  },
  readinessGate: [
    {
      id: "import-needed",
      label: "Charlotte import",
      state: "blocked",
      detail: "Run npm run import:charlotte-latest.",
    },
  ],
  connectors: [],
  workflowItems: [],
  safety: {
    publishCallsMade: false,
    uploadCallsMade: false,
    publicPostingRequiresApproval: true,
    linkedInAndXRequirePreferredSocialUrl: true,
    rssComIsInfrastructureOnly: true,
    apiKeyValuesPrinted: false,
  },
};

const decisionStorageKey = "growth-engineer-charlotte-decisions";

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("today");
  const [operatorView, setOperatorView] = useState<OperatorView>("board");
  const [dashboardData, setDashboardData] = useState<DashboardImport>(fallbackDashboard);
  const [importState, setImportState] = useState<"loading" | "loaded" | "fallback">("loading");
  const [decisionOverrides, setDecisionOverrides] = useState<Record<string, WorkflowStatus>>(() =>
    loadStoredDecisions(),
  );

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}growth-dashboard-charlotte-import.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Charlotte import not available");
        }
        return response.json() as Promise<DashboardImport>;
      })
      .then((data) => {
        if (!cancelled) {
          setDashboardData(data);
          setImportState("loaded");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardData(fallbackDashboard);
          setImportState("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const workflowItems = useMemo(
    () =>
      dashboardData.workflowItems.map((item) => ({
        ...item,
        status: decisionOverrides[item.id] ?? item.status,
      })),
    [dashboardData.workflowItems, decisionOverrides],
  );

  const metrics = useMemo(() => buildMetrics(workflowItems), [workflowItems]);

  useEffect(() => {
    window.localStorage.setItem(decisionStorageKey, JSON.stringify(decisionOverrides));
  }, [decisionOverrides]);

  const updateStatus = (id: string, status: WorkflowStatus) => {
    setDecisionOverrides((current) => ({
      ...current,
      [id]: status,
    }));
  };

  return (
    <main className="ops-app">
      <header className="ops-header">
        <div>
          <p className="eyebrow">Growth Engineer Dashboard</p>
          <h1>Charlotte Brief distribution</h1>
        </div>
        <div className="header-status">
          <span>{importState === "loaded" ? "Charlotte import loaded" : "Import needed"}</span>
          <strong>{dashboardData.latestEpisode.reviewStatus.approvalStatus}</strong>
        </div>
      </header>

      <nav className="app-tabs" aria-label="Dashboard sections">
        {appTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "today" ? (
        <section className="tab-page">
          <TabExplainer
            title="Start here every morning"
            body="This tab answers one question: did the 5 AM Charlotte Brief create something you can distribute today?"
            action="If it says blocked, do nothing in the publishing workflow. If it says ready, listen once and approve the episode."
          />
          <TodayActionPanel data={dashboardData} />
          <EpisodeRunPanel data={dashboardData} />
          <ReadinessGatePanel gates={dashboardData.readinessGate} />
        </section>
      ) : null}

      {activeTab === "workflow" ? (
        <section className="tab-page">
          <TabExplainer
            title="Use this only after Today is ready"
            body="The Kanban board is for moving approved work toward publishing. It is not where you fix podcast production problems."
            action="Move a card only when you personally approve that step. Blocked cards are locked on purpose."
          />
          <div className="view-toggle workflow-toggle" aria-label="Workflow view">
            <button
              className={operatorView === "board" ? "active" : ""}
              onClick={() => setOperatorView("board")}
              type="button"
            >
              <Columns3 size={16} aria-hidden="true" />
              Board
            </button>
            <button
              className={operatorView === "week" ? "active" : ""}
              onClick={() => setOperatorView("week")}
              type="button"
            >
              <CalendarDays size={16} aria-hidden="true" />
              Week
            </button>
          </div>
          {operatorView === "board" ? (
            <KanbanBoard items={workflowItems} counts={metrics.counts} onStatusChange={updateStatus} />
          ) : (
            <WeekCalendar items={workflowItems} onStatusChange={updateStatus} />
          )}
        </section>
      ) : null}

      {activeTab === "schedule" ? (
        <section className="tab-page">
          <TabExplainer
            title="See what should happen this week"
            body="This is the calendar-shaped view of the same workflow. It is useful for checking timing, not for diagnosing why the podcast failed."
            action="Use it to see planned publishing windows after an episode has been approved and a public destination URL exists."
          />
          <WeekCalendar items={workflowItems} onStatusChange={updateStatus} />
        </section>
      ) : null}

      {activeTab === "metrics" ? (
        <section className="tab-page">
          <TabExplainer
            title="Check traction after posts go live"
            body="This tab is for learning what worked after YouTube, LinkedIn, X, or Spotify have real public activity."
            action="Ignore this tab on blocked production days. There is nothing useful to measure until something publishes."
          />
          <MetricsDashboard metrics={metrics} />
        </section>
      ) : null}

      {activeTab === "setup" ? (
        <section className="tab-page">
          <TabExplainer
            title="Connector and destination status"
            body="This tab explains the plumbing: RSS.com feeds Spotify, YouTube is the main public URL, and LinkedIn/X wait for a preferred social URL."
            action="Use this when a connector is blocked or when you need to confirm why LinkedIn/X are not allowed to post yet."
          />
          <CanonicalEpisodePanel data={dashboardData} />
          <ConnectorPanel connectors={dashboardData.connectors} />
          <SegmentsPanel segments={dashboardData.latestEpisode.segments} />
        </section>
      ) : null}
    </main>
  );
}

const appTabs: Array<{ id: AppTab; label: string; icon: ReactNode }> = [
  { id: "today", label: "Today", icon: <Radio size={16} aria-hidden="true" /> },
  { id: "workflow", label: "Workflow", icon: <Columns3 size={16} aria-hidden="true" /> },
  { id: "schedule", label: "Schedule", icon: <CalendarDays size={16} aria-hidden="true" /> },
  { id: "metrics", label: "Metrics", icon: <LayoutDashboard size={16} aria-hidden="true" /> },
  { id: "setup", label: "Setup", icon: <Plug size={16} aria-hidden="true" /> },
];

function TabExplainer({ title, body, action }: { title: string; body: string; action: string }) {
  return (
    <section className="tab-explainer" aria-label="How to use this section">
      <div>
        <span>How to use this tab</span>
        <strong>{title}</strong>
      </div>
      <p>{body}</p>
      <p>{action}</p>
    </section>
  );
}

function TodayActionPanel({ data }: { data: DashboardImport }) {
  const episode = data.latestEpisode;
  const blockers = episode.qaStatus.blockers || [];
  const isBlocked = !episode.qaStatus.pipelineOk || !episode.qaStatus.renderOk || episode.publishStatus.socialPublishBlocked;
  const primaryBlocker = blockers[0] || episode.publishStatus.blockReason || "No public destination is ready.";
  const selected = episode.qaStatus.dailyStatus?.selected_count;
  const accepted = episode.qaStatus.dailyStatus?.accepted_count;
  const rejected = episode.qaStatus.dailyStatus?.rejected_count;

  if (!isBlocked) {
    return (
      <section className="operator-action ready" aria-label="What to do today">
        <div>
          <span>What you do now</span>
          <strong>Review the episode, then move approved work across the board.</strong>
        </div>
        <p>
          Listen once, approve the episode, create or confirm the YouTube URL, then approve LinkedIn/X copy after the
          preferred social URL exists.
        </p>
      </section>
    );
  }

  return (
    <section className="operator-action blocked" aria-label="What to do today">
      <div>
        <span>What you do now</span>
        <strong>Do not move today&apos;s cards forward.</strong>
      </div>
      <p>
        The 5 AM podcast run stopped before there was a finished episode to distribute. The Kanban board is acting as a
        stop sign today, not a to-do list.
      </p>
      <dl>
        <div>
          <dt>Blocker</dt>
          <dd>{primaryBlocker}</dd>
        </div>
        <div>
          <dt>Story mass</dt>
          <dd>
            {selected ?? 0} selected / {accepted ?? 0} accepted / {rejected ?? 0} rejected
          </dd>
        </div>
        <div>
          <dt>Expected action</dt>
          <dd>Leave distribution blocked unless you intentionally rerun or override the podcast upstream.</dd>
        </div>
      </dl>
    </section>
  );
}

function EpisodeRunPanel({ data }: { data: DashboardImport }) {
  const episode = data.latestEpisode;
  const gateCount = Object.values(episode.qaStatus.gates || {}).filter(Boolean).length;

  return (
    <section className="run-panel" aria-label="Latest Charlotte Brief run">
      <div>
        <div className="dashboard-title">
          <Radio size={17} aria-hidden="true" />
          <span>Today&apos;s Charlotte Brief</span>
        </div>
        <h2>{episode.title}</h2>
        <p>{episode.summary}</p>
      </div>
      <dl>
        <div>
          <dt>Episode ID</dt>
          <dd>{episode.episodeId}</dd>
        </div>
        <div>
          <dt>QA</dt>
          <dd>
            {episode.qaStatus.pipelineOk && episode.qaStatus.renderOk ? "passed" : "blocked"} / {gateCount} gates
          </dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>
            {episode.durationMinutesEstimate ? `${episode.durationMinutesEstimate} min estimate` : "unknown"}
          </dd>
        </div>
        <div>
          <dt>Audio</dt>
          <dd>{episode.audioPath || "not imported"}</dd>
        </div>
      </dl>
    </section>
  );
}

function ReadinessGatePanel({ gates }: { gates: ReadinessGate[] }) {
  return (
    <section className="feed-panel" aria-label="Distribution readiness gates">
      <div className="dashboard-title">
        <CheckCircle2 size={17} aria-hidden="true" />
        <span>Distribution readiness</span>
      </div>
      <div className="feed-grid">
        {gates.map((gate) => (
          <article className={`feed-card ${gate.state === "ready" ? "ready" : "blocked"}`} key={gate.id}>
            <strong>{gate.label}</strong>
            <span>{gate.state}</span>
            <p>{gate.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CanonicalEpisodePanel({ data }: { data: DashboardImport }) {
  const publishStatus = data.latestEpisode.publishStatus;

  return (
    <section className="feed-panel" aria-label="Canonical episode destinations">
      <div className="dashboard-title">
        <Link2 size={17} aria-hidden="true" />
        <span>Destination map</span>
      </div>
      <div className="feed-grid">
        <DestinationCard
          label="RSS.com"
          state="infrastructure"
          detail={publishStatus.rssFeedUrl}
          ready={Boolean(publishStatus.rssFeedUrl)}
        />
        <DestinationCard
          label="YouTube"
          state={publishStatus.youtubeEpisodeUrl ? "primary URL ready" : "primary URL needed"}
          detail={publishStatus.youtubeEpisodeUrl || "Create/upload the current episode video before LinkedIn/X."}
          ready={Boolean(publishStatus.youtubeEpisodeUrl)}
        />
        <DestinationCard
          label="Spotify"
          state={publishStatus.spotifyEpisodeUrl ? "audio URL ready" : "pending ingestion"}
          detail={publishStatus.spotifyEpisodeUrl || "Secondary audio destination after RSS.com distribution."}
          ready={Boolean(publishStatus.spotifyEpisodeUrl)}
        />
        <DestinationCard
          label="LinkedIn / X"
          state={publishStatus.socialPublishBlocked ? "blocked" : "ready after approval"}
          detail={publishStatus.blockReason || "Use preferredSocialUrl only. Do not promote RSS.com."}
          ready={!publishStatus.socialPublishBlocked}
        />
      </div>
    </section>
  );
}

function DestinationCard({
  label,
  state,
  detail,
  ready,
}: {
  label: string;
  state: string;
  detail: string;
  ready: boolean;
}) {
  return (
    <article className={`feed-card ${ready ? "ready" : "blocked"}`}>
      <strong>{label}</strong>
      <span>{state}</span>
      <p>{detail}</p>
    </article>
  );
}

function SegmentsPanel({ segments }: { segments: Segment[] }) {
  const visibleSegments = segments.slice(0, 4);

  return (
    <section className="growth-panel" aria-label="Episode segments">
      <div className="dashboard-title">
        <Headphones size={17} aria-hidden="true" />
        <span>Episode segments for distribution</span>
      </div>
      <div className="growth-grid">
        {visibleSegments.map((segment) => (
          <article className="growth-card" key={segment.id}>
            <strong>{segment.title}</strong>
            <span>{segment.role}</span>
            <p>{segment.tedTake || segment.listenerStakes || segment.watchItem}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConnectorPanel({ connectors }: { connectors: Connector[] }) {
  return (
    <section className="connector-panel" aria-label="Publishing connectors">
      <div className="dashboard-title">
        <Plug size={17} aria-hidden="true" />
        <span>Connector setup</span>
      </div>
      <div className="connector-grid">
        {connectors.map((connector) => (
          <article className="connector-card" key={connector.channel}>
            <div>
              <strong>{connector.channel}</strong>
              <span className={`connector-state ${slugify(connector.state)}`}>{connector.state}</span>
            </div>
            <p>{connector.publish}</p>
            <small>{connector.metrics}</small>
            <ul className="connector-steps">
              <li className={connector.state.includes("ready") ? "ready" : ""}>Publish: {connector.state}</li>
              <li className={connector.metrics.includes("pending") ? "" : "ready"}>Metrics: {connector.metrics}</li>
              <li className="ready">Safety: approval-gated</li>
            </ul>
            <code>{connector.note}</code>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricsDashboard({
  metrics,
}: {
  metrics: ReturnType<typeof buildMetrics>;
}) {
  const bars = workflowStatuses.map((status) => [status, metrics.counts[status]]) as Array<
    [WorkflowStatus, number]
  >;

  return (
    <section className="dashboard" aria-label="Metrics dashboard">
      <div className="dashboard-title">
        <LayoutDashboard size={17} aria-hidden="true" />
        <span>Traction dashboard</span>
      </div>
      <div className="kpi-grid">
        <MetricCard label="Views" value={formatNumber(metrics.totalViews)} tone="blue" />
        <MetricCard label="Retention proxy" value={`${metrics.averageRetention}%`} tone="green" />
        <MetricCard label="Replies/comments" value={metrics.totalReplies} tone="amber" />
        <MetricCard label="Clicks" value={metrics.totalClicks} tone="dark" />
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Pipeline health</h2>
          <div className="pipeline-chart" aria-label="Pipeline status chart">
            {bars.map(([status, value]) => (
              <div className="bar-row" key={status}>
                <span>{status}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${slugify(status)}`}
                    style={{ width: `${Math.max(8, (value / metrics.total) * 100)}%` }}
                  />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-panel">
          <h2>Channel traction</h2>
          <div className="channel-table" aria-label="Channel traction">
            <div className="table-head">
              <span>Channel</span>
              <span>Views</span>
              <span>Ret.</span>
              <span>Clicks</span>
              <span>Score</span>
            </div>
            {metrics.channelPerformance.map((channel) => (
              <div className="table-row" key={channel.channel}>
                <strong>{channel.channel}</strong>
                <span>{formatNumber(channel.views)}</span>
                <span>{channel.retentionRate}%</span>
                <span>{channel.clicks}</span>
                <span>{channel.tractionScore}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="dashboard-panel decision-panel">
          <h2>What changed</h2>
          <div>
            <span>Best signal</span>
            <strong>{metrics.topPost?.momentTitle || "No measured posts yet"}</strong>
            <small>Measurement starts after approved public distribution.</small>
          </div>
          <div>
            <span>Current blocker</span>
            <strong>{metrics.blockerLabel}</strong>
            <small>{metrics.blockerDetail}</small>
          </div>
        </div>
        <div className="dashboard-panel">
          <h2>Connector queue</h2>
          <div className="queue-grid">
            <MetricCard label="Needs review" value={metrics.needsReview} tone="amber" />
            <MetricCard label="Ready/scheduled" value={metrics.ready} tone="blue" />
            <MetricCard label="Live/measured" value={metrics.live} tone="green" />
            <MetricCard label="Measured rate" value={`${metrics.completionRate}%`} tone="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function KanbanBoard({
  items,
  counts,
  onStatusChange,
}: {
  items: WorkflowItem[];
  counts: Record<WorkflowStatus, number>;
  onStatusChange: (id: string, status: WorkflowStatus) => void;
}) {
  return (
    <section className="kanban-board" aria-label="Kanban board">
      {workflowStatuses.map((status) => (
        <section className="kanban-column" key={status} aria-label={`${status} posts`}>
          <div className="kanban-column-header">
            <div>
              <strong>{statusMeta[status].label}</strong>
              <span>{statusMeta[status].description}</span>
            </div>
            <b>{counts[status]}</b>
          </div>
          <div className="kanban-items">
            {items
              .filter((item) => item.status === status)
              .map((item) => (
                <WorkflowCard
                  item={item}
                  key={item.id}
                  onStatusChange={(nextStatus) => onStatusChange(item.id, nextStatus)}
                />
              ))}
          </div>
        </section>
      ))}
    </section>
  );
}

function WeekCalendar({
  items,
  onStatusChange,
}: {
  items: WorkflowItem[];
  onStatusChange: (id: string, status: WorkflowStatus) => void;
}) {
  const weekDays = Array.from(new Set(items.map((item) => item.day)));

  return (
    <section className="week-board" aria-label="One-week calendar">
      {weekDays.map((day) => {
        const dayItems = items.filter((item) => item.day === day);
        return (
          <section className="week-day" key={day}>
            <div className="week-day-header">
              <strong>{day}</strong>
              <span>{dayItems.length}</span>
            </div>
            <div className="week-day-items">
              {dayItems.map((item) => (
                <article className="week-item" key={item.id}>
                  <span className={`status-chip ${slugify(item.status)}`}>{item.status}</span>
                  <strong>{item.momentTitle}</strong>
                  <small>
                    {item.channel} / {item.publishWindow}
                  </small>
                  <button type="button" onClick={() => onStatusChange(item.id, nextWorkflowStatus(item.status))}>
                    Move to {nextWorkflowStatus(item.status)}
                  </button>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

function WorkflowCard({
  item,
  onStatusChange,
}: {
  item: WorkflowItem;
  onStatusChange: (status: WorkflowStatus) => void;
}) {
  const nextStatus = nextWorkflowStatus(item.status);
  const link = item.platformPostUrl || item.sourceLink;
  const isBlocked =
    item.connectorState.includes("blocked") ||
    item.connectorState.includes("qa blocked") ||
    item.connectorState.includes("stale successful episode");

  return (
    <article className={`workflow-card ${isBlocked ? "blocked-card" : ""}`}>
      <div className="workflow-card-top">
        <span className={`status-chip ${slugify(item.status)}`}>{item.status}</span>
        <small>{item.day}</small>
      </div>
      <h2>{item.momentTitle}</h2>
      <p>{item.hook}</p>
      <div className="card-detail">
        <span>Channel</span>
        <strong>{item.channel}</strong>
        <span>Publish</span>
        <strong>{item.publishWindow}</strong>
        <span>Connector</span>
        <strong>{item.connectorState}</strong>
      </div>
      <div className="draft-copy">{item.postDraft}</div>
      <div className="card-footer">
        <select
          aria-label={`Set status for ${item.momentTitle}`}
          disabled={isBlocked}
          onChange={(event) => onStatusChange(event.target.value as WorkflowStatus)}
          value={item.status}
        >
          {workflowStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="button" disabled={isBlocked} onClick={() => onStatusChange(nextStatus)}>
          <CheckCircle2 size={15} aria-hidden="true" />
          {isBlocked ? "Blocked" : nextStatus}
        </button>
        {link ? (
          <a href={link} rel="noreferrer" target="_blank" title="Open source">
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}

function buildMetrics(workflowItems: WorkflowItem[]) {
  const counts = Object.fromEntries(
    workflowStatuses.map((status) => [
      status,
      workflowItems.filter((item) => item.status === status).length,
    ]),
  ) as Record<WorkflowStatus, number>;
  const total = workflowItems.length || 1;
  const live = counts.Published + counts.Measured;
  const ready = counts["YouTube Ready"] + counts["Social Approved"] + counts.Scheduled;
  const needsReview = counts["Podcast Produced"] + counts.Review;
  const completionRate = Math.round((counts.Measured / total) * 100);
  const measuredItems = workflowItems.filter(
    (item) => item.status === "Published" || item.status === "Measured",
  );
  const tractionItems = measuredItems.length > 0 ? measuredItems : workflowItems;
  const totalViews = tractionItems.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalClicks = tractionItems.reduce((sum, item) => sum + (item.clicks || 0), 0);
  const totalReplies = tractionItems.reduce((sum, item) => sum + (item.replies || 0), 0);
  const averageRetention =
    tractionItems.length > 0
      ? Math.round(tractionItems.reduce((sum, item) => sum + (item.retentionRate || 0), 0) / tractionItems.length)
      : 0;
  const topPost = [...tractionItems].sort((a, b) => (b.tractionScore || 0) - (a.tractionScore || 0))[0];
  const channelPerformance = (["YouTube", "LinkedIn", "X", "Spotify"] as Channel[]).map((channel) => {
    const channelItems = tractionItems.filter((item) => item.channel === channel);
    const denominator = channelItems.length || 1;

    return {
      channel,
      views: channelItems.reduce((sum, item) => sum + (item.views || 0), 0),
      replies: channelItems.reduce((sum, item) => sum + (item.replies || 0), 0),
      clicks: channelItems.reduce((sum, item) => sum + (item.clicks || 0), 0),
      retentionRate: Math.round(
        channelItems.reduce((sum, item) => sum + (item.retentionRate || 0), 0) / denominator,
      ),
      tractionScore: Math.round(
        channelItems.reduce((sum, item) => sum + (item.tractionScore || 0), 0) / denominator,
      ),
    };
  });
  const blockedSocial = workflowItems.find((item) => item.connectorState.includes("blocked"));

  return {
    counts,
    live,
    ready,
    needsReview,
    completionRate,
    total,
    totalViews,
    totalClicks,
    totalReplies,
    averageRetention,
    topPost,
    blockerLabel: blockedSocial ? blockedSocial.connectorState : "No connector blocker",
    blockerDetail: blockedSocial
      ? `${blockedSocial.channel}: ${blockedSocial.momentTitle}`
      : "Next step is approval, publishing, or metric pull.",
    channelPerformance,
  };
}

function nextWorkflowStatus(status: WorkflowStatus) {
  const index = workflowStatuses.indexOf(status);
  return workflowStatuses[Math.min(index + 1, workflowStatuses.length - 1)];
}

function loadStoredDecisions() {
  try {
    const stored = window.localStorage.getItem(decisionStorageKey);
    if (!stored) {
      return {};
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) =>
        workflowStatuses.includes(value as WorkflowStatus),
      ),
    ) as Record<string, WorkflowStatus>;
  } catch {
    return {};
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
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
