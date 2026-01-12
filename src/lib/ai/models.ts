export interface Model {
  id: string;
  name: string;
  provider: string;
}

export const MODELS: Model[] = [
  // Google
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "Google",
  },

  // Anthropic
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
  },

  //Kimi
  {
    id: "moonshotai/kimi-k2-0905",
    name: "Kimi K2",
    provider: "Moonshot",
  },
];

/** Default model for new conversations */
export const DEFAULT_MODEL = MODELS[0].id;

/** Get models grouped by provider */
export function getModelsByProvider(): Map<string, Model[]> {
  const grouped = new Map<string, Model[]>();
  for (const model of MODELS) {
    const existing = grouped.get(model.provider) ?? [];
    existing.push(model);
    grouped.set(model.provider, existing);
  }
  return grouped;
}

/** Find a model by ID */
export function getModelById(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id);
}

/** Check if a model ID is valid */
export function isValidModel(id: string): boolean {
  return MODELS.some((m) => m.id === id);
}
