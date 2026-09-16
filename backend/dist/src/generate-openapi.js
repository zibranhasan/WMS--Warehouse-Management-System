import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { generateOpenApiDocument } from "./app/openapi/index.js";
const docsDir = resolve(process.cwd(), "docs");
mkdirSync(docsDir, { recursive: true });
const spec = generateOpenApiDocument();
const outputPath = resolve(docsDir, "openapi.json");
writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
console.log(`OpenAPI spec written to ${outputPath}`);
