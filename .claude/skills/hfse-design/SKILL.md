---
name: hfse-design
description: The HFSE careers design system, extracted from the approved mockups. Load before restyling or building any UI in this repo — listings, job detail, apply form, or a new page — so the result matches the agreed design rather than drifting back to default Tailwind. Covers palette, type, radii, elevation, control sizing, and the exact markup for the header, search/filter row, cards, badges, form fields, stepper and section headers.
---

# HFSE careers design system

Source of truth: the approved canvas at `claude.ai/artifact/LRrENjxs7fLMHYUBfu3imr`
(boards: job listings, apply steps 1–4, job detail). Every value below was
measured from those artboards. When a value here and the mockup disagree, the
mockup wins — re-read it and update this file.

**Never** substitute a default Tailwind token (`slate-*`, `blue-600`,
`rounded-2xl`, `shadow-sm`) for a value in this file. Those defaults are what
the redesign was replacing.

## Palette

Use arbitrary-value classes (`bg-[#EFF1F6]`) — the repo has no token layer yet.

| Role | Hex | Where |
|---|---|---|
| Page ground | `#EFF1F6` | every page body |
| Surface | `#FFFFFF` | cards, panels, chrome bars |
| Sunken field | `#F5F6FA` | search input, inset inputs |
| Ink | `#10162B` | headings, primary text |
| Body | `#414A66` | paragraphs, list text |
| Muted | `#4A5273` | secondary lines, org names |
| Caption | `#6C7591` | labels, helper text, icon strokes |
| Disabled text | `#8A92AB` | inactive step titles |
| Brand navy (chrome) | `#1B2A8F` | header bar background |
| Primary | `#1E2FA8` | buttons, active borders, links |
| Primary top (gradient) | `#2A3CC4` | `linear-gradient(180deg,#2A3CC4,#1E2FA8)` |
| Primary deep | `#16217A` | dark panels, pressed |
| Primary tint | `#E7EAFB` | badge fill, step number wells |
| Primary tint border | `#D3D9F7` | badge border |
| Neutral tint | `#F2F4FA` | neutral badge fill |
| Border | `#D5DAE8` | input borders, outline buttons |
| Hairline | `#E1E5F0` / `#ECEFF7` / `#E3E6F0` / `#E4E7F1` | dividers, card borders |
| Required / error | `#C2410C` | required asterisk, error text |
| Success | `#10A56B` | completed step marker |
| Chrome text on navy | `#C3C9DC` | contact strip links, icons |

Brand accents from the crest — cyan `#55C9E7`, orange `#ED7622`, gold `#FFC220`
— are reserved for marketing surfaces. Do not introduce them into the product UI.

## Type

**Poppins only**, loaded once via `next/font` in `app/layout.tsx` as
`--font-poppins`. There is no second family and no runtime `@import`.

| Use | Size / weight / tracking |
|---|---|
| Page h1 (job title) | 28px / 700 / `-0.035em` |
| Panel h1 | 22px / 600 / `-0.03em` |
| Section h2 | 17px / 600 / `-0.02em` |
| Card title | 15px / 600 / `-0.015em` |
| Stepper step title | 15px / 600 |
| Body | 13–14px / 400, line-height 1.65–1.85 |
| Field label | 12px / 600 |
| Badge, caption, helper | 11–12px / 500 |
| Eyebrow label | 11px / 600 / `0.14em` / uppercase |

Headings are tight (negative tracking). Small uppercase labels are loose
(`0.14em`). Never letterspace body copy.

## Radii

`6px` badges · `7px` inputs and buttons · `8px` logo tiles · `10px` cards and
sub-cards · `12px` panels · `999px` **only** the stepper's step markers.

Nothing else is a pill. Filter chips, buttons and tags are rectangles.

## Elevation

Depth comes from stacked shadows, never from a heavier border.

```
raised panel   0 1px 2px rgba(16,22,43,0.05), 0 8px 24px rgba(16,22,43,0.07)
small card     0 1px 2px rgba(16,22,43,0.05), 0 6px 18px rgba(16,22,43,0.06)
resting card   0 1px 2px rgba(16,22,43,0.04)
selected card  0 2px 4px rgba(30,47,168,0.10), 0 8px 18px rgba(30,47,168,0.14)
chrome bar     0 1px 0 #E1E5F0, 0 3px 12px rgba(16,22,43,0.05)
footer bar     0 -2px 10px rgba(16,22,43,0.05)
inset field    inset 0 1px 2px rgba(16,22,43,0.04)
primary button 0 1px 0 rgba(255,255,255,0.2) inset, 0 3px 10px rgba(30,47,168,0.28)
logo tile      0 1px 2px rgba(16,22,43,0.07)
```

## Control sizing

Compact. The mockups were rejected once for oversized controls.

- Form field / select / date button: `min-height: 40px`, padding `10px 12px`, 13px text
- Primary & secondary buttons: `min-height: 36px`, padding `9px 24px`, 13px / 600
- Icon-only button: `32–36px` square
- Add-row button: `min-height: 38px`, padding `9px 16px`
- Search input inside its shell: `min-height: 34px`, 13px

## Layout constants

- Header bar: `#1B2A8F`, height **89px**, padding `10px 30px`, `justify-content: space-between`; logo `height: 50px` on the left, contact links + socials on the right
- **Search + filter is its own centered row *below* the header** — height **77px**, `justify-content: center`, holding the search shell (`420px` max, `#F5F6FA`, `1px solid #D5DAE8`, `radius 7px`, inset shadow) and the primary "Filter Positions" button beside it. It is *not* inside the header.
- Content column: `1060px` on the apply form, `1120px` on job detail, page padding `30px`
- Split view: left rail `42%`, gap `16–18px`

