import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    // Codigo original del manual, guardado solo como referencia historica
    "docs/**",
  ]),

  {
    /**
     * `components/ui/**` lo genera la CLI de shadcn y se regenera con
     * `npm run ui:add`. Editarlo para contentar al linter significa perder los
     * cambios en la siguiente actualizacion, asi que las reglas nuevas de
     * react-hooks quedan como aviso solo en esa carpeta.
     */
    files: ["components/ui/**", "hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },

  {
    files: ["tests/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
])

export default eslintConfig
