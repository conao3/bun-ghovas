import { describe, test, expect } from "vitest";
import { parseEnv } from "../../src/web/lib/parseEnv";

describe("parseEnv", () => {
  test("単一行 FOO=bar → { FOO: 'bar' }", () => {
    expect(parseEnv("FOO=bar")).toEqual({ FOO: "bar" });
  });

  test("複数行 FOO=bar\\nBAZ=qux → 2 件", () => {
    expect(parseEnv("FOO=bar\nBAZ=qux")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  test("空行は無視する", () => {
    expect(parseEnv("\nFOO=bar\n\n")).toEqual({ FOO: "bar" });
  });

  test("空 key は無視する", () => {
    expect(parseEnv("=value")).toEqual({});
  });

  test("= 無しは無視する", () => {
    expect(parseEnv("NOEQ")).toEqual({});
  });

  test("= を含む値 URL=https://example.com?a=1 → そのまま", () => {
    expect(parseEnv("URL=https://example.com?a=1")).toEqual({
      URL: "https://example.com?a=1",
    });
  });
});
