import { describe, test, expect } from "bun:test";
import { matchesShortcut, formatShortcut } from "../../src/web/lib/shortcuts";
import type { ShortcutDef } from "../../src/web/lib/shortcuts";

const def: ShortcutDef = {
  id: "test",
  label: "Test",
  mod: true,
  shift: false,
  alt: false,
  key: "k",
};

function makeEvent(
  overrides: Partial<Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "shiftKey" | "altKey" | "key">>,
): KeyboardEvent {
  return {
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    key: "k",
    ...overrides,
  } as KeyboardEvent;
}

describe("matchesShortcut", () => {
  test("exact match returns true", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: true }), def)).toBe(true);
  });

  test("mod: true is satisfied by ctrlKey alone", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: true, metaKey: false }), def)).toBe(true);
  });

  test("mod: true is satisfied by metaKey alone", () => {
    expect(matchesShortcut(makeEvent({ metaKey: true, ctrlKey: false }), def)).toBe(true);
  });

  test("key comparison is case-insensitive", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: true, key: "K" }), def)).toBe(true);
  });

  test("mismatch when key differs", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: true, key: "j" }), def)).toBe(false);
  });

  test("mismatch when required modifier is absent", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: false, metaKey: false }), def)).toBe(false);
  });

  test("mismatch when extra shift modifier is pressed", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: true, shiftKey: true }), def)).toBe(false);
  });

  test("mismatch when extra alt modifier is pressed", () => {
    expect(matchesShortcut(makeEvent({ ctrlKey: true, altKey: true }), def)).toBe(false);
  });
});

describe("formatShortcut", () => {
  test("returns a non-empty string containing the key in uppercase", () => {
    const result = formatShortcut(def);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(def.key.toUpperCase());
  });
});
