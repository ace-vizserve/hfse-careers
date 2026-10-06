/**
 * Spots text a phone keyboard typed backwards.
 *
 * Some Android keyboards put the cursor back at the start of the box after
 * every letter, so "Friend" arrives as "dneirF". Nine candidates' references
 * reached Manatal like that between June and October 2026. Three shapes give
 * it away:
 *
 * - a capital at the end of a word ("dneirF", "efiW", "ronoeLE"), which is
 *   where a reversed word's first letter ends up;
 * - a common reference word spelled backwards ("eugaelloc", "reganam").
 *
 * Real names end in lower case, however their capitals fall inside: "McDonald",
 * "LeBlanc", and Burmese names written without spaces such as "PhyuPhyuMyint".
 * An all-capitals name is skipped. Checked against every reference on the
 * active jobs in October 2026: it flagged all eleven reversed applications and
 * nothing else.
 *
 * Only ever used for a warning the candidate can ignore, so a rare false
 * positive costs a second look, not a blocked application.
 */

const REFERENCE_WORDS = [
  "friend",
  "colleague",
  "coworker",
  "worker",
  "supervisor",
  "manager",
  "former",
  "teacher",
  "mentor",
  "boss",
  "pastor",
  "neighbour",
  "neighbor",
  "cousin",
  "classmate",
  "director",
  "principal",
  "employer",
  "relative",
  "brother",
  "sister",
  "mother",
  "father",
  "husband",
  "wife",
  "uncle",
  "lecturer",
  "professor",
  "tutor",
  "head",
];

const BACKWARDS_WORDS = new Set(REFERENCE_WORDS.map((word) => [...word].reverse().join("")));

export function looksGarbled(value: string | null | undefined): boolean {
  return String(value ?? "")
    .split(/[^A-Za-z]+/)
    .some((word) => {
      if (word.length < 4 || word === word.toUpperCase()) return false;

      const capitalAtEnd = /[a-z][A-Z]+$/.test(word);
      const backwardsWord = BACKWARDS_WORDS.has(word.toLowerCase());

      return capitalAtEnd || backwardsWord;
    });
}
