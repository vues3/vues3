import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import { flatConfigs } from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginVue from "eslint-plugin-vue";
import tseslint, { configs, parser } from "typescript-eslint";
import vueParser from "vue-eslint-parser";
const compat = new FlatCompat();
export default tseslint.config(
  { ignores: ["**/dist", "**/.quasar", "**/language-configs.ts"] },
  {
    rules: {
      "@typescript-eslint/no-use-before-define": ["error", "nofunc"],
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/quasar.config.ts", "**/eslint.config.ts"],
          optionalDependencies: false,
          whitelist: ["electron"],
        },
      ],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        extraFileExtensions: [".vue"],
        parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...compat.extends("plugin:vue-pug/vue3-recommended"),
  eslint.configs.recommended,
  flatConfigs.recommended,
  flatConfigs.typescript,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  ...pluginVue.configs["flat/recommended"],
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettierRecommended,
);
