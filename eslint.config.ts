import type { Linter } from "eslint";
import nextConfig from "eslint-config-next";

const config: Linter.FlatConfig[] = [
  ...nextConfig,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: null,
        sourceType: "module",
      },
    },
  },
];

export default config;

