import { nationalities } from "@/app/constants";

/**
 * The Manatal nationality id a stored answer stands for, as a string, or "" if
 * it cannot be told.
 *
 * The form used to store the demonym and let the submit route search Manatal
 * for it, taking the first hit. Manatal's search is fuzzy and several demonyms
 * are shared, so "Guinean" was filed as Equatorial Guinean, "Samoan" as
 * American Samoan, and every Congolese candidate under DR Congo -- accepted,
 * with nothing to say it had gone wrong. The form stores the id now; the ids
 * in `nationalities` are Manatal's own (checked against its list, 2026-09-28).
 *
 * A demonym still arrives from a draft saved before that change, or from a tab
 * running the old build. It is resolved only when exactly one nationality
 * carries it; a shared one ("Dominican", "Congolese") resolves to "", so the
 * candidate picks again rather than being filed under a guess.
 */
export function toNationalityId(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";

  if (/^\d+$/.test(text)) {
    return nationalities.some((n) => String(n.id) === text) ? text : "";
  }

  const matches = nationalities.filter((n) => n.demonym.toLowerCase() === text.toLowerCase());
  return matches.length === 1 ? String(matches[0].id) : "";
}
