export function isObject<T extends Record<string, unknown>>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function isArray<T extends any[]>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Array]';
}

export function isFile<T extends File>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object File]';
}

export function isBlob<T extends Blob>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object Blob]';
}

export function isArrayBuffer<T extends ArrayBuffer>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object ArrayBuffer]';
}

export function isArrayBufferView<T extends ArrayBufferView>(value: T | unknown): value is T {
  return Object.prototype.toString.call(value) === '[object ArrayBufferView]';
}
