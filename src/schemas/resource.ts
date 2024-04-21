import { additionalProperties, type } from "app/src/stores/defaults";

const $id = "urn:jsonschema:resource";
const id = "uuid";
const dynamicDefaults = { id };
const properties = {
  id: { type: "string" },
  url: { type: "string", default: "" },
  enabled: { type: "boolean", default: true },
  contenteditable: { type: "boolean", default: false },
} as const;
export default {
  $id,
  dynamicDefaults,
  type,
  properties,
  additionalProperties,
} as const;
