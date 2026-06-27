# SNIP Model Card

## Model

- Name: Small N-gram Identifier for Pastes (SNIP)
- Package version: `1.0.0`
- Model version: `snip-109`
- Model file: `model/snip_model.json`
- Runtime source: `src/snip.ts`
- Published runtime: `dist/snip.js`

## Intended Use

SNIP predicts a likely syntax or text label for pasted text, snippets, logs, configuration files, and text-like source files. It is designed for browser-local inference in applications where sending pasted content to a server is undesirable. It aims to be quick, small in size, and fairly accurate.

## Labels

`bash`, `c`, `cpp`, `csharp`, `css`, `csv`, `diff`, `dockerfile`, `go`, `html`, `ini`, `java`, `javascript`, `json`, `log`, `lua`, `markdown`, `php`, `plain_text`, `powershell`, `python`, `ruby`, `rust`, `sql`, `toml`, `typescript`, `xml`, `yaml`.

## Architecture

- Multiclass linear classifier
- Hashed character n-grams, length 1-5
- 32,768 hash buckets
- L2-normalized `log1p(count)` features
- 1,500 retained weights per label
- 4-decimal serialized weights
- TypeScript source with no runtime dependencies

## Size

- Raw model JSON: 626,596 bytes
- Gzip model JSON: 203,820 bytes

## Performance

Measured in Google Chrome 149.0.7827.116 on macOS:

| Input size | Sampled chars | P50 ms | P95 ms |
| --- | ---: | ---: | ---: |
| 1 KB | 1,024 | 1.490 | 1.548 |
| 16 KB | 16,384 | 6.580 | 6.730 |
| 100 KB | 12,292 | 5.180 | 5.310 |
| 1 MB | 12,292 | 5.170 | 5.310 |
| 5 MB | 12,292 | 5.210 | 5.380 |

## Metrics

| Evaluation Set | Examples | Accuracy | Macro F1 |
| --- | ---: | ---: | ---: |
| Validation | 487 | 1.0000 | 1.0000 |
| Test | 532 | 0.9962 | 0.9926 |
| Hard cases | 148 | 0.9932 | 0.6905 |
| Development holdouts | 207 | 0.9903 | - |
| Regression holdouts | 196 | 0.9796 | - |
| Final mixed holdout | 56 | 0.9821 | 0.9810 |

## Limitations

- Optimized for text, not binary file identification.
- Very short snippets may lack enough evidence for a specific syntax label.
- TypeScript and JavaScript can be close when a snippet has no type syntax.
- JSONL application logs can be close to JSON.
- Markdown/plain-text separation can be weak on very short prose-like Markdown.

## Training Notes

The training corpus combines generated structured text, curated programming examples, realistic local files, and targeted hard-neighbor examples.
