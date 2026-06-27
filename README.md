# SNIP (Small N-gram Identifier for Pastes)

SNIP is a small browser-local classifier for pasted text and source snippets.

SNIP predicts a likely syntax or text label for pasted text, snippets, logs, configuration files, and text-like source files. It is designed for browser-local inference in applications where sending pasted content to a server is undesirable. It aims to be quick, small in size, and fairly accurate.

## Links

- Website/demo: <https://snip.wesring.com>
- GitHub: <https://github.com/wesr/snip>
- Hugging Face: <https://huggingface.co/wesringml/snip>
- npm: <https://www.npmjs.com/package/@wesr/snip>

## Release Contents

- `model/snip_model.json` - source model weights used to generate the embedded runtime model
- `src/snip.ts` - dependency-free TypeScript source runtime
- `dist/snip.js` - compiled JavaScript runtime
- `dist/snip.d.ts` - TypeScript declarations
- `examples/node-example.mjs` - minimal Node usage example
- `docs/index.html` - browser demo page
- `metrics/` - evaluation metrics copied from the release candidate
- `MODEL_CARD.md` - concise model card
- `REPORT.md` - technical report

## Quick Start

Install the package:

```sh
npm install @wesr/snip
```

```js
import { classifyText } from "@wesr/snip";

const result = classifyText(`from fastapi import FastAPI

app = FastAPI()

@app.get("/notes/{note_id}")
def read_note(note_id: int):
    return {"note_id": note_id}
`);
console.log(result.label);
```

## API

### `classifyText(text)`

Classifies a string using the embedded SNIP model.

```ts
interface ClassificationResult {
  label: SnipLabel;
  predicted_label: SnipLabel;
  confidence: number;
  margin: number;
  alternatives: Array<[SnipLabel, number]>;
}
```

- `label` is the accepted label after any configured fallback thresholds.
- `predicted_label` is the highest-scoring raw prediction.
- `confidence` is the score assigned to the winning label.
- `margin` is the gap between the winning label and the runner-up. Larger margins generally indicate a clearer classification.
- `alternatives` contains the top five labels and scores.

### `classifyTextAsync(text)`

Yields once before classifying, which gives browser UI code an awaitable API and a chance to paint before SNIP runs.

```ts
import { classifyTextAsync } from "@wesr/snip";

const result = await classifyTextAsync("package main\n\nfunc main() {}\n");
```

### `sampleText(text)`

Applies the model's bounded sampling strategy. Inputs up to 16 KiB are classified whole; larger inputs are represented by start, middle, and end windows.

## Labels

The release model predicts:

`bash`, `c`, `cpp`, `csharp`, `css`, `csv`, `diff`, `dockerfile`, `go`, `html`, `ini`, `java`, `javascript`, `json`, `log`, `lua`, `markdown`, `php`, `plain_text`, `powershell`, `python`, `ruby`, `rust`, `sql`, `toml`, `typescript`, `xml`, `yaml`.

## Size

- Raw model JSON: 626,596 bytes
- Gzip model JSON: 203,820 bytes

The runtime is written in TypeScript and has no runtime package dependencies.

## License

SNIP is released under the BSD 3-Clause License. See `LICENSE`.
