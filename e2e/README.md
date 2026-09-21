# Application submission tests

Covers the one thing that must never break: a candidate can complete the apply
form and the submission actually reaches the API.

## Run them

```bash
npm run test:e2e            # all five browser targets
npm run test:e2e:safari     # WebKit + mobile Safari only
npm run test:e2e:headed     # watch it happen
npm run test:e2e:ui         # Playwright UI mode, for stepping through
```

All browser-driven scripts use port **5000** - the Playwright suite and the manual
browser script alike, so a server started by either is reused by the other and
neither collides with `npm run dev` on 3000. Override with `E2E_PORT`.

## Open a browser and click around yourself

```bash
npm run browser:safari          # headed WebKit against localhost:5000
npm run browser:safari:mobile   # WebKit at iPhone 14 size
npm run browser:firefox
npm run browser:chrome
```

Starts the dev server if one isn't running, prints the local link, and shuts
down when you close the window.

### These are not your everyday browser

The page itself is genuine WebKit, so rendering, layout, CSS and JS behave as
Safari's engine does. Anything crossing the browser/OS boundary does not:

- **The OS file dialog never opens.** Playwright intercepts every file chooser.
  The script handles that for you: clicking the resume upload attaches
  `e2e/fixtures/sample-resume.pdf` automatically, so the upload path works. Use
  your own file, or attach nothing, with:

  ```bash
  node scripts/browser.mjs safari --file=C:\Users\you\Desktop\resume.pdf
  node scripts/browser.mjs safari --no-file
  ```

- **Drag-and-drop from Explorer does not work.** Use the upload button instead.
- Downloads, printing and native permission prompts behave differently too.

To exercise the real picker and real drag-and-drop, use an ordinary browser, or
real Safari on a Mac or iPhone.

### The playground writes for real

Unlike the tests, `scripts/browser.mjs` stubs nothing. It points at the dev
server running your real `.env`, so submitting the form creates a **real Manatal
candidate**, uploads the resume to **real Supabase storage**, and fires the n8n
webhook. Clicking the upload button alone is enough to put a file in the bucket.

Add `--mock` to click through everything without writing anything. Job and
form-field reads stay genuine, so the form is still the real one; only the
upload, the duplicate check and the submission are stubbed:

```bash
node scripts/browser.mjs safari --mock
```

## What is stubbed

Nothing leaves the machine. `e2e/support/mock-api.ts` intercepts the job and
form-field lookups, the Supabase resume upload, the duplicate check, and the
submission itself, so a run never creates a Manatal candidate and needs no API
keys. The tests assert against the POST body the browser actually produced.

## What this does and does not prove

`webkit` is the engine Safari is built on, and it catches engine-level
behaviour — including the regression that prompted these tests, where native
constraint validation cancelled submit before `handleSubmit` ran. The second
test fails if `noValidate` is ever removed from the form.

It is **not** Safari. It is a Playwright build of upstream WebKit, so it does
not cover: the Safari version your candidates actually run, ITP and its
seven-day eviction of script-written storage, iOS WKWebView, the iOS file
picker, iOS date inputs, the virtual keyboard against fixed elements, or macOS
font metrics. `mobile-safari` only emulates viewport, user agent and touch —
the engine underneath is still desktop WebKit on this host.

Before shipping changes to resume upload, date fields or draft persistence,
test on a real device or a cloud device lab.
