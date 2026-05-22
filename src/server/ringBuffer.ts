export interface RingBuffer {
  append(chunk: Buffer): void;
  snapshot(): Buffer[];
  byteLength(): number;
  clear(): void;
}

export function createRingBuffer(capBytes: number): RingBuffer {
  const chunks: Buffer[] = [];
  let size = 0;

  return {
    append(chunk: Buffer) {
      chunks.push(chunk);
      size += chunk.byteLength;
      while (size > capBytes && chunks.length > 0) {
        const dropped = chunks.shift()!;
        size -= dropped.byteLength;
      }
    },
    snapshot(): Buffer[] {
      return chunks.slice();
    },
    byteLength(): number {
      return size;
    },
    clear() {
      chunks.length = 0;
      size = 0;
    },
  };
}
