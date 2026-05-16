export type PackageType = "Slack" | "Email" | "LinkedIn" | "Listener brief";
export type AudienceChannel =
  | "AI-curious professionals"
  | "Operators"
  | "Founders/investors"
  | "Creators/commentators";

export type ShareMoment = {
  title: string;
  audienceChannel: AudienceChannel;
  what: string;
  sharer: string;
  recipient: string;
  why: string;
  afterClick: string;
  packageType: PackageType;
  packageCopy: string;
  experiment: {
    hypothesis: string;
    distributionChannel: string;
    successMetric: string;
    nextTest: string;
  };
  scores: {
    clarity: number;
    urgency: number;
    audienceFit: number;
    usefulness: number;
    trustRisk: number;
  };
};

export type Episode = {
  title: string;
  date: string;
  link: string;
  theme: string;
  whyPick: string;
  moments: ShareMoment[];
};

export const episodes: Episode[] = [
  {
    title: "Towards AI That Can Actually Interact",
    date: "May 12, 2026",
    link: "https://aidailybrief.beehiiv.com/",
    theme: "AI products moving from answer engines toward systems that take action in the real world.",
    whyPick:
      "It sits right where AIDB is strongest: translating a technical shift into a practical question every operator can recognize.",
    moments: [
      {
        title: "Interaction becomes the product",
        audienceChannel: "Operators",
        what:
          "The useful frame is that AI value is shifting from producing outputs to coordinating real workflows across tools, people, and decisions.",
        sharer: "A product lead",
        recipient: "Their design, engineering, and ops leads",
        why:
          "It gives the team a cleaner way to evaluate AI features: not 'does it answer?' but 'can it move work forward?'",
        afterClick:
          "Use this as a 15-minute roadmap filter: mark each AI feature as answer-only, workflow-assisting, or workflow-owning.",
        packageType: "Slack",
        packageCopy:
          "AIDB had a useful frame today: the next jump is AI that can actually interact, not just answer. Worth using this as a filter on our roadmap: which features merely generate text, and which ones coordinate a real workflow?",
        experiment: {
          hypothesis:
            "Operator audiences will share this when the hook is framed as a practical product roadmap filter.",
          distributionChannel: "LinkedIn operator post plus newsletter share link",
          successMetric: "Tracked source clicks from operator-tagged links",
          nextTest: "Test roadmap-filter copy against a shorter quote-led version.",
        },
        scores: { clarity: 5, urgency: 4, audienceFit: 5, usefulness: 5, trustRisk: 1 },
      },
      {
        title: "The UX burden moves upstream",
        audienceChannel: "Founders/investors",
        what:
          "As agents interact with more systems, product teams need stronger constraints, permissions, and review points instead of prettier chat boxes.",
        sharer: "A startup founder",
        recipient: "Their founding team or investor update list",
        why:
          "It turns a broad AI trend into an immediate audience-relevant question about trust and control.",
        afterClick:
          "Ask product and ops leads to name the first permission boundary that would make an agent safe enough to trial.",
        packageType: "Email",
        packageCopy:
          "One AIDB segment captured something we should pressure-test: if AI products start acting across tools, UX becomes permissioning, checkpoints, and recovery. That is a sharper product lens than 'add a chatbot.'",
        experiment: {
          hypothesis:
            "Founder/investor audiences will click when the share emphasizes trust and control as product strategy.",
          distributionChannel: "Investor newsletter blurb",
          successMetric: "Click-through rate to the episode source",
          nextTest: "Compare permission-boundary framing with agent UX framing.",
        },
        scores: { clarity: 4, urgency: 4, audienceFit: 5, usefulness: 4, trustRisk: 1 },
      },
    ],
  },
  {
    title: "The Best Way to Talk to Your Agents",
    date: "May 11, 2026",
    link: "https://aidailybrief.beehiiv.com/",
    theme: "Practical communication patterns for getting better results from AI agents.",
    whyPick:
      "It is highly forwardable because almost every AI-curious worker has felt the gap between prompting a model and managing an agent.",
    moments: [
      {
        title: "Agent work needs manager language",
        audienceChannel: "AI-curious professionals",
        what:
          "The key shareable idea is that agents respond better to clear goals, constraints, checkpoints, and evaluation criteria than vague prompts.",
        sharer: "An operations manager",
        recipient: "A team experimenting with AI workflows",
        why:
          "It gives non-technical teammates a practical upgrade path without requiring them to learn model internals.",
        afterClick:
          "Turn one recurring team task into an agent brief with outcome, constraints, checkpoints, and definition of done.",
        packageType: "Listener brief",
        packageCopy:
          "AIDB's agent advice maps cleanly to management basics: define the outcome, name the constraints, set checkpoints, and say what good looks like. We should turn that into our default agent brief template.",
        experiment: {
          hypothesis:
            "AI-curious professionals will share this if the package makes agent use feel like a learnable work skill.",
          distributionChannel: "Email forward and LinkedIn text post",
          successMetric: "Copy actions and tracked listener referrals",
          nextTest: "Test manager-language copy against a checklist-style package.",
        },
        scores: { clarity: 5, urgency: 5, audienceFit: 5, usefulness: 5, trustRisk: 1 },
      },
      {
        title: "Prompting is becoming delegation",
        audienceChannel: "Creators/commentators",
        what:
          "The episode reframes prompt quality as delegation quality, which makes the advice easy to share with a broader AI-curious audience.",
        sharer: "A department head",
        recipient: "Peers trying to improve AI adoption",
        why:
          "It makes AI adoption feel less mystical and more like a recognizable management skill.",
        afterClick:
          "Rewrite one vague AI request as delegated work: owner, goal, constraints, examples, and review point.",
        packageType: "LinkedIn",
        packageCopy:
          "Useful AIDB framing: talking to agents is starting to look less like 'prompt engineering' and more like delegation. Better instructions, clearer constraints, better checkpoints. That is a much more teachable idea for teams.",
        experiment: {
          hypothesis:
            "Creators/commentators will reshare this when it gives them a crisp replacement frame for prompt engineering.",
          distributionChannel: "LinkedIn creator post",
          successMetric: "Reposts and attributed episode clicks",
          nextTest: "Test delegation framing against a 'prompting is management' headline.",
        },
        scores: { clarity: 5, urgency: 4, audienceFit: 4, usefulness: 5, trustRisk: 1 },
      },
    ],
  },
  {
    title: "Why OpenAI and Anthropic Are Becoming Consultants",
    date: "May 5, 2026",
    link: "https://pod.wave.co/podcast/the-ai-daily-brief-formerly-the-ai-breakdown-artificial-intelligence-news-and-analysis/why-openai-and-anthropic-are-becoming-consultants",
    theme: "Frontier labs moving deeper into enterprise implementation and advisory work.",
    whyPick:
      "It has a built-in business audience because it connects AI lab strategy to what enterprises are actually buying.",
    moments: [
      {
        title: "Model access is not the whole product",
        audienceChannel: "Operators",
        what:
          "The episode's business implication is that enterprises need implementation judgment, integration help, and workflow redesign as much as raw model access.",
        sharer: "A CIO or transformation lead",
        recipient: "Business and technology leaders",
        why:
          "It helps leaders understand why AI budgets are shifting toward services, enablement, and operating model change.",
        afterClick:
          "Audit one AI initiative for missing implementation capacity: workflow owner, training loop, integration path, and success metric.",
        packageType: "Listener brief",
        packageCopy:
          "AIDB's point on OpenAI and Anthropic moving into consulting is worth discussing: the scarce thing may not be model access, but implementation capacity. That changes how leaders should evaluate AI vendors and adoption plans.",
        experiment: {
          hypothesis:
            "Operator audiences will click when the episode is positioned as a practical AI adoption budget lens.",
          distributionChannel: "Business newsletter blurb",
          successMetric: "Subscribed listeners from tracked links",
          nextTest: "Test implementation-capacity framing against vendor-evaluation framing.",
        },
        scores: { clarity: 5, urgency: 4, audienceFit: 5, usefulness: 4, trustRisk: 1 },
      },
      {
        title: "The services layer becomes strategic",
        audienceChannel: "Founders/investors",
        what:
          "The consulting move suggests the AI market is rewarding the firms that can translate frontier capability into deployed business process.",
        sharer: "A startup investor",
        recipient: "Portfolio founders",
        why:
          "It points founders toward value capture in enablement, migration, workflow, and vertical implementation.",
        afterClick:
          "Map one customer workflow where services, enablement, or process redesign may be more valuable than model access.",
        packageType: "Email",
        packageCopy:
          "AIDB had a strong market read: if frontier labs are becoming consultants, the services layer is not boring residue. It may be where capability turns into revenue. Useful lens for AI startup positioning.",
        experiment: {
          hypothesis:
            "Founder/investor audiences will share this when the angle connects frontier lab behavior to startup value capture.",
          distributionChannel: "Founder email list",
          successMetric: "Forward clicks and new subscriber conversion",
          nextTest: "Test services-layer copy against a market-map style package.",
        },
        scores: { clarity: 4, urgency: 4, audienceFit: 5, usefulness: 4, trustRisk: 1 },
      },
    ],
  },
];

export const scoreLabels = [
  "clarity",
  "urgency",
  "audienceFit",
  "usefulness",
  "trustRisk",
] as const;

export const audienceChannels: Array<"All" | AudienceChannel> = [
  "All",
  "AI-curious professionals",
  "Operators",
  "Founders/investors",
  "Creators/commentators",
];
