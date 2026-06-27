import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const modelJson = readFileSync("model/snip_model.json", "utf8").trim();
const source = `import type { SnipModel } from "./snip.js";

const model = ${modelJson} as SnipModel;

export default model;
`;

mkdirSync("src", { recursive: true });
writeFileSync("src/model-data.ts", source);
