import type { AnthropicProvider } from '@ai-sdk/anthropic';
import type { DeepSeekProvider } from '@ai-sdk/deepseek';
import type { GoogleProvider } from '@ai-sdk/google';
import type { MistralProvider } from '@ai-sdk/mistral';
import type { OpenAIProvider } from '@ai-sdk/openai';
import type { XaiProvider } from '@ai-sdk/xai';
import type { OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import { tblProvider, type IProvider } from '../db/index.ts';
import { credentialStore } from '../security/credential_store.ts';

export type ProviderId =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'xai'
  | 'deepseek'
  | 'openrouter';

export type ProviderSDK = OpenRouterProvider |
  AnthropicProvider | DeepSeekProvider | MistralProvider | OpenAIProvider | GoogleProvider | XaiProvider;

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  apiKeyEnv: string;
  apiKeyUrl: string;
  create: (apiKey: string) => Promise<ProviderSDK>;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  inputPer1M: number;
  outputPer1M: number;
  contextWindow: number;
}

const anthropicModels = [
    { id: 'claude-fable-5-1', name: 'Claude Fable 5.1', description: 'Mythos-class flagship', inputPer1M: 10.00, outputPer1M: 50.00, contextWindow: 1_000_000 },
    { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', description: 'Most capable Opus', inputPer1M: 5.00, outputPer1M: 25.00, contextWindow: 1_000_000 },
    { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', description: 'Best agentic balance', inputPer1M: 3.00, outputPer1M: 15.00, contextWindow: 1_000_000 },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Reliable workhorse', inputPer1M: 3.00, outputPer1M: 15.00, contextWindow: 1_000_000 },
    { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Fast and cheap', inputPer1M: 1.00, outputPer1M: 5.00, contextWindow: 200_000 },
];

const openAiModels = [
  { id: 'gpt-5', name: 'GPT-5', description: 'Flagship general purpose', inputPer1M: 1.25, outputPer1M: 10.00, contextWindow: 400_000 },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', description: 'Fast and cheap', inputPer1M: 0.25, outputPer1M: 2.00, contextWindow: 272_000 },
  { id: 'o3', name: 'o3', description: 'Deep reasoning', inputPer1M: 2.00, outputPer1M: 8.00, contextWindow: 200_000 },
  { id: 'o4-mini', name: 'o4-mini', description: 'Cheap reasoning', inputPer1M: 1.10, outputPer1M: 4.40, contextWindow: 200_000 },
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Legacy flagship', inputPer1M: 2.50, outputPer1M: 10.00, contextWindow: 128_000 },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Legacy cheap', inputPer1M: 0.15, outputPer1M: 0.60, contextWindow: 128_000 },
];

const googleModels = [
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', description: 'Most capable (preview)', inputPer1M: 2.00, outputPer1M: 12.00, contextWindow: 1_000_000 },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', description: 'Fast (preview)', inputPer1M: 0.50, outputPer1M: 3.00, contextWindow: 1_000_000 },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', description: 'Cheapest stable', inputPer1M: 0.25, outputPer1M: 1.50, contextWindow: 1_000_000 },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Stable production', inputPer1M: 1.25, outputPer1M: 10.00, contextWindow: 1_048_576 },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Best stable balance', inputPer1M: 0.30, outputPer1M: 2.50, contextWindow: 1_048_576 },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Cheapest stable', inputPer1M: 0.10, outputPer1M: 0.40, contextWindow: 1_048_576 },
];

const mistralModels = [
  { id: 'mistral-large-latest', name: 'Mistral Large 3', description: 'Most capable', inputPer1M: 0.50, outputPer1M: 1.50, contextWindow: 131_072 },
  { id: 'mistral-small-latest', name: 'Mistral Small 4', description: 'Fast and cheap', inputPer1M: 0.15, outputPer1M: 0.60, contextWindow: 131_072 },
];

