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
  shareAssets: {
    linkedIn: string;
    x: string;
    email: string;
  };
  experiment: {
    hypothesis: string;
    distributionChannel: string;
    successMetric: string;
    nextTest: string;
  };
  clipCandidate: {
    whyThisMoment: string;
    bestChannel: string;
    hook: string;
    title: string;
    timestamp: string;
    riskNote: string;
    firstTestMetric: string;
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
        shareAssets: {
          linkedIn:
            "AIDB had a useful frame today: the next jump is AI that can actually interact, not just answer. For product teams, that is a roadmap filter: which features merely generate text, and which ones coordinate a real workflow?",
          x:
            "Useful AIDB frame: the next AI jump is interaction, not just answers. Product test: does this feature generate output, or coordinate a real workflow?",
          email:
            "Worth listening to this AIDB segment if you are evaluating AI product roadmaps. The practical question is whether a feature only answers, or whether it can help coordinate a real workflow.",
        },
        experiment: {
          hypothesis:
            "Operator audiences will share this when the hook is framed as a practical product roadmap filter.",
          distributionChannel: "LinkedIn operator post plus newsletter share link",
          successMetric: "Tracked source clicks from operator-tagged links",
          nextTest: "Test roadmap-filter copy against a shorter quote-led version.",
        },
        clipCandidate: {
          whyThisMoment:
            "It turns a broad agent trend into a practical product decision filter.",
          bestChannel: "LinkedIn",
          hook: "The next AI product question is not 'does it answer?'",
          title: "AI Products Are Moving From Answers To Interaction",
          timestamp: "Human review needed: add exact episode timestamp",
          riskNote: "Confirm the clip preserves the nuance between assistance and autonomy.",
          firstTestMetric: "3-second hold rate plus tracked source clicks",
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
        shareAssets: {
          linkedIn:
            "One AIDB segment captured a sharper product lens for agents: if AI starts acting across tools, UX becomes permissions, checkpoints, and recovery. That is more useful than another 'add a chatbot' take.",
          x:
            "AIDB had a sharp agent UX point: once AI acts across tools, UX is permissioning, checkpoints, and recovery. Not just prettier chat.",
          email:
            "This AIDB episode is useful for anyone thinking about agent products. The strongest idea is that agent UX is increasingly about permissions, review points, and recovery paths.",
        },
        experiment: {
          hypothesis:
            "Founder/investor audiences will click when the share emphasizes trust and control as product strategy.",
          distributionChannel: "Investor newsletter blurb",
          successMetric: "Click-through rate to the episode source",
          nextTest: "Compare permission-boundary framing with agent UX framing.",
        },
        clipCandidate: {
          whyThisMoment:
            "It reframes agent UX as trust infrastructure, not interface polish.",
          bestChannel: "X",
          hook: "Agent UX is not just chat. It is permissions and recovery.",
          title: "The UX Burden Moves Upstream",
          timestamp: "Human review needed: add exact episode timestamp",
          riskNote: "Avoid making the segment sound anti-agent or fear-driven.",
          firstTestMetric: "Repost rate plus click-through to source",
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
        shareAssets: {
          linkedIn:
            "AIDB's agent advice maps cleanly to management basics: define the outcome, name the constraints, set checkpoints, and say what good looks like. That is a more teachable frame than 'prompt engineering.'",
          x:
            "AIDB's agent advice in one line: treat prompts like delegation. Outcome, constraints, checkpoints, definition of done.",
          email:
            "This AIDB episode is a practical listen for people trying to get better results from agents. The key frame is that agent work needs manager language, not mystical prompting.",
        },
        experiment: {
          hypothesis:
            "AI-curious professionals will share this if the package makes agent use feel like a learnable work skill.",
          distributionChannel: "Email forward and LinkedIn text post",
          successMetric: "Copy actions and tracked listener referrals",
          nextTest: "Test manager-language copy against a checklist-style package.",
        },
        clipCandidate: {
          whyThisMoment:
            "It makes agent use feel like a familiar management skill instead of a technical trick.",
          bestChannel: "Email/newsletter",
          hook: "Prompting agents is starting to look like delegation.",
          title: "Agents Need Manager Language",
          timestamp: "Human review needed: add exact episode timestamp",
          riskNote: "Keep the clip practical; do not imply prompting no longer matters.",
          firstTestMetric: "Newsletter click rate plus saves",
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
        shareAssets: {
          linkedIn:
            "Useful AIDB framing: talking to agents is starting to look less like prompt engineering and more like delegation. Better instructions, clearer constraints, better checkpoints. Much easier to teach.",
          x:
            "Prompting is becoming delegation. Better outcomes, clearer constraints, better checkpoints. Strong AIDB frame.",
          email:
            "This AIDB episode has a useful frame for anyone explaining agents to a broader audience: prompting is becoming delegation, which makes the skill feel practical and learnable.",
        },
        experiment: {
          hypothesis:
            "Creators/commentators will reshare this when it gives them a crisp replacement frame for prompt engineering.",
          distributionChannel: "LinkedIn creator post",
          successMetric: "Reposts and attributed episode clicks",
          nextTest: "Test delegation framing against a 'prompting is management' headline.",
        },
        clipCandidate: {
          whyThisMoment:
            "It gives explainers a clean language shift from prompt engineering to delegation.",
          bestChannel: "LinkedIn",
          hook: "Prompting is becoming delegation.",
          title: "The Better Frame For Talking To Agents",
          timestamp: "Human review needed: add exact episode timestamp",
          riskNote: "Avoid oversimplifying agent reliability or management skill transfer.",
          firstTestMetric: "Share rate among creator/commentator accounts",
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
        shareAssets: {
          linkedIn:
            "AIDB's point on OpenAI and Anthropic moving into consulting is worth discussing: the scarce thing may not be model access, but implementation capacity. That changes how leaders should evaluate AI vendors and adoption plans.",
          x:
            "If OpenAI and Anthropic are moving into consulting, maybe model access is not the bottleneck. Implementation capacity is.",
          email:
            "This AIDB episode is useful for anyone evaluating AI adoption plans. The strongest takeaway is that implementation capacity may be more scarce than model access.",
        },
        experiment: {
          hypothesis:
            "Operator audiences will click when the episode is positioned as a practical AI adoption budget lens.",
          distributionChannel: "Business newsletter blurb",
          successMetric: "Subscribed listeners from tracked links",
          nextTest: "Test implementation-capacity framing against vendor-evaluation framing.",
        },
        clipCandidate: {
          whyThisMoment:
            "It connects frontier lab strategy to a practical adoption bottleneck.",
          bestChannel: "LinkedIn",
          hook: "What if model access is not the scarce thing?",
          title: "The AI Bottleneck Is Implementation Capacity",
          timestamp: "Human review needed: add exact episode timestamp",
          riskNote: "Make clear this is about adoption capacity, not dismissing model quality.",
          firstTestMetric: "Qualified clicks from operator audiences",
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
        shareAssets: {
          linkedIn:
            "AIDB had a strong market read: if frontier labs are becoming consultants, the services layer is not boring residue. It may be where AI capability turns into revenue.",
          x:
            "AIDB market read: if frontier labs are becoming consultants, the services layer may be where AI capability turns into revenue.",
          email:
            "This AIDB segment is worth sharing with founders and investors thinking about AI startup positioning. It reframes services as a possible value-capture layer, not just implementation residue.",
        },
        experiment: {
          hypothesis:
            "Founder/investor audiences will share this when the angle connects frontier lab behavior to startup value capture.",
          distributionChannel: "Founder email list",
          successMetric: "Forward clicks and new subscriber conversion",
          nextTest: "Test services-layer copy against a market-map style package.",
        },
        clipCandidate: {
          whyThisMoment:
            "It gives founders and investors a market-structure lens on AI services.",
          bestChannel: "Email/newsletter",
          hook: "The services layer may be where AI turns into revenue.",
          title: "Why AI Services May Not Be Boring",
          timestamp: "Human review needed: add exact episode timestamp",
          riskNote: "Avoid making this sound like all value capture moves to services.",
          firstTestMetric: "Forward clicks plus subscriber conversion",
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
