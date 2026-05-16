export type PackageType = "Slack" | "Email" | "LinkedIn" | "Exec memo";

export type ShareMoment = {
  title: string;
  what: string;
  sharer: string;
  recipient: string;
  why: string;
  packageType: PackageType;
  packageCopy: string;
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
        what:
          "The useful frame is that AI value is shifting from producing outputs to coordinating real workflows across tools, people, and decisions.",
        sharer: "A product lead",
        recipient: "Their design, engineering, and ops leads",
        why:
          "It gives the team a cleaner way to evaluate AI features: not 'does it answer?' but 'can it move work forward?'",
        packageType: "Slack",
        packageCopy:
          "AIDB had a useful frame today: the next jump is AI that can actually interact, not just answer. Worth using this as a filter on our roadmap: which features merely generate text, and which ones coordinate a real workflow?",
        scores: { clarity: 5, urgency: 4, audienceFit: 5, usefulness: 5, trustRisk: 1 },
      },
      {
        title: "The UX burden moves upstream",
        what:
          "As agents interact with more systems, product teams need stronger constraints, permissions, and review points instead of prettier chat boxes.",
        sharer: "A startup founder",
        recipient: "Their founding team or investor update list",
        why:
          "It turns a broad AI trend into an immediate company-building question about trust and control.",
        packageType: "Email",
        packageCopy:
          "One AIDB segment captured something we should pressure-test: if AI products start acting across tools, UX becomes permissioning, checkpoints, and recovery. That is a sharper product lens than 'add a chatbot.'",
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
        what:
          "The key shareable idea is that agents respond better to clear goals, constraints, checkpoints, and evaluation criteria than vague prompts.",
        sharer: "An operations manager",
        recipient: "A team experimenting with AI workflows",
        why:
          "It gives non-technical teammates a practical upgrade path without requiring them to learn model internals.",
        packageType: "Exec memo",
        packageCopy:
          "AIDB's agent advice maps cleanly to management basics: define the outcome, name the constraints, set checkpoints, and say what good looks like. We should turn that into our default agent brief template.",
        scores: { clarity: 5, urgency: 5, audienceFit: 5, usefulness: 5, trustRisk: 1 },
      },
      {
        title: "Prompting is becoming delegation",
        what:
          "The episode reframes prompt quality as delegation quality, which makes the advice easy to teach inside a company.",
        sharer: "A department head",
        recipient: "Peers trying to improve AI adoption",
        why:
          "It makes AI adoption feel less mystical and more like a recognizable management skill.",
        packageType: "LinkedIn",
        packageCopy:
          "Useful AIDB framing: talking to agents is starting to look less like 'prompt engineering' and more like delegation. Better instructions, clearer constraints, better checkpoints. That is a much more teachable idea for teams.",
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
        what:
          "The episode's business implication is that enterprises need implementation judgment, integration help, and workflow redesign as much as raw model access.",
        sharer: "A CIO or transformation lead",
        recipient: "Executive staff",
        why:
          "It helps leaders understand why AI budgets are shifting toward services, enablement, and operating model change.",
        packageType: "Exec memo",
        packageCopy:
          "AIDB's point on OpenAI and Anthropic moving into consulting is worth discussing: the scarce thing may not be model access, but implementation capacity. That changes how we should evaluate AI vendors and internal staffing.",
        scores: { clarity: 5, urgency: 4, audienceFit: 5, usefulness: 4, trustRisk: 1 },
      },
      {
        title: "The services layer becomes strategic",
        what:
          "The consulting move suggests the AI market is rewarding the firms that can translate frontier capability into deployed business process.",
        sharer: "A startup investor",
        recipient: "Portfolio founders",
        why:
          "It points founders toward value capture in enablement, migration, workflow, and vertical implementation.",
        packageType: "Email",
        packageCopy:
          "AIDB had a strong market read: if frontier labs are becoming consultants, the services layer is not boring residue. It may be where capability turns into revenue. Useful lens for AI startup positioning.",
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
