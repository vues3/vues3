import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:data";
const items = { $ref: "urn:jsonschema:page" };
const type = "array";
export default {
  $id,
  items,
  type,
} as const satisfies JSONSchema;