## Component recipes

**Badge** — neutral: `bg-[#F2F4FA] border border-[#E3E6F0] text-[#414A66]`;
emphasis: `bg-[#E7EAFB] border border-[#D3D9F7] text-[#1B2A8F]`. Both
`rounded-md px-2.5 py-1 text-[11px] font-medium`. Location badges carry a 11px
pin icon; type badges are text only.

**Primary button** — `bg-gradient-to-b from-[#2A3CC4] to-[#1E2FA8] text-white
rounded-[7px] text-[13px] font-semibold` + the primary-button shadow. The
gradient is for dimension, not decoration; never use a gradient as a background
wash.

**Secondary button** — `bg-white border border-[#D5DAE8] text-[#10162B]
rounded-[7px]` + `0 1px 2px rgba(16,22,43,0.05)`.

**Result card** — `rounded-[10px] p-[15px] border`. Resting:
`border-[#E4E7F1]` + resting shadow. Selected: `border-[#1E2FA8]` + selected
shadow. Logo tile `40px`, `rounded-lg`, `border-[#E3E6F0]`, white, tile shadow.

**Panel header (results count)** — uppercase eyebrow on the left, count as an
emphasis badge on the right, `border-b border-[#ECEFF7]`, padding `13px 18px`.
No status dot.

**Form section** — white panel, `rounded-xl`, padding `24px 26px`, raised-panel
shadow. Header row: a `32px` `rounded-lg` `#1E2FA8` square holding the two-digit
section number in white 12px/600, then the title (17px/600) with its subtitle
(12px, `#6C7591`) beneath, all above a `border-b border-[#ECEFF7]` with 16px
padding.

**Repeatable row** (family member, education, experience, reference) — nested
`border border-[#E4E7F1] rounded-[10px] bg-[#FBFCFE] p-[18px]` inside the
section, with an uppercase eyebrow ("MEMBER 1") and a muted Remove action.
Below the group: an outlined add button whose `+` sits in an 18px
`bg-[#E7EAFB] text-[#1E2FA8] rounded-[5px]` square.

**Required marker** — `<span className="text-[#C2410C]">*</span>` after the
label. Helper text 11px `#6C7591` under the field. Errors 12–13px `#C2410C`
with a 15px alert circle.

**Yes/No answer** — two rectangles side by side, 12px/600, `min-height 34px`,
`rounded-md`. Selected is solid `#1E2FA8` white text; unselected is white with
`border-[#D5DAE8]` and `#4A5273` text.

**Stepper** — follow `components/ui/stepper.tsx`: 40px circular marker, number
when pending, Check when complete, AlertCircle when invalid; title 15px/600 with
description 13px `#6C7591` beside it; chevron-right `#C3C9DC` separators;
pending steps at `opacity-60`. Active `#1E2FA8`, complete `#10A56B`.

**Footer nav bar** — white, `border-t border-[#E1E5F0]`, footer shadow, content
centred to the column: secondary Back on the left, "Step N of 4" centred,
primary Continue on the right.

## Build on shadcn, not by hand

`components.json` is configured (new-york, neutral, `@/components/ui`) and every
dependency is installed, so `npx shadcn@latest add <name>` works. Reach for a
primitive before writing a bespoke one — the hand-rolled versions kept shipping
without focus traps, keyboard navigation or ARIA.

Installed and in use:

| Primitive | Wrapper / call site |
|---|---|
| `dialog` | `components/ui/popup-modal.tsx` |
| `select` | `components/ui/styled-select.tsx` |
| `radio-group` | the `RadioPill` in `components/navbar.tsx` |
| `checkbox` | the urgent-only filter in `components/navbar.tsx` |
| `popover` | the Filter Positions dropdown in `components/navbar.tsx` |
| `form` | `components/ui/form.tsx`, used by `ApplicationFormField` |
| `button`, `carousel` | as shipped |

A dropdown, menu or panel anchored to a trigger is a `Popover` — never an
`absolute` div with `useState` plus a click-outside `useEffect`. Radix handles
outside clicks, Escape, focus return, portalling and flipping when it would run
off-screen.

Still hand-rolled, and worth migrating when you next touch them:
`nationality-combo-box` and `industry-combo-box` (→ `popover` + `command`),
`date-picker` (→ `popover` + `calendar`), `consent-declarations` (→ `checkbox`),
`dropzone`, `stepper`, `application-note`, `submitting-overlay`.

How to migrate one:

1. `npx shadcn@latest add <primitive> --yes`
2. Keep the existing wrapper's props so call sites do not change — e.g.
   `StyledSelect` still takes `options` and `onChange(value)` and composes the
   Radix parts internally.
3. Style only through `className` on the primitive's parts, using the tokens
   above. Do not edit the generated file in `components/ui/<primitive>.tsx`; it
   is regenerated by the CLI.
4. Keep `id` reaching the real control — the apply form's error focus, the
   label `htmlFor` and the end-to-end selectors all resolve `field-<path>` on
   the actual input.

## Rules that keep it on-design

1. No pill/rounded-full controls except stepper markers.
2. No coloured glow, gradient wash, or radial background. Backgrounds are flat; depth is shadow.
3. Chrome (header) is navy; content sits on `#EFF1F6`; surfaces are white.
4. Never add UI the code does not have — no sort control, no save button, no "talent network", no posted dates, no salary on the listings page (the listings page renders none; the job detail page does).
5. Content in a mockup or restyle comes from the real data and the real copy. Check `app/constants.ts`, the Manatal payload, and the component's own strings before typing a label.
