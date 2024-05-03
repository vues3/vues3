import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:settings";
const additionalProperties = false;
const nullable = true;
const properties = {
  analytics: { default: null, nullable, type: "string" },
  google: { default: null, nullable, type: "string" },
  landing: { default: true, type: "boolean" },
  metrika: { default: null, nullable, type: "string" },
  yandex: { default: null, nullable, type: "string" },
} as const;
const type = "object";

export default {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;
