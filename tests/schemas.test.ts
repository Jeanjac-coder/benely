import { test } from "node:test";
import assert from "node:assert/strict";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { RecommendationsSchema } from "../lib/ai/recommendations.ts";
import { STEP_SCHEMAS } from "../lib/ai/schemas.ts";

test("chaque schéma d'étape se convertit en format de sortie structurée strict", () => {
  for (const [step, schema] of Object.entries({ ...STEP_SCHEMAS, recommendations: RecommendationsSchema })) {
    const json = JSON.stringify((betaZodOutputFormat(schema) as unknown as { schema: unknown }).schema);
    assert.ok(json.includes('"additionalProperties":false'), `${step}: objets non stricts`);
    assert.ok(!/"(minimum|maximum|minLength|maxLength)"/.test(json), `${step}: contrainte non supportée`);
  }
});
