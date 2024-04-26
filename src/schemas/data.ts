import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const additionalProperties = false;
const nullable = true;
const content = {
  type: "array",
  default: [{}],
  items: { $ref: "urn:jsonschema:view" },
} as const;
const properties = {
  settings: {
    type: "object",
    nullable,
    $ref: "urn:jsonschema:settings",
    default: {},
  },
  style: { nullable, type: "string", default: "" },
  script: { nullable, type: "string", default: "" },
  css: {
    nullable,
    type: "array",
    default: [{}],
    items: { $ref: "urn:jsonschema:resource" },
  },
  js: {
    nullable,
    type: "array",
    default: [{}],
    items: { $ref: "urn:jsonschema:resource" },
  },
  navbar: {
    type: "object",
    nullable,
    $ref: "urn:jsonschema:navbar",
    default: {},
  },
} as const;
const type = "object";

const plainData = {
  $id,
  type,
  properties,
  additionalProperties,
} as const satisfies JSONSchema;

const Data = {
  $id,
  type,
  properties: { content, ...properties },
  additionalProperties,
} as const satisfies JSONSchema;

export { plainData };
export default Data;
