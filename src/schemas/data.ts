import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const additionalProperties = false;
const properties = {
  content: {
    default: [{}],
    items: { $ref: "urn:jsonschema:view" },
    type: "array",
  },
} as const;
const type = "object";
export default {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;
