import model from "./model-data.js";

export const SNIP_LABELS = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "csv",
  "diff",
  "dockerfile",
  "go",
  "html",
  "ini",
  "java",
  "javascript",
  "json",
  "log",
  "lua",
  "markdown",
  "php",
  "plain_text",
  "powershell",
  "python",
  "ruby",
  "rust",
  "sql",
  "toml",
  "typescript",
  "xml",
  "yaml",
] as const;

export type SnipLabel = (typeof SNIP_LABELS)[number];

export interface SnipFeatureConfig {
  ngram_min: number;
  ngram_max: number;
  hash_buckets: number;
  lowercase: boolean;
  binary_counts: boolean;
  normalize: boolean;
  add_shape_features?: boolean;
}

export interface SnipSamplingConfig {
  small_cutoff: number;
  window_size: number;
  separator: string;
}

export interface SnipModelConfig {
  model_type: "linear_pa";
  name?: string;
  labels: SnipLabel[];
  feature: SnipFeatureConfig;
  sampling: SnipSamplingConfig;
  fallback_label?: SnipLabel;
  thresholds?: Partial<Record<SnipLabel, number>>;
  margin_thresholds?: Partial<Record<SnipLabel, number>>;
  [key: string]: unknown;
}

export interface SnipModel {
  config: SnipModelConfig;
  bias?: Partial<Record<SnipLabel, number>>;
  weights: Partial<Record<SnipLabel, Array<[number, number]>>>;
}

export interface ClassificationResult {
  label: SnipLabel;
  predicted_label: SnipLabel;
  confidence: number;
  margin: number;
  alternatives: Array<[SnipLabel, number]>;
}

export function classifyText(text: string): ClassificationResult {
  return classifyWithModel(text, model);
}

export async function classifyTextAsync(text: string): Promise<ClassificationResult> {
  await yieldToBrowser();
  return classifyText(text);
}

function classifyWithModel(text: string, model: SnipModel): ClassificationResult {
  if (model.config.model_type !== "linear_pa") {
    throw new Error(`unsupported SNIP model type: ${model.config.model_type}`);
  }

  const sampled = sampleWithConfig(text, model.config.sampling);
  const features = extractFeatures(sampled, model.config.feature);
  const scores = new Map<SnipLabel, number>();

  for (const label of model.config.labels) {
    let score = model.bias?.[label] ?? 0;
    const weights = model.weights[label] ?? [];
    for (const [key, weight] of weights) {
      score += (features.get(key) ?? 0) * weight;
    }
    scores.set(label, score);
  }

  const probabilities = softmax(scores);
  const alternatives = [...probabilities.entries()].sort((a, b) => b[1] - a[1]);
  const [predictedLabel, confidence] = alternatives[0] ?? [model.config.fallback_label ?? "plain_text", 0];
  const second = alternatives[1]?.[1] ?? 0;
  const margin = confidence - second;
  const threshold = model.config.thresholds?.[predictedLabel] ?? 0;
  const marginThreshold = model.config.margin_thresholds?.[predictedLabel] ?? 0;
  const fallback = model.config.fallback_label ?? "plain_text";
  const accepted = confidence >= threshold && margin >= marginThreshold;

  return {
    label: accepted ? predictedLabel : fallback,
    predicted_label: predictedLabel,
    confidence,
    margin,
    alternatives: alternatives.slice(0, 5),
  };
}

export function sampleText(text: string): string {
  return sampleWithConfig(text, model.config.sampling);
}

function sampleWithConfig(text: string, config: SnipSamplingConfig): string {
  if (text.length <= config.small_cutoff) return text;

  const windowSize = config.window_size;
  const start = text.slice(0, windowSize);
  const midpoint = Math.floor(text.length / 2);
  const half = Math.floor(windowSize / 2);
  const middle = text.slice(
    Math.max(0, midpoint - half),
    Math.min(text.length, midpoint + half),
  );
  const end = text.slice(-windowSize);
  return [start, middle, end].join(config.separator);
}

function extractFeatures(text: string, config: SnipFeatureConfig): Map<number, number> {
  if (config.lowercase) text = text.toLowerCase();

  const counts = new Map<number, number>();
  const padded = ` ${text} `;
  for (let n = config.ngram_min; n <= config.ngram_max; n += 1) {
    if (padded.length < n) continue;
    for (let i = 0; i <= padded.length - n; i += 1) {
      const key = stableHash(`char${n}:${padded.slice(i, i + n)}`, config.hash_buckets);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const features = new Map<number, number>();
  let norm = 0;
  for (const [key, value] of counts.entries()) {
    const transformed = config.binary_counts ? 1 : Math.log1p(value);
    features.set(key, transformed);
    norm += transformed * transformed;
  }

  if (config.normalize && norm > 0) {
    const scale = Math.sqrt(norm);
    for (const [key, value] of features.entries()) {
      features.set(key, value / scale);
    }
  }

  return features;
}

function stableHash(text: string, buckets: number): number {
  let value = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    value ^= code & 0xff;
    value = Math.imul(value, 16777619) >>> 0;
    value ^= (code >>> 8) & 0xff;
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value % buckets;
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof globalThis.requestAnimationFrame === "function") {
      globalThis.requestAnimationFrame(() => resolve());
      return;
    }
    globalThis.setTimeout(resolve, 0);
  });
}

function softmax(scores: Map<SnipLabel, number>): Map<SnipLabel, number> {
  const maxScore = Math.max(...scores.values());
  const probabilities = new Map<SnipLabel, number>();
  let total = 0;

  for (const [label, score] of scores.entries()) {
    const value = Math.exp(score - maxScore);
    probabilities.set(label, value);
    total += value;
  }

  for (const [label, value] of probabilities.entries()) {
    probabilities.set(label, value / total);
  }
  return probabilities;
}
