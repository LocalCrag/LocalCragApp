// @ts-check
import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import angular from "angular-eslint";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "projects/**/*",
    "e2e/**/*",
    "playwright.config.ts",
    "playwright-report/**/*",
    "test-results/**/*",
  ]),
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "no-control-regex": "off",

      "no-console": ["error", { allow: ["warn", "error"] }],

      "@angular-eslint/prefer-on-push-component-change-detection": "off",

      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "lc",
          style: "camelCase",
        },
      ],

      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "lc",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["src/app/ui/**/*.ts"],
    rules: {
      "@angular-eslint/component-selector": "off",
      "@angular-eslint/directive-selector": "off",
      "@angular-eslint/no-input-rename": "off",
      "@angular-eslint/template/interactive-supports-focus": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/label-has-associated-control": "off",
      "@angular-eslint/template/click-events-have-key-events": "off",
    },
  },
  {
    files: ["src/app/ui/**"],
    rules: {
      "@angular-eslint/template/interactive-supports-focus": "off",
    },
  },
]);
