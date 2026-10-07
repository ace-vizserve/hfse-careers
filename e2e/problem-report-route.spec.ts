import { expect, test } from "@playwright/test";
import { POST } from "../app/api/applications/report/route";

/**
 * A candidate is told they were heard only once the report row exists. No
 * browser; Supabase is stubbed at `fetch`.
 */
test.describe("problem report route", () => {
  const SESSION = "0f8fad5b-d9cb-469f-a165-70867728950e";
  const valid = {
    jobId: "999001",
    sessionId: SESSION,
    positionName: "Secondary Mathematics Teacher",
    step: "Step 4 of 4: Declarations",
    shownError: "Failed to submit application",
    name: "Alex Tan",
    email: "alex.tan.e2e@example.com",
    message: "Submit keeps timing out.",
  };

  const send = (body: unknown) =>
    POST(
      new Request("http://127.0.0.1/api/applications/report", {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" },
        body: JSON.stringify(body),
      }),
    );

  let calls: { url: string; body: any }[];
  let saveFails: boolean;
  const realFetch = globalThis.fetch;
  const realEnv = { ...process.env };

  test.beforeEach(() => {
    calls = [];
    saveFails = false;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://e2e.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "e2e-service-key";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      const text = await request.text();
      calls.push({ url: request.url, body: text ? JSON.parse(text) : undefined });

      if (request.url.includes("/rest/v1/careers_problem_reports")) {
        return saveFails
          ? new Response(JSON.stringify({ message: "boom" }), { status: 500, headers: { "content-type": "application/json" } })
          : new Response(JSON.stringify({ id: 7 }), { status: 201, headers: { "content-type": "application/json" } });
      }
      return new Response(null, { status: 200 });
    }) as typeof fetch;
  });

  test.afterEach(() => {
    globalThis.fetch = realFetch;
    process.env = { ...realEnv };
  });

  test("saves the report with its session and browser", async () => {
    const response = await send(valid);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 7 });

    expect(calls).toHaveLength(1);
    const [save] = calls;
    expect(new URL(save.url).pathname).toBe("/rest/v1/careers_problem_reports");
    expect(save.body).toMatchObject({
      session_id: SESSION,
      job_id: "999001",
      email: valid.email,
      message: valid.message,
      shown_error: valid.shownError,
      browser_name: "Chrome",
      os_name: "Windows",
    });
  });

  test("refuses a report it could not reply to, or with nothing in it", async () => {
    expect((await send({ ...valid, email: "not-an-email" })).status).toBe(400);
    expect((await send({ ...valid, message: "help" })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  test("a bot filling the hidden field is told it worked, and nothing is saved", async () => {
    const response = await send({ ...valid, website: "https://spam.example" });
    expect(response.status).toBe(200);
    expect(calls).toHaveLength(0);
  });

  test("a report that was not saved is not reported as sent", async () => {
    saveFails = true;
    expect((await send(valid)).status).toBe(500);
  });

  test("without the service key the candidate is told, rather than the report vanishing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect((await send(valid)).status).toBe(503);
  });
});
