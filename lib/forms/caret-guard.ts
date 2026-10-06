import type { CompositionEvent, FocusEvent, FormEvent, KeyboardEvent, MouseEvent } from "react";

/**
 * Puts back a letter a phone keyboard dropped at the start of the box.
 *
 * On some Android phones the cursor in a reference's Name or Relationship
 * jumped back to the start after every letter, so "Friend" reached Manatal as
 * "dneirF" -- nine candidates between June and October 2026. Whatever moves
 * the cursor, the shape is the same: the candidate was adding to the end, and
 * the new text landed in front of everything they had typed. This moves it to
 * the end and the cursor with it, which also tells the keyboard where the
 * cursor really is.
 *
 * It only steps in for that shape. A candidate who taps or arrows to the start
 * on purpose has moved the cursor themselves, and is left alone.
 */

type GuardState = { value: string; appending: boolean };

const states = new WeakMap<HTMLInputElement, GuardState>();

const CARET_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);

const caretAtEnd = (el: HTMLInputElement) => el.selectionStart === el.value.length && el.selectionEnd === el.value.length;

/**
 * Where the candidate put the cursor. Read at once, on the event that placed
 * it: a read deferred to the next frame could land after the cursor had already
 * been thrown to the start, and mistake that for the candidate's own move.
 */
const recordCursor = (el: HTMLInputElement) => states.set(el, { value: el.value, appending: caretAtEnd(el) });

export function caretGuard(onRepair: (value: string) => void) {
  const check = (el: HTMLInputElement) => {
    const before = states.get(el);
    const now = el.value;

    if (
      before?.appending &&
      before.value &&
      now.length > before.value.length &&
      now.endsWith(before.value) &&
      !now.startsWith(before.value)
    ) {
      const repaired = before.value + now.slice(0, now.length - before.value.length);
      el.value = repaired;
      el.setSelectionRange(repaired.length, repaired.length);
      onRepair(repaired);
    }

    // Anything else is taken as the candidate's own edit. Whether they are still
    // working at the end -- typing on, or backspacing a typo -- is judged by the
    // edit, not by where the cursor sits now: the cursor may already have been
    // thrown back to the start by the time this runs.
    const previous = before?.value ?? "";
    states.set(el, { value: el.value, appending: el.value.startsWith(previous) || previous.startsWith(el.value) });
  };

  return {
    onFocus: (event: FocusEvent<HTMLInputElement>) => recordCursor(event.currentTarget),
    // A click or tap has placed the cursor by the time it fires.
    onClick: (event: MouseEvent<HTMLInputElement>) => recordCursor(event.currentTarget),
    onKeyUp: (event: KeyboardEvent<HTMLInputElement>) => {
      if (CARET_KEYS.has(event.key)) recordCursor(event.currentTarget);
    },
    // Mid-word on an Android keyboard the text is still being composed; it is
    // checked once the word is committed, never while the keyboard holds it.
    onInput: (event: FormEvent<HTMLInputElement>) => {
      if (!(event.nativeEvent as InputEvent).isComposing) check(event.currentTarget);
    },
    onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => check(event.currentTarget),
  };
}
