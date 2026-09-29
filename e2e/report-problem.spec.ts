import { expect, test } from "@playwright/test";
import { applicant, JOB_ID } from "./support/fixtures";
import { fillText, fillValidApplication, gotoApplyPage, submitButton } from "./support/application-form";
import { installApiMocks } from "./support/mock-api";

/**
 * "Report a problem" replaces asking candidates to email support with a
 * screenshot. What matters is that it carries what a screenshot would have --
 * where they were, what the page said -- and the visit's session id, which is
 * the only thing that lines the report up with the failures logged for it.
 */
test.describe("report a problem", () => {
  const dialog = (page: import("@playwright/test").Page) => page.getByRole("dialog", { name: "Report a problem" });

  test("sends what the candidate wrote, with where they are and who to reply to", async ({ page }) => {
    const api = await installApiMocks(page);
    await gotoApplyPage(page);

    await fillText(page, "full_name", applicant.fullName);
    await fillText(page, "email", applicant.email);

    await page.getByRole("button", { name: "Report a problem" }).click();

    // What they already typed into the application is not asked for twice.
    await expect(dialog(page).getByLabel("Your name")).toHaveValue(applicant.fullName);
    await expect(dialog(page).getByLabel(/Email for our reply/)).toHaveValue(applicant.email);

    await dialog(page).getByLabel(/What happened/).fill("The nationality list would not open.");
    await dialog(page).getByRole("button", { name: "Send report" }).click();

    await expect(page.getByText("Thanks, we have your report")).toBeVisible();
    await expect(page.getByText("#42")).toBeVisible();

    expect(api.problemReports).toHaveLength(1);
    expect(api.problemReports[0]).toMatchObject({
      jobId: JOB_ID,
      name: applicant.fullName,
      email: applicant.email,
      message: "The nationality list would not open.",
      step: "Step 1 of 4: About You",
    });
    expect(api.problemReports[0].sessionId).toMatch(/^[0-9a-z-]{8,64}$/i);
  });

  test("a failed submission's report carries the error and the same session as the failure", async ({ page }) => {
    const api = await installApiMocks(page);

    // A platform timeout: not our route's JSON, so only the page can log it.
    await page.route(/\/api\/applications(\?|$)/, async (route, request) => {
      if (request.method() !== "POST") return route.continue();
      api.submissionSessions.push(request.headers()["x-application-session"]);
      await route.fulfill({ status: 504, contentType: "text/html", body: "<html>Gateway Timeout</html>" });
    });

    await gotoApplyPage(page);
    await fillValidApplication(page);
    await submitButton(page).click();

    await page.getByRole("button", { name: "Stuck? Report this problem" }).click();
    await expect(dialog(page).getByText("Attached:")).toBeVisible();

    await dialog(page).getByLabel(/What happened/).fill("Submit failed twice with a timeout.");
    await dialog(page).getByRole("button", { name: "Send report" }).click();
    await expect(page.getByText("Thanks, we have your report")).toBeVisible();

    await expect.poll(() => api.issueReports.find((issue) => issue.stage === "submit")).toBeTruthy();

    const [report] = api.problemReports;
    const failure = api.issueReports.find((issue) => issue.stage === "submit")!;

    expect(report.shownError).toContain("HTTP 504");
    expect(failure.error).toContain("HTTP 504");
    // The join key: the report, the logged failure and the request itself.
    expect(report.sessionId).toBe(failure.sessionId);
    expect(api.submissionSessions.at(-1)).toBe(report.sessionId);
  });

  test("a report that cannot be sent offers the email instead, with the details filled in", async ({ page }) => {
    await installApiMocks(page);
    await page.route(/\/api\/applications\/report/, (route) =>
      route.fulfill({ status: 500, json: { error: "Your report could not be saved." } }),
    );

    await gotoApplyPage(page);
    await page.getByRole("button", { name: "Report a problem" }).click();
    await dialog(page).getByLabel(/What happened/).fill("Resume upload keeps failing.");
    await dialog(page).getByLabel(/Email for our reply/).fill(applicant.email);
    await dialog(page).getByRole("button", { name: "Send report" }).click();

    const fallback = dialog(page).getByRole("link", { name: /email it to support@hfse.edu.sg/ });
    await expect(fallback).toBeVisible();
    expect(decodeURIComponent((await fallback.getAttribute("href")) ?? "")).toContain("Resume upload keeps failing.");
  });
});
