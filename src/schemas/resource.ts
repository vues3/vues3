const $id = "urn:jsonschema:resource";
const additionalProperties = false;
const id = "uuid";
const dynamicDefaults = { id };
const properties = {
  contenteditable: { default: false, type: "boolean" },
  enabled: { default: true, type: "boolean" },
  id: { type: "string" },
  name: { default: "", type: "string" },
} as const;
const type = "object";
const Resource = {
  $id,
  additionalProperties,
  dynamicDefaults,
  properties,
  type,
} as const;
export default Resource;
