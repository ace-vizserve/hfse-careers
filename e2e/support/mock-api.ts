import type { Page } from "@playwright/test";

export type ApiMocks = {
  /** Raw bodies of every POST that reached /api/applications. */
  submissions: string[];
};

/**
 * Stubs every network call the apply page makes from the browser, so a test run
 * never creates a candidate in Manatal and never uploads to Supabase. The job
 * and its field list are not here: they are fetched server-side now, and the
 * dev server is pointed at the stub in `manatal-mock.ts` for those.
 * Routes are registered broad-first because Playwright matches the most
 * recently registered handler first.
 */
export async function installApiMocks(page: Page): Promise<ApiMocks> {
  const submissions: string[] = [];

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

    submissions.push(request.postData() ?? "");

    await route.fulfill({
      status: 200,
      json: { success: true, candidate: { id: 123456, name: "Alex Tan" } },
    });
  });

  return { submissions };
}
