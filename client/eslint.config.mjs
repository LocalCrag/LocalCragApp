import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["projects/**/*"]), {
    files: ["**/*.ts"],

    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
    ),

    rules: {
        "@angular-eslint/prefer-standalone": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "no-unused-vars": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
        }],

        "no-control-regex": "off",

        "@angular-eslint/directive-selector": ["error", {
            type: "attribute",
            prefix: "lc",
            style: "camelCase",
        }],

        "@angular-eslint/component-selector": ["error", {
            type: "element",
            prefix: "lc",
            style: "kebab-case",
        }],
    },
}, {
    files: ["**/*.html"],

    extends: compat.extends(
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility",
    ),

    rules: {
        "@angular-eslint/template/label-has-associated-control": "off",
        "@angular-eslint/template/click-events-have-key-events": "off",
    },
}]);