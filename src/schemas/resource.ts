const $id = "urn:jsonschema:resource";
const additionalProperties = false;
const id = "uuid";
const dynamicDefaults = { id };
const properties = {
  id: { type: "string" },
  url: { type: "string", default: "" },
  enabled: { type: "boolean", default: true },
  contenteditable: { type: "boolean", default: false },
} as const;
const type = "object";

/** Схема ресурсных записей */
const Resource = {
  $id,
  dynamicDefaults,
  type,
  properties,
  additionalProperties,
} as const;

export default Resource;
