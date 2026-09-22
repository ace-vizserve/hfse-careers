import { createServer, type Server } from "node:http";

import { formFieldsFixture, jobFixture, JOB_ID } from "./fixtures";

/**
 * A stub of the Manatal endpoints the server renders from.
 *
 * The apply page used to fetch its job and field list from the browser, so
 * `page.route` could answer them. Both now resolve on the server, out of
 * Playwright's reach, so the stub sits where the real ATS would: the dev server
 * is pointed at it with `MANATAL_BASE_URL`.
 */
export const MANATAL_MOCK_PORT = Number(process.env.E2E_MANATAL_PORT ?? 5051);

/** Manatal returns the form fields keyed by `slug`; the fixtures use `name`. */
const applicationFormFixture = formFieldsFixture.map((field) => ({
  id: field.id,
  slug: field.name,
  label: field.label,
  type: field.type,
  is_required: field.required ?? false,
  options: field.options ?? [],
}));

export function startManatalMock(port = MANATAL_MOCK_PORT): Promise<Server> {
  const server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];

    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (path === "/jobs/") return json({ results: [jobFixture], count: 1 });

    if (path === `/jobs/${JOB_ID}/`) return json(jobFixture);

    if (path.endsWith(`/jobs/${JOB_ID}/application-form/`)) return json(applicationFormFixture);

    // Any other job id is genuinely unknown, which is what the page expects to
    // see for a role that has been taken down.
    return json({ detail: "Not found." }, 404);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}
