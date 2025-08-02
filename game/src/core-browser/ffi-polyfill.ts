
export const dlopen=123
export const suffix=123
export type Pointer=123
export const toArrayBuffer=(ptr: Pointer, size: number): Uint8Array => {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < size; i++) {
    view[i] = (ptr as unknown as Uint8Array)[i];
  }
  return view;
}
