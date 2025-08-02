export class Buffer {
  private data: Uint8Array;

  constructor(data: string | number | Uint8Array) {
    if (typeof data === 'string') {
      this.data = new TextEncoder().encode(data);
    } else if (typeof data === 'number') {
      this.data = new Uint8Array(data);
    } else {
      this.data = data;
    }
  }

  static isBuffer(obj: any): obj is Buffer {
    return obj instanceof Buffer;
  }

  static from(data: string | Uint8Array): Buffer {
    return new Buffer(data);
  }

  toString(): string {
    return new TextDecoder().decode(this.data);
  }

  get length(): number {
    return this.data.length;
  }

  [index: number]: number | undefined;

  static alloc(size: number): Buffer {
    return new Buffer(new Uint8Array(size));
  }
}
