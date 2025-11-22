import { defineConfig } from "eslint/config";

import { baseConfig } from "@acme/eslint-config/base";

export default defineConfig(
  {
    ignores: ["typechain-types/**", "ignition/**", "test/**"],
  },
  baseConfig,
);
