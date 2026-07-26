// Flat ESLint config (ESLint 9). Replaces the legacy .eslintrc.json + `next lint`,
// which Next 16 removed. `eslint-config-next/core-web-vitals` ships a flat-config array.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ["components/ui/dropzone.tsx", ".next/**", ".generated/**", "node_modules/**"],
  },
  {
    // Next 16's config promotes the React Compiler hook rules to errors. This project doesn't use
    // the React Compiler, and these rules fire mostly on vendored shadcn UI, so turn them off.
    // The classic, useful exhaustive-deps stays on (as a warning).
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]

export default config
