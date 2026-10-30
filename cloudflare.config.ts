import { defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    name: "kjg-rebland",
    compatibilityDate: "2026-09-21",
    observability: { enabled: true },
    assets: {
      htmlHandling: "auto-trailing-slash",
      notFoundHandling: "404-page",
    },
  },
});
