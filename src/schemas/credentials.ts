import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:credentials";
const nullable = true;
const additionalProperties = {
  properties: {
    Bucket: { default: "", type: "string" },
    accessKeyId: { default: "", type: "string" },
    endpoint: { default: null, nullable, type: "string" },
    region: { default: null, nullable, type: "string" },
    secretAccessKey: { default: "", type: "string" },
  },
  type: "object",
} as const;
const type = "object";

export default {
  $id,
  additionalProperties,
  type,
} as const satisfies JSONSchema;
