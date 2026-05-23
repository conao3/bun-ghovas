import { describe, test, expect } from "vitest";
import { normalizeUrl } from "../../src/web/lib/normalizeUrl";

describe("normalizeUrl", () => {
  test("scheme なしは https:// を補完する", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  test("https:// は維持する", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  test("http:// は維持する", () => {
    expect(normalizeUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  test("protocol-relative (//) は https: を補完する", () => {
    expect(normalizeUrl("//cdn.example.com")).toBe("https://cdn.example.com");
  });

  test("空文字はそのまま空文字を返す", () => {
    expect(normalizeUrl("")).toBe("");
  });

  test("空白だけの文字列は trim 後に空文字を返す", () => {
    expect(normalizeUrl("   ")).toBe("");
  });

  test("前後の空白は trim する", () => {
    expect(normalizeUrl(" example.com ")).toBe("https://example.com");
  });

  test("大文字 scheme も case-insensitive で検出する", () => {
    expect(normalizeUrl("HTTPS://EXAMPLE.COM")).toBe("HTTPS://EXAMPLE.COM");
  });
});
