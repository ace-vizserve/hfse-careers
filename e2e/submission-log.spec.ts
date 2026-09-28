import { expect, test } from "@playwright/test";
import { logSubmission, readBrowser } from "../lib/submission-log.server";

/**
 * The browser log runs after the candidate is already in Manatal, so it has two
 * jobs: write the row it should, and never turn a logging problem into a failed
 * application. No browser is involved; Supabase is stubbed at `fetch`.
 */
test.describe("submission browser log", () => {
  const IPHONE_SAFARI =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

  const entry = { candidateId: 4242, jobId: "999001", positionName: "Secondary Mathematics Teacher" };

  const submitRequest = (userAgent?: string) =>
    new Request("http://127.0.0.1/api/applications", {
      method: "POST",
      headers: userAgent ? { "user-agent": userAgent } : {},
    });

  type Call = { url: string; method: string; headers: Headers; body: unknown };

  let calls: Call[];
  let respond: () => Response | Promise<Response>;
  const realFetch = globalThis.fetch;
  const realEnv = { ...process.env };

  test.beforeEach(() => {
    calls = [];
    respond = () => new Response(null, { status: 201 });
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://e2e.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "e2e-service-key";

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      const text = await request.text();
      calls.push({
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: text ? JSON.parse(text) : undefined,
      });
      return respond();
    }) as typeof fetch;
  });

  test.afterEach(() => {
    globalThis.fetch = realFetch;
    process.env = { ...realEnv };
  });

  test("writes one row with the parsed browser", async () => {
    await logSubmission(submitRequest(IPHONE_SAFARI), entry);

    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call.method).toBe("POST");
    expect(new URL(call.url).pathname).toBe("/rest/v1/submission_log");
    expect(call.headers.get("authorization")).toBe("Bearer e2e-service-key");
    expect(call.body).toEqual({
      candidate_id: "4242",
      job_id: "999001",
      position_name: "Secondary Mathematics Teacher",
      browser_name: "Safari",
      browser_version: "18.0",
      browser_major: 18,
      os_name: "iOS",
      os_version: "18.0",
      device_type: "mobile",
      in_app: null,
      user_agent: IPHONE_SAFARI,
    });
  });

  test("a request with no user agent still logs the submission", async () => {
    await logSubmission(submitRequest(), entry);

    expect(calls).toHaveLength(1);
    expect(calls[0].body).toMatchObject({ job_id: "999001", user_agent: null });
    expect(calls[0].body).not.toHaveProperty("browser_name");
  });

  test("without the service role key it writes nothing and does not throw", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await expect(logSubmission(submitRequest(IPHONE_SAFARI), entry)).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  test("a Supabase error does not throw", async () => {
    respond = () =>
      new Response(JSON.stringify({ message: 'relation "submission_log" does not exist' }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });

    await expect(logSubmission(submitRequest(IPHONE_SAFARI), entry)).resolves.toBeUndefined();
    expect(calls).toHaveLength(1);
  });

  test("names and versions come apart so reports can group by either", () => {
    expect(
      readBrowser(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      ),
    ).toEqual({
      browser_name: "Chrome",
      browser_version: "140.0.0.0",
      browser_major: 140,
      os_name: "Windows",
      os_version: "NT 10.0",
      device_type: "desktop",
      in_app: null,
    });

    expect(
      readBrowser(
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
      ),
    ).toMatchObject({ browser_name: "Samsung Internet for Android", browser_major: 27, os_name: "Android" });
  });

  test("an app's in-app browser is named", () => {
    const instagram = readBrowser(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0 (iPhone15,2; iOS 18_0; en_US)",
    );
    expect(instagram).toMatchObject({ in_app: "Instagram", os_name: "iOS", device_type: "mobile", browser_major: null });

    expect(
      readBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.0]",
      ).in_app,
    ).toBe("Facebook");

    expect(
      readBrowser(
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 LinkedInApp/9.30",
      ).in_app,
    ).toBe("LinkedIn");
  });

  test("Supabase being unreachable does not throw", async () => {
    respond = () => {
      throw new TypeError("fetch failed");
    };

    await expect(logSubmission(submitRequest(IPHONE_SAFARI), entry)).resolves.toBeUndefined();
  });
});
