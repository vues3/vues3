const $id = "urn:jsonschema:resource";
const additionalProperties = false;
const type = "object";
const id = "uuid";
const dynamicDefaults = { id };
const properties = {
  id: { type: "string" },
  url: { type: "string", default: "" },
  visible: { type: "boolean", default: true },
} as const;

/** Схема ресурсных записей */
const Resource = {
  $id,
  dynamicDefaults,
  type,
  properties,
  additionalProperties,
} as const;

export default Resource;
