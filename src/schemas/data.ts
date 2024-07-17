import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const additionalProperties = false;
const content = {
  default: [{}],
  items: { $ref: "urn:jsonschema:view" },
  type: "array",
} as const;
const properties = {
  settings: { $ref: "urn:jsonschema:settings", default: {}, type: "object" },
} as const;
const type = "object";
const plainData = {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;
const Data = {
  $id,
  additionalProperties,
  properties: { content, ...properties },
  type,
} as const satisfies JSONSchema;
export { plainData };
export default Data;
