import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:importmap";
const additionalProperties = false;
const properties = {
  imports: {
    additionalProperties: { type: "string" },
    default: {},
    type: "object",
  },
} as const;
const type = "object";

export default {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;
