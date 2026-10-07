import { expect, test } from "@playwright/test";
import { resumePdf } from "./support/fixtures";
import { gotoApplyPage } from "./support/application-form";
import { installApiMocks } from "./support/mock-api";

/**
 * The object-key check Supabase Storage runs on every upload (storage-api's
 * `isValidKey`). A key with anything else in it comes back "Invalid key".
 */
const SUPABASE_KEY = /^(\w|\/|!|-|\.|\*|'|\(|\)| |&|\$|@|=|;|:|\+|,|\?)*$/;

// Names candidates actually chose, both refused outright in October 2026.
const NAMES = ["AIYESHA MARIANO - RESUMÉ .pdf", "A.Vidhya`s CV.pdf", "履歴書.pdf"];

test.describe("resume file names", () => {
  for (const name of NAMES) {
    test(`"${name}" uploads under a key Supabase accepts`, async ({ page }) => {
      await installApiMocks(page);

      const keys: string[] = [];
      await page.route(/\/storage\/v1\/object\//, (route) => {
        const key = decodeURIComponent(new URL(route.request().url()).pathname.split("/storage/v1/object/")[1]);
        keys.push(key);
        return SUPABASE_KEY.test(key)
          ? route.fulfill({ status: 200, json: { Id: "e2e-object-id", Key: key } })
          : route.fulfill({ status: 400, json: { statusCode: "400", error: "InvalidKey", message: `Invalid key: ${key}` } });
      });

      await gotoApplyPage(page);
      await page.locator('input[type="file"]').first().setInputFiles({ ...resumePdf, name });

      await expect(page.getByText("1 file uploaded successfully")).toBeVisible();
      await expect(page.getByText(/Failed to upload/)).toBeHidden();
      expect(keys).toHaveLength(1);
      expect(keys[0]).toMatch(/\.pdf$/);
    });
  }
});
