const WORDS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];

export function ordinalWord(n: number): string {
  if (n >= 1 && n <= WORDS.length) return WORDS[n - 1];
  return `${n}th`;
}
