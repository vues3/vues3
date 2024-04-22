import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:config";
const additionalProperties = false;
const properties = {
  content: {
    type: "object",
    default: {},
    properties: {
      tab: {
        type: "string",
        default: "wysiwyg",
        enum: ["wysiwyg", "template", "script", "style"],
      },
      selected: { type: "string" },
      expanded: { type: "array", default: [] },
    },
  },
  navbar: {
    type: "object",
    default: {},
    properties: {
      tab: {
        type: "string",
        default: "template",
        enum: ["template", "script", "style"],
      },
      selected: { type: "string" },
    },
  },
  js: {
    type: "object",
    default: {},
    properties: {
      tab: {
        type: "string",
        default: "script",
        enum: ["script", "js"],
      },
      selected: { type: "string" },
    },
  },
  css: {
    type: "object",
    default: {},
    properties: {
      tab: {
        type: "string",
        default: "style",
        enum: ["style", "css"],
      },
      selected: { type: "string" },
    },
  },
} as const;
const type = "object";
export default {
  $id,
  type,
  properties,
  additionalProperties,
} as const satisfies JSONSchema;
