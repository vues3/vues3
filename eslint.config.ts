import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import type { Linter } from "eslint";

import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import eslintPluginImportX from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginVue from "eslint-plugin-vue";
import tseslint, { configs, parser } from "typescript-eslint";
import vueParser from "vue-eslint-parser";

import eslintrc from "./.eslintrc.json";

/* -------------------------------------------------------------------------- */

const compat = new FlatCompat(),
  extraFileExtensions = [".vue"],
  ignores = ["**/dist", "**/.quasar", "**/language-configs.ts"],
  projectService = true,
  tsconfigRootDir = import.meta.dirname,
  parserOptions = {
    extraFileExtensions,
    parser,
    projectService,
    tsconfigRootDir,
  },
  languageOptions = { parser: vueParser, parserOptions },
  rules: FlatConfig.Rules = {
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/no-use-before-define": "error",
    "import-x/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["**/quasar.config.ts", "**/eslint.config.ts"],
        optionalDependencies: false,
        whitelist: ["electron"],
      },
    ],
    "no-shadow": "off",
    "no-use-before-define": "off",
  };

/* -------------------------------------------------------------------------- */

export default tseslint.config(
  { ignores },
  { rules },
  { languageOptions },
  ...compat.config(eslintrc as Linter.LegacyConfig),
  eslint.configs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  ...pluginVue.configs["flat/strongly-recommended"],
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettierRecommended,
);
