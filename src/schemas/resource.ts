const $id = "urn:jsonschema:resource";
const additionalProperties = false;
const id = "uuid";
const dynamicDefaults = { id };
const properties = <const>{
  contenteditable: { default: false, type: "boolean" },
  enabled: { default: true, type: "boolean" },
  id: { type: "string" },
  url: { default: "", type: "string" },
};
const type = "object";
const Resource = <const>{
  $id,
  additionalProperties,
  dynamicDefaults,
  properties,
  type,
};
export default Resource;
