import type { Page } from "@playwright/test";

export type ApiMocks = {
  /** Raw bodies of every POST that reached /api/applications. */
  submissions: string[];
  /** Those same bodies with the multipart unpacked, keyed by field name. */
  submittedFields: Record<string, string>[];
  /** `application_data` parsed back out of JSON: the payload Manatal is handed. */
  submittedPayloads: Record<string, unknown>[];
};

/**
 * Unpacks a multipart body into its named fields.
 *
 * The point of these tests is that the browser *sent* the form, so what
 * matters is what actually went on the wire. A body that arrived truncated
 * still contains the first few values, so reading the parts out is what lets a
 * test say the whole payload made it rather than that a name appears somewhere
 * in the bytes.
 */
function parseMultipart(body: string, contentType: string): Record<string, string> {
  const marker = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? "");
  const boundary = marker?.[1] ?? marker?.[2];
  if (!boundary) return {};

  const fields: Record<string, string> = {};

  for (const part of body.split(`--${boundary}`)) {
    const name = /name="([^"]+)"/.exec(part)?.[1];
    if (!name) continue;

    // A part's headers are separated from its value by a blank line, and the
    // value runs to the line break before the next boundary.
    const blankLine = /\r?\n\r?\n/.exec(part);
    if (!blankLine) continue;

    fields[name] = part.slice(blankLine.index + blankLine[0].length).replace(/\r?\n$/, "");
  }

  return fields;
}

/**
 * Stubs every network call the apply page makes from the browser, so a test run
 * never creates a candidate in Manatal and never uploads to Supabase. The job
 * and its field list are not here: they are fetched server-side now, and the
 * dev server is pointed at the stub in `manatal-mock.ts` for those.
 * Routes are registered broad-first because Playwright matches the most
 * recently registered handler first.
 *
 * The submission is answered here, in the browser, rather than being let
 * through to the route handler. That is deliberate: the question these tests
 * ask is whether the browser serialized and sent the form at all -- the way
 * Safari once did not -- so the assertion belongs on what left the page.
 */
export async function installApiMocks(page: Page): Promise<ApiMocks> {
  const submissions: string[] = [];
  const submittedFields: Record<string, string>[] = [];
  const submittedPayloads: Record<string, unknown>[] = [];

  // Supabase storage. getPublicUrl() builds its string locally, so only the
  // upload itself needs answering.
  await page.route(/\/storage\/v1\/object\//, (route) =>
    route.fulfill({
      status: 200,
      json: { Id: "e2e-object-id", Key: `resumes/${Date.now()}-resume.pdf` },
    }),
  );

  await page.route(/\/api\/applications\/check-duplicate/, (route) =>
    route.fulfill({
      json: { foundCandidate: false, candidateId: null, alreadyApplied: false, matchedApplication: null },
    }),
  );

  await page.route(/\/api\/applications(\?|$)/, async (route, request) => {
    if (request.method() !== "POST") return route.continue();

    const body = request.postData() ?? "";
    submissions.push(body);

    const fields = parseMultipart(body, request.headers()["content-type"] ?? "");
    submittedFields.push(fields);

    try {
      submittedPayloads.push(JSON.parse(fields.application_data ?? "null"));
    } catch {
      // A body that will not parse is itself the finding, so record the miss
      // and let the test report it rather than dying in the route handler.
      submittedPayloads.push({});
    }

    await route.fulfill({
      status: 200,
      json: { success: true, candidate: { id: 123456, name: "Alex Tan" } },
    });
  });

  return { submissions, submittedFields, submittedPayloads };
}
