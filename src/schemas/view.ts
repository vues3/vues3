import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:view";
const additionalProperties = false;
const nullable = true;
const id = "uuid";
const dynamicDefaults = { id };
const children = { default: [], items: { $ref: "#" }, type: "array" } as const;
const properties = {
  alt: {
    default: [],
    items: { type: "string" },
    type: "array",
  },
  changefreq: {
    default: null,
    enum: [
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
      null,
    ],
    nullable,
    type: "string",
  },
  class: {
    default: [],
    description: "Классы",
    items: { type: "string" },
    type: "array",
  },
  contenteditable: { default: false, type: "boolean" },
  description: { default: null, nullable, type: "string" },
  enabled: { default: true, type: "boolean" },
  header: { default: null, nullable, type: "string" },
  icon: { default: null, nullable, type: "string" },
  id: { type: "string" },
  image: {
    default: [],
    items: { type: "string" },
    type: "array",
  },
  keywords: {
    default: [],
    items: { type: "string" },
    type: "array",
  },
  lastmod: { default: null, nullable, type: "string" },
  loc: { default: null, nullable, type: "string" },
  name: { default: null, nullable, type: "string" },
  priority: { default: null, maximum: 1, minimum: 0, nullable, type: "number" },
  scoped: { default: true, type: "boolean" },
  setup: { default: true, type: "boolean" },
  type: {
    default: null,
    enum: [
      "article",
      "book",
      "profile",
      "website",
      "music.song",
      "music.album",
      "music.playlist",
      "music.radio_station",
      "video.movie",
      "video.episode",
      "video.tv_show",
      "video.other",
      null,
    ],
    nullable,
    type: "string",
  },
} as const;
const type = "object";

export const plainView = {
  $id,
  additionalProperties,
  properties,
  type,
} as const satisfies JSONSchema;

export default {
  $id,
  additionalProperties,
  dynamicDefaults,
  properties: { children, ...properties },
  type,
} as const;
