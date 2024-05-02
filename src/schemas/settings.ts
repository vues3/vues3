import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:settings";
const additionalProperties = false;
const nullable = true;
const properties = <const>{
  yandex: { type: "string", nullable, default: null },
  metrika: { type: "string", nullable, default: null },
  google: { type: "string", nullable, default: null },
  analytics: { type: "string", nullable, default: null },
  landing: { type: "boolean", default: true },
};
const type = "object";

export default (<const>{
  $id,
  type,
  properties,
  additionalProperties,
}) satisfies JSONSchema;
