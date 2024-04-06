require("@rushstack/eslint-patch/modern-module-resolution");

const path = require("node:path");
const createAliasSetting = require("@vue/eslint-config-airbnb/createAliasSetting");

module.exports = {
  // Rules order is important, please avoid shuffling them
  extends: [
    "plugin:vue/vue3-recommended",
    "plugin:vue-pug/vue3-recommended",
    "@vue/eslint-config-airbnb-with-typescript",
    "@vue/eslint-config-airbnb-with-typescript/allow-js-in-vue",
    "plugin:jsdoc/recommended",
    "plugin:sonarjs/recommended",
    "plugin:optimize-regex/recommended",
    "plugin:regexp/recommended",
    "@vue/eslint-config-prettier",
  ],

  plugins: ["simple-import-sort"],

  // add your custom rules here
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "jsdoc/tag-lines": 0,
    "jsdoc/require-jsdoc": [
      "error",
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ClassExpression: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true,
        },
      },
    ],
    // allow debugger during development only
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
  },
  settings: {
    ...createAliasSetting({
      "@": [
        `${path.resolve(__dirname, "./src")}`,
        `${path.resolve(__dirname, "./monolit/src")}`,
      ],
      "~": `${path.resolve(__dirname, ".")}`,
    }),
  },
};
