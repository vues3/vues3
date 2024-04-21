import { additionalProperties, nullable, type } from "app/src/stores/defaults";
import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:settings";
const properties = {
  yandex: { type: "string", nullable, default: null },
  metrika: { type: "string", nullable, default: null },
  google: { type: "string", nullable, default: null },
  analytics: { type: "string", nullable, default: null },
  landing: { type: "boolean", default: true },
} as const;
export default {
  $id,
  type,
  properties,
  additionalProperties,
} as const satisfies JSONSchema;
