export const AI_PROVIDERS = {
  testquality: {
    name: "Free TestQuality AI",
    models: ["google/gemini-2.5-flash-lite"],
    requiresApiKey: false,
  },
  openai: {
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini"],
    requiresApiKey: true,
  },
  anthropic: {
    name: "Anthropic",
    models: ["claude-opus-4-1-20250805", "claude-sonnet-4-20250514", "claude-3-7-sonnet-20250219"],
    requiresApiKey: true,
  },
  openrouter: {
    name: "OpenRouter",
    models: [
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.5-pro",
      "openai/gpt-5-mini",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "x-ai/grok-4",
      "x-ai/grok-3-mini"
    ],
    requiresApiKey: true,
  },
} as const;

export type AIProvider = keyof typeof AI_PROVIDERS;
