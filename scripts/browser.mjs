/**
 * Opens a real, headed browser window pointed at the local app, so you can
 * click through it yourself. WebKit is the engine Safari is built on, which
 * makes it the closest thing to Safari that runs on Windows.
 *
 *   node scripts/browser.mjs safari
 *   node scripts/browser.mjs safari --mobile
 *   node scripts/browser.mjs firefox --url http://localhost:3000/jobs/123/apply
 *
 * Starts `npm run dev` only if nothing is already serving the port, and stops
 * it again when you close the browser.
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices, firefox, webkit } from "@playwright/test";

const ENGINES = {
  safari: { launcher: webkit, label: "WebKit (Safari engine)", device: "iPhone 14" },
  webkit: { launcher: webkit, label: "WebKit (Safari engine)", device: "iPhone 14" },
  firefox: { launcher: firefox, label: "Firefox", device: null },
  chrome: { launcher: chromium, label: "Chromium", device: "Pixel 7" },
  chromium: { launcher: chromium, label: "Chromium", device: "Pixel 7" },
};

const args = process.argv.slice(2);
const name = (args.find((a) => !a.startsWith("--")) ?? "safari").toLowerCase();
const mobile = args.includes("--mobile");
const mock = args.includes("--mock");
const urlArg = args.find((a) => a.startsWith("--url="))?.slice("--url=".length);
const fileArg = args.find((a) => a.startsWith("--file="))?.slice("--file=".length);

// Playwright always suppresses the OS file dialog, so without a file on hand the
// resume upload is untestable. Default to a bundled sample; --file= overrides it
// and --no-file opts out.
const sampleResume = resolve(dirname(fileURLToPath(import.meta.url)), "../e2e/fixtures/sample-resume.pdf");
const uploadFile = args.includes("--no-file") ? null : (fileArg ? resolve(fileArg) : sampleResume);

const engine = ENGINES[name];
if (!engine) {
  console.error(`Unknown browser "${name}". Try one of: ${Object.keys(ENGINES).join(", ")}`);
  process.exit(1);
}

// Same port the Playwright suite uses, so a server started either way is shared.
const port = Number(process.env.E2E_PORT ?? 5000);
const url = urlArg ?? `http://localhost:${port}`;

const isUp = async () => {
  try {
    await fetch(url, { method: "HEAD" });
    return true;
  } catch {
    return false;
  }
};

let devServer = null;

if (await isUp()) {
  console.log(`Using the dev server already running at ${url}`);
} else {
  console.log(`Starting the dev server on port ${port}...`);
  devServer = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    stdio: "inherit",
    shell: true,
  });

  const deadline = Date.now() + 120_000;
  while (!(await isUp())) {
    if (Date.now() > deadline) {
      console.error("Dev server did not come up within 2 minutes.");
      devServer.kill();
      process.exit(1);
    }
    await new Promise((done) => setTimeout(done, 500));
  }
}

if (mobile && !engine.device) {
  console.log("Firefox has no mobile emulation in Playwright; opening desktop Firefox instead.");
}

const emulate = mobile && engine.device ? devices[engine.device] : {};

const browser = await engine.launcher.launch({ headless: false });
const context = await browser.newContext({ ...emulate });

// This points at the real dev server with your real .env, so a submit creates a
// real Manatal candidate and a real Supabase upload. --mock blocks every write
// while leaving the job and form-field reads genuine, so the form stays real.
if (mock) {
  await context.route(/\/storage\/v1\/object\//, (route) =>
    route.fulfill({ status: 200, json: { Id: "mock-object", Key: "mock/resume.pdf" } }),
  );

  await context.route(/\/api\/applications\/check-duplicate/, (route) =>
    route.fulfill({
      json: { foundCandidate: false, candidateId: null, alreadyApplied: false, matchedApplication: null },
    }),
  );

  await context.route(/\/api\/applications(\?|$)/, async (route, request) => {
    if (request.method() !== "POST") return route.continue();
    console.log("  [mock] blocked a submission; nothing was sent to Manatal.");
    await route.fulfill({ json: { success: true, candidate: { id: 0, name: "mock candidate" } } });
  });
}
const page = await context.newPage();

// Playwright intercepts every file picker, so the OS dialog never opens and a
// click on the resume dropzone looks like it does nothing. Supply a file
// instead, or say plainly why no dialog appeared.
page.on("filechooser", async (chooser) => {
  if (!uploadFile) {
    console.log("  File picker opened; --no-file is set, so nothing was attached.");
    return;
  }

  try {
    await chooser.setFiles(uploadFile);
    console.log(`  Attached ${uploadFile}`);
  } catch (error) {
    console.error(`  Could not attach ${uploadFile}: ${error.message}`);
  }
});

await page.goto(url);

console.log("");
console.log(`  ${engine.label}${mobile && engine.device ? ` - ${engine.device}` : ""} is open.`);
console.log(`  Local link: ${url}`);
if (uploadFile) {
  const label = fileArg ? uploadFile : `${uploadFile} (bundled sample; pass --file= to use your own)`;
  console.log(`  Upload button will attach: ${label}`);
}
console.log("  Drag-and-drop from Explorer does not work here - use the upload button.");
if (mock) {
  console.log("  --mock is ON: submissions and uploads are stubbed. Nothing is written.");
} else {
  console.log("  !! LIVE: submitting creates a REAL Manatal candidate and uploads to Supabase.");
  console.log("     Pass --mock to click through the form without writing anything.");
}
console.log("  Close the browser window to shut this down.");
console.log("");

const shutdown = async () => {
  await browser.close().catch(() => {});
  devServer?.kill();
  process.exit(0);
};

browser.on("disconnected", shutdown);
process.on("SIGINT", shutdown);
