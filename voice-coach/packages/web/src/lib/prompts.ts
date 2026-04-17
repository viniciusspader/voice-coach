export type PromptCategory = "idea-communication" | "storytelling" | "public-speaking" | "sales-persuasion";

export interface Prompt {
  id: string;
  text: string;
  category: PromptCategory;
  suggestedFramework: string;
  tip: string;
  timeLimitSeconds?: number;
}

const CATEGORY_LABELS: Record<PromptCategory, string> = {
  "idea-communication": "Idea Communication",
  storytelling: "Storytelling",
  "public-speaking": "Public Speaking",
  "sales-persuasion": "Sales & Persuasion",
};

export function getCategoryLabel(category: PromptCategory): string {
  return CATEGORY_LABELS[category];
}

export const PROMPTS: Prompt[] = [
  {
    id: "idea-1",
    text: "Explain a complex AWS service to a non-technical executive in 2 minutes.",
    category: "idea-communication",
    suggestedFramework: "PREP",
    tip: "Use PREP: State your Point, give the Reason it matters, share a concrete Example, then restate your Point. Execs want the bottom line first.",
    timeLimitSeconds: 120,
  },
  {
    id: "idea-2",
    text: "Pitch a new initiative to your leadership team.",
    category: "idea-communication",
    suggestedFramework: "Monroe's Motivated Sequence",
    tip: "Follow Monroe's 5 steps: grab Attention, show the Need, present your Satisfaction (solution), help them Visualize the outcome, then call them to Action.",
  },
  {
    id: "idea-3",
    text: "Summarize your team's quarterly results for a skip-level.",
    category: "idea-communication",
    suggestedFramework: "Rule of Three",
    tip: "Stick to exactly 3 key points. The Rule of Three creates rhythm and makes your message memorable. Pick the 3 things that matter most.",
    timeLimitSeconds: 120,
  },
  {
    id: "story-1",
    text: "Tell the story of a project that failed and what you learned.",
    category: "storytelling",
    suggestedFramework: "Hero's Journey",
    tip: "Structure as: the situation before (ordinary world), what went wrong (the challenge), and how you came out transformed. The lesson is the payoff.",
  },
  {
    id: "story-2",
    text: "Describe a moment that changed how you think about leadership.",
    category: "storytelling",
    suggestedFramework: "Story Arc",
    tip: "Great stories have a hook, rising tension, a turning point, and a resolution. Use specific details — names, numbers, what you saw and felt.",
  },
  {
    id: "story-3",
    text: "Share an experience where you convinced a skeptic.",
    category: "storytelling",
    suggestedFramework: "SUCCES",
    tip: "Make it stick: keep it Simple, add something Unexpected, use Concrete details, be Credible, make it Emotional, and tell it as a Story.",
  },
  {
    id: "speak-1",
    text: "Give a 2-minute opening for a keynote on cloud innovation.",
    category: "public-speaking",
    suggestedFramework: "Talk Like TED (Hook + Story)",
    tip: "Open with a story or surprising fact — never with 'Today I'm going to talk about...' The first 15 seconds decide if people listen.",
    timeLimitSeconds: 120,
  },
  {
    id: "speak-2",
    text: "Deliver a toast at a team celebration.",
    category: "public-speaking",
    suggestedFramework: "Emotional + Concrete",
    tip: "Great toasts are personal and specific. Name people, reference real moments, and end with a clear sentiment. Keep it under 90 seconds.",
    timeLimitSeconds: 90,
  },
  {
    id: "speak-3",
    text: "Present a controversial opinion and defend it.",
    category: "public-speaking",
    suggestedFramework: "STATE My Path",
    tip: "Share the facts first, then Tell your interpretation, Ask for their view, Talk tentatively (avoid absolutes), and Encourage pushback. This keeps dialogue open.",
  },
  {
    id: "sales-1",
    text: "Handle an objection: 'We're happy with our current provider.'",
    category: "sales-persuasion",
    suggestedFramework: "Monroe's Motivated Sequence",
    tip: "Don't argue. Acknowledge their satisfaction, then create a Need they haven't considered. Paint a Visualization of what they're missing, then suggest a small Action (a pilot, a demo).",
  },
  {
    id: "sales-2",
    text: "Explain why a customer should migrate to the cloud.",
    category: "sales-persuasion",
    suggestedFramework: "PREP + SUCCES",
    tip: "Lead with the Point (why it matters to THEM, not you). Use one Concrete example of a similar company. Make the benefits Unexpected — something they haven't heard before.",
  },
  {
    id: "sales-3",
    text: "Cold open a discovery call with a new prospect.",
    category: "sales-persuasion",
    suggestedFramework: "Hook + Need",
    tip: "You have 30 seconds. Lead with something relevant to THEIR business, not your product. Ask a question that reveals a pain point. Listen more than you talk.",
    timeLimitSeconds: 60,
  },
];

export function getRandomPrompt(category?: PromptCategory): Prompt {
  const filtered = category ? PROMPTS.filter((p) => p.category === category) : PROMPTS;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getPromptById(id: string): Prompt | undefined {
  return PROMPTS.find((p) => p.id === id);
}
