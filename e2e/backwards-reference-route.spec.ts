import { expect, test } from "@playwright/test";
import { POST as submitApplication } from "../app/api/applications/route";
import { formatReferencesToHTML } from "../lib/utils";

/**
 * The form refuses a reference typed backwards, but a page cached from before
 * that rule would still send one. The route checks again on save, before
 * anything reaches Manatal. No browser is involved; every outbound call is
 * stubbed at `fetch` and recorded.
 */
test.describe("submit route: references typed backwards", () => {
  let calls: string[];
  const realFetch = globalThis.fetch;
  const realEnv = { ...process.env };

  test.beforeEach(() => {
    calls = [];
    process.env.MANATAL_API_KEY = "e2e-key";
    process.env.MANATAL_CLIENT_SLUG = "e2e-slug";
    process.env.N8N_PROD_WEBHOOK_URL = "https://e2e.n8n.test/webhook";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://e2e.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "e2e-service-key";

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input instanceof Request ? input.url : input));
      return new Response("{}", { status: 201, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
  });

  test.afterEach(() => {
    globalThis.fetch = realFetch;
    process.env = { ...realEnv };
  });

  const reference = (name: string, relationship: string) => ({
    name,
    email: "referee@example.com",
    contact_no: "+6591234567",
    company_occupation: "Raffles Institution, Head of Department",
    relationship,
    years_known: "3",
    is_work_related: "Yes" as const,
    consent_to_contact: "I agree" as const,
  });

  const submit = (references: ReturnType<typeof reference>[]) => {
    const form = new FormData();
    form.set("jobId", "999001");
    form.set("application_data", JSON.stringify({ "1741707": formatReferencesToHTML(references) }));
    return submitApplication(new Request("http://127.0.0.1/api/applications", { method: "POST", body: form }));
  };

  test("a backwards name or relationship is refused before Manatal is called", async () => {
    for (const references of [
      [reference("atanacAC yraG", "Friend")],
      [reference("Gary Cacanta", "dneirF")],
      [reference("Gary Cacanta", "eugaelloc xE")],
    ]) {
      calls = [];
      const response = await submit(references);

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("A reference looks typed backwards");
      expect(calls.some((url) => url.includes("manatal.com"))).toBe(false);
    }
  });

  test("readable references go through to Manatal", async () => {
    const response = await submit([reference("Gary Cacanta", "Friend"), reference("Marie LeBlanc", "Ex colleague")]);

    expect(response.status).toBe(200);
    expect(calls.some((url) => url.includes("manatal.com"))).toBe(true);
  });
});
