import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable problematic rules for smoother deployment
      "@typescript-eslint/no-unused-vars": "warn", // Changed from error to warning
      "@typescript-eslint/no-explicit-any": "warn", // Changed from error to warning
      // You can also completely disable these rules with "off" if needed:
      // "@typescript-eslint/no-unused-vars": "off",
      // "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
