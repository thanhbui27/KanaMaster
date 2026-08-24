export function shuffleDataset<T>(values: readonly T[], random = Math.random) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function buildRandomSession<T>(
  values: readonly T[],
  options: { filter?: (value: T) => boolean; limit: number | "unlimited" },
) {
  const filtered = options.filter ? values.filter(options.filter) : [...values];
  const shuffled = shuffleDataset(filtered);
  return limitSession(shuffled, options.limit);
}

export function limitSession<T>(values: readonly T[], limit: number | "unlimited") {
  const size = limit === "unlimited" ? values.length : Math.min(limit, values.length);
  return [...values].slice(0, size);
}
