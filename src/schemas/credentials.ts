import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:credentials";
const nullable = true;
const additionalProperties = {
  properties: {
    Bucket: { default: "", type: "string" },
    accessKeyId: { default: null, nullable, type: "string" },
    endpoint: { default: "", type: "string" },
    region: { default: "", type: "string" },
    secretAccessKey: { default: null, nullable, type: "string" },
  },
  type: "object",
} as const;
const type = "object";

export default {
  $id,
  additionalProperties,
  type,
} as const satisfies JSONSchema;
