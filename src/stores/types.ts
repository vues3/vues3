import type { ValidateFunction } from "ajv";

import Ajv from "ajv";
import dynamicDefaults from "ajv-keywords/dist/definitions/dynamicDefaults";
import Component from "app/src/schemas/component";
import Config from "app/src/schemas/config";
import Credentials from "app/src/schemas/credentials";
import Data from "app/src/schemas/data";
import Importmap from "app/src/schemas/importmap";
import Page, { plainPage } from "app/src/schemas/page";
import {
  coerceTypes,
  esm,
  removeAdditional,
  useDefaults,
} from "app/src/stores/defaults";
import { FromSchema } from "json-schema-to-ts";
import uuid from "uuid-random";

export type TComponent = FromSchema<typeof Component>;
export type TPage = {
  $children?: TPage[];
  $index: number;
  $next?: TPage;
  $prev?: TPage;
  $siblings: TPage[];
  branch: TPage[];
  buffer?: TComponent;
  children?: TPage[];
  contenteditable: boolean;
  html: Promise<string> | string;
  i: string;
  index: number;
  next?: TPage;
  parent?: TPage;
  path: string;
  prev?: TPage;
  root: TPage;
  script: Promise<string> | string;
  sfc: Promise<TComponent>;
  siblings: TPage[];
  style: Promise<string> | string;
  template: Promise<string> | string;
  title: string;
  to: string;
} & FromSchema<typeof plainPage>;
dynamicDefaults.DEFAULTS.uuid = (): (() => string) => () => uuid();
const code = { esm };
export type TCredentials = FromSchema<typeof Credentials>;
export type TConfig = FromSchema<typeof Config>;
export type TImportmap = FromSchema<typeof Importmap>;
const schemas = [Config, Credentials, Page, Data, Component, Importmap];
const keywords = [dynamicDefaults()];
const ajv = new Ajv({
  code,
  coerceTypes,
  keywords,
  removeAdditional,
  schemas,
  useDefaults,
});
export const validatePage = ajv.getSchema(
  "urn:jsonschema:page",
) as ValidateFunction;
export const validateConfig = ajv.getSchema(
  "urn:jsonschema:config",
) as ValidateFunction;
export const validateComponent = ajv.getSchema(
  "urn:jsonschema:component",
) as ValidateFunction;
export const validateCredentials = ajv.getSchema(
  "urn:jsonschema:credentials",
) as ValidateFunction;
export const validateData = ajv.getSchema(
  "urn:jsonschema:data",
) as ValidateFunction;
export const validateImportmap = ajv.getSchema(
  "urn:jsonschema:importmap",
) as ValidateFunction;
