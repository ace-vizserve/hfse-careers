# Archived routes

Next.js ignores folders prefixed with `_`, so nothing in here is routed or
bundled — the code is kept only for reference.

## talents

`/talents` as it shipped with the starter: six identical hardcoded "Lebron
James" coach cards, a `talents` state array nothing ever writes to, and search,
filter and pagination controls wired to nothing. No page linked to it. Its
image is still at `public/assets/lebron.png`.

Restore by moving the folder back to `app/talents`, but it needs real data and a
pass on the design system first — it is on the old marketing palette.
