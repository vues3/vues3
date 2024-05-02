const $id = "urn:jsonschema:resource";
const additionalProperties = false;
const id = "uuid";
const dynamicDefaults = { id };
const properties = <const>{
  id: { type: "string" },
  url: { type: "string", default: "" },
  enabled: { type: "boolean", default: true },
  contenteditable: { type: "boolean", default: false },
};
const type = "object";

/** Схема ресурсных записей */
const Resource = <const>{
  $id,
  dynamicDefaults,
  type,
  properties,
  additionalProperties,
};

export default Resource;
