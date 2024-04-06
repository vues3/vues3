import type { JSONSchema } from "json-schema-to-ts";

const $id = "urn:jsonschema:page";
const additionalProperties = false;
const nullable = true;
const type = "object";
const id = "uuid";
const dynamicDefaults = { id };
const children = { type: "array", default: [], items: { $ref: "#" } } as const;
const properties = {
  id: { type: "string" },
  changefreq: {
    type: "string",
    nullable,
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
  },
  description: { type: "string", nullable, default: null },
  icon: { type: "string", nullable, default: null },
  image: { type: "string", nullable, default: null },
  keywords: {
    type: "array",
    default: [],
    items: { type: "string" },
  },
  label: { type: "string", nullable, default: null },
  lastmod: { type: "string", nullable, default: null },
  loc: { type: "string", nullable, default: null },
  priority: { type: "number", nullable, default: null, minimum: 0, maximum: 1 },
  template: { type: "string", default: "" },
  script: { type: "string", default: "" },
  style: { type: "string", default: "" },
  theme: {
    type: "string",
    nullable,
    default: null,
    enum: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
      null,
    ],
  },
  title: { type: "string", nullable, default: null },
  visible: { type: "boolean", default: true },
  type: {
    type: "string",
    nullable,
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
  },
  alt: { type: "string", nullable, default: null },
  full: { type: "boolean", default: true },
  setup: { type: "boolean", default: true },
  scoped: { type: "boolean", default: true },
} as const;

export const plainPage = {
  $id,
  type,
  properties,
  additionalProperties,
} as const satisfies JSONSchema;

export default {
  $id,
  dynamicDefaults,
  type,
  properties: { children, ...properties },
  additionalProperties,
} as const;
