import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:config";
const additionalProperties = false;
const properties = {
  content: {
    default: {},
    properties: {
      expanded: { default: [], items: { type: "string" }, type: "array" },
      selected: { type: "string" },
      tab: {
        default: "wysiwyg",
        enum: ["wysiwyg", "template", "script", "style"],
        type: "string",
      },
    },
    type: "object",
  },
  js: {
    default: {},
    properties: {
      selected: { type: "string" },
    },
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
