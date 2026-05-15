import { dirname } from "path"
import { fileURLToPath } from "url"
import { createRequire } from "module"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)
const { FlatCompat } = require("./node_modules/.pnpm/@eslint+eslintrc@3.3.5/node_modules/@eslint/eslintrc")

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "ios/**",
      "mobile/**",
      "node_modules/**",
      "out/**",
      "capacitor-www/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]

export default eslintConfig
