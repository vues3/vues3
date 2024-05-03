import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const additionalProperties = false;
const nullable = true;
const content = <const>{
  default: [{}],
  items: { $ref: "urn:jsonschema:view" },
  type: "array",
};
const properties = <const>{
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
};
const type = "object";

const plainData = (<const>{
  $id,
  additionalProperties,
  properties,
  type,
}) satisfies JSONSchema;

const Data = (<const>{
  $id,
  additionalProperties,
  properties: { content, ...properties },
  type,
}) satisfies JSONSchema;

export { plainData };
export default Data;
