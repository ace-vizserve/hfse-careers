import type { Server } from "node:http";

import { startManatalMock } from "./manatal-mock";

declare global {
  // eslint-disable-next-line no-var
  var __manatalMock: Server | undefined;
}

export default async function globalSetup() {
  globalThis.__manatalMock = await startManatalMock();
}