const xaiModels = [
    { id: 'grok-4.3', name: 'Grok 4.3', description: 'Current flagship', inputPer1M: 1.25, outputPer1M: 2.50, contextWindow: 256_000 },
    { id: 'grok-3', name: 'Grok 3', description: 'Legacy capable', inputPer1M: 3.00, outputPer1M: 15.00, contextWindow: 131_072 },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', description: 'Fast and cheap', inputPer1M: 0.30, outputPer1M: 0.50, contextWindow: 131_072 },
]

const deepseekModels = [
  { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', description: 'Best capability', inputPer1M: 0.435, outputPer1M: 0.87, contextWindow: 1_000_000 },
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', description: 'Best value', inputPer1M: 0.14, outputPer1M: 0.28, contextWindow: 1_000_000 },
];

const withVendor = (vendor: string, models: ModelConfig[]): ModelConfig[] =>
  models.map((m) => ({ ...m, id: `${vendor}/${m.id}` }));

const openRouterModels = [
  ...withVendor('anthropic', anthropicModels),
  ...withVendor('openai', openAiModels),
  ...withVendor('google', googleModels),
  ...withVendor('x-ai', xaiModels),
  ...withVendor('mistralai', mistralModels),
  ...withVendor('deepseek', deepseekModels),
  { id: 'cohere/north-mini-code:free', name: 'Cohere North Mini Code', description: 'Free Code model', inputPer1M: 0.00, outputPer1M: 0.00, contextWindow: 256_000 },
];

export const PROVIDER_MODELS: Record<ProviderId, ModelConfig[]> = {
  anthropic: anthropicModels,
  openai: openAiModels,
  google: googleModels,
  mistral: mistralModels,
  xai: xaiModels,
  deepseek: deepseekModels,
  openrouter: openRouterModels,
};

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    apiKeyUrl: 'https://console.anthropic.com/keys',
    create: async (apiKey) => {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey });
    },
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT & o-series models',
    apiKeyEnv: 'OPENAI_API_KEY',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    create: async (apiKey) => {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey });
    },
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini models',
    apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    create: async (apiKey) => {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      return createGoogleGenerativeAI({ apiKey });
    },
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral & Codestral models',
    apiKeyEnv: 'MISTRAL_API_KEY',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    create: async (apiKey) => {
      const { createMistral } = await import('@ai-sdk/mistral');
      return createMistral({ apiKey });
    },
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Grok models',
    apiKeyEnv: 'XAI_API_KEY',
    apiKeyUrl: 'https://console.x.ai',
    create: async (apiKey) => {
      const { createXai } = await import('@ai-sdk/xai');
      return createXai({ apiKey });
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek reasoning & chat models',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    create: async (apiKey) => {
      const { createDeepSeek } = await import('@ai-sdk/deepseek');
      return createDeepSeek({ apiKey });
    },
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access any model via one key',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    apiKeyUrl: 'https://openrouter.ai/keys',
    create: async (apiKey) => {
      const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
      return createOpenRouter({ apiKey });
    },
  },
];

export function getModels(id: ProviderId): ModelConfig[] {
  return PROVIDER_MODELS[id];
}

export function getModelById(id: string): ModelConfig | undefined {
  return Object.values(PROVIDER_MODELS).flat().find((m) => m.id === id);
}

export function getModelLabel(model: ModelConfig): string {
  if (!model.name) {
    return model.id;
  }
  return `${model.name} (${model.id})`;
}

export function getProviderLabel(provider: ProviderConfig): string {
  if (!provider.name) {
    return provider.id;
  }
  return `${provider.name} (${provider.id})`;
}

export async function setProvider(id: ProviderId, apiKey: string) {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  await credentialStore.set(provider.apiKeyEnv, apiKey);
  const providerSdk = await provider.create(apiKey);
  return providerSdk;
}

export function setProviderToLocal(provider: IProvider) {
  tblProvider.setProvider(provider);
}


