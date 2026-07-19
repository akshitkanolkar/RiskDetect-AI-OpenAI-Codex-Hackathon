const cache = new Map<string, RegExp>();

/** Compile once and reuse; avoids recompilation on every scan. */
export function cachedRegex(source: string, flags = "g"): RegExp {
  const key = `${flags}::${source}`;
  let re = cache.get(key);
  if (!re) {
    re = new RegExp(source, flags);
    cache.set(key, re);
  }
  // Always return a fresh instance so lastIndex is isolated per caller
  return new RegExp(re.source, re.flags);
}

export function clearRegexCache(): void {
  cache.clear();
}
