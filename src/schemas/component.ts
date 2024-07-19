import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:component";
const additionalProperties = false;
const properties = {
  script: {
    default: "",
    type: "string",
  },
  style: {
    default: "",
    type: "string",
  },
  template: {
    default: "",
    type: "string",
  },
} as const;
const type = "object";

export default {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;
