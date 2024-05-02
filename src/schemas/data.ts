import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const additionalProperties = false;
const nullable = true;
const content = <const>{
  type: "array",
  default: [{}],
  items: { $ref: "urn:jsonschema:view" },
};
const properties = <const>{
  settings: {
    type: "object",
    nullable,
    $ref: "urn:jsonschema:settings",
    default: {},
  },
  style: { nullable, type: "string", default: "" },
  script: { nullable, type: "string", default: "" },
  css: {
    type: "array",
    default: [{}],
    items: { $ref: "urn:jsonschema:resource" },
  },
  js: {
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
};
const type = "object";

const plainData = (<const>{
  $id,
  type,
  properties,
  additionalProperties,
}) satisfies JSONSchema;

const Data = (<const>{
  $id,
  type,
  properties: { content, ...properties },
  additionalProperties,
}) satisfies JSONSchema;

export { plainData };
export default Data;
