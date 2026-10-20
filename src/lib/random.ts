export function secureRandomIndex(max: number): number {
  if (max <= 0) return -1;

  const values = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;

  let value = 0;
  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % max;
}

export function pickRandom<T>(list: T[]): T | null {
  if (list.length === 0) return null;
  const index = secureRandomIndex(list.length);
  return index >= 0 ? list[index] : null;
}
