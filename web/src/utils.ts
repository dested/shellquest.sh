export function safeObjectEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
export function safeObjectValues<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

export function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function unreachable(x: never): never {
  throw new Error('unreachable');
}
export function groupBy<T, TKey extends string | number>(
  arr: T[],
  callback: (el: T) => TKey,
): Array<{
  key: TKey;
  items: T[];
}> {
  const groups: Record<TKey, T[]> = {} as any;

  arr.forEach((el) => {
    const key = callback(el);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(el);
  });

  return Object.entries(groups).map(([key, items]) => ({key, items})) as any;
}
