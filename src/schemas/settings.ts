import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:settings";
const additionalProperties = false;
const nullable = true;
const properties = <const>{
  analytics: { default: null, nullable, type: "string" },
  google: { default: null, nullable, type: "string" },
  landing: { default: true, type: "boolean" },
  metrika: { default: null, nullable, type: "string" },
  yandex: { default: null, nullable, type: "string" },
};
const type = "object";

export default (<const>{
  $id,
  additionalProperties,
  properties,
  type,
}) satisfies JSONSchema;
