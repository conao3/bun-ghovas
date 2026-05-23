import { describe, test, expect, beforeEach, vi } from "vitest";
import { loadHistory, recordVisit } from "../../src/web/lib/iframeUrlHistory";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
});

describe("loadHistory", () => {
  test("returns empty array when storage is empty", () => {
    expect(loadHistory()).toEqual([]);
  });

  test("returns empty array when storage value is invalid JSON", () => {
    store.set("ghovas.iframe-url-history", "not-json");
    expect(loadHistory()).toEqual([]);
  });

  test("returns empty array when storage value is not an array", () => {
    store.set("ghovas.iframe-url-history", JSON.stringify({ url: "https://example.com" }));
    expect(loadHistory()).toEqual([]);
  });

  test("returns stored URLs", () => {
    store.set(
      "ghovas.iframe-url-history",
      JSON.stringify(["https://example.com", "https://foo.dev"]),
    );
    expect(loadHistory()).toEqual(["https://example.com", "https://foo.dev"]);
  });
});

describe("recordVisit", () => {
  test("saves a URL to history", () => {
    recordVisit("https://example.com");
    expect(loadHistory()).toEqual(["https://example.com"]);
  });

  test("prepends new URL to the front", () => {
    recordVisit("https://first.com");
    recordVisit("https://second.com");
    expect(loadHistory()).toEqual(["https://second.com", "https://first.com"]);
  });

  test("moves duplicate URL to the front (LRU)", () => {
    recordVisit("https://a.com");
    recordVisit("https://b.com");
    recordVisit("https://a.com");
    expect(loadHistory()).toEqual(["https://a.com", "https://b.com"]);
  });

  test("drops oldest entry when limit of 10 is exceeded", () => {
    for (let i = 1; i <= 10; i++) {
      recordVisit(`https://site${i}.com`);
    }
    expect(loadHistory()).toHaveLength(10);
    expect(loadHistory()[0]).toBe("https://site10.com");
    expect(loadHistory()[9]).toBe("https://site1.com");

    recordVisit("https://site11.com");
    const history = loadHistory();
    expect(history).toHaveLength(10);
    expect(history[0]).toBe("https://site11.com");
    expect(history.includes("https://site1.com")).toBe(false);
  });
});
