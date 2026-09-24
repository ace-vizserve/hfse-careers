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

/**
 * The value rules Manatal enforces, in its own words. Confirmed against the
 * live API: char caps at 255, an integer field takes at most 10 digits, and a
 * date must be yyyy-mm-dd. Manatal reports one complaint at a time.
 */
function firstValueComplaint(data: Record<string, unknown>): string | undefined {
  for (const field of applicationFormFixture) {
    const value = data[String(field.id)];
    if (typeof value !== "string" || value === "") continue;

    if (field.type === "integer") {
      if (!/^\d+$/.test(value) || value.length > 10) {
        return `Field ${field.label} should be a numerical value and be less than 11 digits`;
      }
    }

    if (field.type === "date" || field.type === "datetime") {
      if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
        return `Type of ${field.label} should be in yyyy-mm-dd format and not null`;
      }
    }

    if ((field.type === "text" || field.type === "char") && value.length > 255) {
      return `The ${field.label} field may not be greater than 255 characters.`;
    }
  }

  return undefined;
}

export function startManatalMock(port = MANATAL_MOCK_PORT): Promise<Server> {
  const server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];

    const json = (body: unknown, status = 200) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (path === "/jobs/") return json({ results: [jobFixture], count: 1 });

    if (path === `/jobs/${JOB_ID}/`) return json(jobFixture);

    if (path.endsWith(`/jobs/${JOB_ID}/application-form/`)) {
      if (req.method !== "POST") return json(applicationFormFixture);

      // A POST here is the step-validation probe. Manatal answers it by
      // validating the values it was given and, failing that, listing what is
      // still missing -- never with a 200, because the probe always withholds
      // a required field. Mirroring that is what lets a test drive the real
      // path instead of a stub that says yes to everything.
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        let data: Record<string, unknown> = {};
        try {
          data = JSON.parse(body)?.application_data ?? {};
        } catch {
          // An unparseable body is still a rejection, just an uninformative one.
        }

        const complaint = firstValueComplaint(data);

        if (complaint) return json({ application_data: [complaint] }, 400);

        return json({ detail: "Missing required fields: Resume" }, 400);
      });

      return;
    }

    // Any other job id is genuinely unknown, which is what the page expects to
    // see for a role that has been taken down.
    return json({ detail: "Not found." }, 404);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}
