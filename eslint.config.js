import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
import prettier from "eslint-config-prettier";
export default ts.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "android/**",
      "ios/**",
      "src-tauri/target/**",
      ".npm-cache/**",
      "reports/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  prettier,
);
