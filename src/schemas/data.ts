import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const additionalProperties = false;
const nullable = true;
const content = {
  default: [{}],
  items: { $ref: "urn:jsonschema:view" },
  type: "array",
} as const;
const properties = {
  css: {
    default: [{}],
    items: { $ref: "urn:jsonschema:resource" },
    type: "array",
  },
  js: {
    default: [{}],
    items: { $ref: "urn:jsonschema:resource" },
    type: "array",
  },
  navbar: {
    $ref: "urn:jsonschema:navbar",
    default: {},
    nullable,
    type: "object",
  },
  script: { default: "", nullable, type: "string" },
  settings: {
    $ref: "urn:jsonschema:settings",
    default: {},
    nullable,
    type: "object",
  },
  style: { default: "", nullable, type: "string" },
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
