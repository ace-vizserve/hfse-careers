import type { Server } from "node:http";

import type { FullConfig } from "@playwright/test";

import { JOB_ID } from "./fixtures";
import { startManatalMock } from "./manatal-mock";

declare global {
  // eslint-disable-next-line no-var
  var __manatalMock: Server | undefined;
}

export default async function globalSetup(config: FullConfig) {
  globalThis.__manatalMock = await startManatalMock();

  // `next dev` compiles a route on its first request, and requests that arrive
  // during that compile race the dev server's own manifest writes: a couple of
  // them come back as a 500 with "Unexpected end of JSON input" from inside
  // Next. Fifteen tests across five browsers all reach for the same two routes
  // at once, so compile them here, one at a time, before anyone else asks.
  const baseURL = config.projects[0]?.use?.baseURL;

  if (!baseURL) return;

  for (const path of [`/jobs/${JOB_ID}`, `/jobs/${JOB_ID}/apply`]) {
    try {
      await fetch(`${baseURL}${path}`);
    } catch {
      // The webServer is up by now; if this still fails the tests will say so
      // far more clearly than a thrown global setup would.
    }
  }
}
