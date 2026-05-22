import { describe, test, expect } from "bun:test";
import { createRingBuffer } from "../../src/server/ringBuffer.js";

describe("createRingBuffer", () => {
  test("empty buffer returns [] and byteLength 0", () => {
    const buf = createRingBuffer(1024);
    expect(buf.snapshot()).toEqual([]);
    expect(buf.byteLength()).toBe(0);
  });

  test("append below cap: byteLength matches sum, snapshot in insertion order", () => {
    const buf = createRingBuffer(1024);
    const a = Buffer.from("hello");
    const b = Buffer.from("world!");
    buf.append(a);
    buf.append(b);
    expect(buf.byteLength()).toBe(a.byteLength + b.byteLength);
    const snap = buf.snapshot();
    expect(snap.length).toBe(2);
    expect(snap[0]).toEqual(a);
    expect(snap[1]).toEqual(b);
  });

  test("append over cap drops oldest chunks", () => {
    const buf = createRingBuffer(100);
    const a = Buffer.alloc(40, 0x61);
    const b = Buffer.alloc(40, 0x62);
    const c = Buffer.alloc(40, 0x63);
    buf.append(a);
    buf.append(b);
    buf.append(c);
    // After third append: total was 120 > 100, so 'a' (40 bytes) is dropped
    expect(buf.byteLength()).toBe(80);
    const snap = buf.snapshot();
    expect(snap.length).toBe(2);
    expect(snap[0]).toEqual(b);
    expect(snap[1]).toEqual(c);
  });

  test("single chunk larger than cap is dropped (implementation matches pty.ts: newest-only chunk is also oldest, so it is shifted out)", () => {
    // pty.ts appendScrollback pushes the chunk then shifts until size <= cap.
    // When the only chunk exceeds cap, it is the oldest entry and gets shifted out.
    // Result: buffer is empty after appending a single oversize chunk.
    const buf = createRingBuffer(100);
    buf.append(Buffer.alloc(200, 0xff));
    expect(buf.byteLength()).toBe(0);
    expect(buf.snapshot()).toEqual([]);
  });

  test("clear empties buffer", () => {
    const buf = createRingBuffer(1024);
    buf.append(Buffer.from("foo"));
    buf.append(Buffer.from("bar"));
    buf.clear();
    expect(buf.snapshot()).toEqual([]);
    expect(buf.byteLength()).toBe(0);
  });
});
