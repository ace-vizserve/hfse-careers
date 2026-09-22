export default async function globalTeardown() {
  const server = globalThis.__manatalMock;

  if (!server) return;

  await new Promise<void>((resolve) => server.close(() => resolve()));
}
