// ─── Storage Schema ─────────────────────────────────────────────────────────

export interface ExtensionSettings {
  geminiApiKey: string;
  geminiModel: string;
}

export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: 'Fast & capable' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', description: 'Fastest, lightweight' },
  { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro', description: 'Highest quality' },
] as const;

const DEFAULTS: ExtensionSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash-lite',
};

// ─── Storage Helpers ────────────────────────────────────────────────────────

export async function getSettings(): Promise<ExtensionSettings> {
  const data = await chrome.storage.local.get(DEFAULTS);
  return data as ExtensionSettings;
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  await chrome.storage.local.set(settings);
}

export async function getApiKey(): Promise<string> {
  const { geminiApiKey } = await getSettings();
  return geminiApiKey;
}

export async function getModel(): Promise<string> {
  const { geminiModel } = await getSettings();
  return geminiModel;
}
