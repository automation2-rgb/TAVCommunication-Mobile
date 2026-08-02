/** Deterministic string hash — keep in sync with web contact/inbox hashing. */
export function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

export function hashIndex(input: string, modulus: number): number {
  if (modulus <= 0) {
    return 0;
  }
  return hashString(input.trim().toLowerCase()) % modulus;
}
