import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "ghovas",
    identifier: "com.conao3.ghovas",
    version: "0.0.0",
    description: "Browser-native window manager that arranges terminal windows on an infinite canvas",
  },
  build: {
    bun: {
      entrypoint: "src/native/main.ts",
    },
    buildFolder: "dist-native",
  },
} satisfies ElectrobunConfig;
