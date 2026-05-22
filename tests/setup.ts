import { readFile, writeFile } from "node:fs/promises";

globalThis.Bun = {
  file: (path: string) => ({
    text: () => readFile(path, "utf-8"),
  }),
  write: (path: string, data: string) => writeFile(path, data),
} as typeof Bun;
