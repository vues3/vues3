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
  css: {
    default: {},
    properties: {
      selected: { type: "string" },
      tab: {
        default: "style",
        enum: ["style", "css"],
        type: "string",
      },
    },
    type: "object",
  },
  js: {
    default: {},
    properties: {
      selected: { type: "string" },
      tab: {
        default: "script",
        enum: ["script", "js"],
        type: "string",
      },
    },
    type: "object",
  },
  navbar: {
    default: {},
    properties: {
      selected: { type: "string" },
      tab: {
        default: "template",
        enum: ["template", "script", "style"],
        type: "string",
      },
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
