## Test Job Application Submission

Run an end-to-end API-level test of the `/api/applications` endpoint against the Manatal test job. This verifies the full submission pipeline: form data parsing, nationality conversion, Manatal API submission, and n8n webhook.

### 1. Pre-flight Checks

- Verify the dev server is running at `http://localhost:3000` by hitting `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`.
- If it returns anything other than `200`, start it with `npm run dev` in the background and wait for it to be ready.

### 2. Temporarily Swap Webhook

In `app/api/applications/route.ts`, change `N8N_PROD_WEBHOOK_URL` to `N8N_TEST_WEBHOOK_URL` so the test does not trigger production notifications.

### 3. Fetch a Valid Resume URL

Query the Supabase storage bucket `candidate-resume` to find a real PDF file:

```
curl -s "https://vnhklhppftebbcuupfjw.supabase.co/storage/v1/object/list/candidate-resume" \
  -H "Authorization: Bearer <NEXT_PUBLIC_SUPABASE_ANON_KEY from .env.local>" \
  -H "Content-Type: application/json" \
  -d '{"prefix": "", "limit": 5}'
```

Pick the first `.pdf` file and construct its public URL:
`https://vnhklhppftebbcuupfjw.supabase.co/storage/v1/object/public/candidate-resume/<filename>`

### 4. Look Up Industry ID

Fetch a valid industry ID from Manatal:

```
curl -s "https://api.manatal.com/open/v3/industries/?search=Education&limit=1" \
  -H "Authorization: Token <MANATAL_API_KEY from .env.local>"
```

Use the `id` from the first result.

### 5. Send Test Application

Send a POST to `http://localhost:3000/api/applications` with `multipart/form-data` containing:

- `jobId`: `3684256` (the "sample 3" test job)
- `expected_currency`: `11` (SGD)
- `application_data`: JSON string with these fields (use the resume URL from step 3 and industry ID from step 4):

| Field ID | Value |
|----------|-------|
| 1741679 (Full Name) | `Test Candidate` |
| 1741704 (Preferred Name) | `Test` |
| 1741680 (Email) | `test.<random-4-digits>@example.com` |
| 1741681 (Phone) | `+6591234567` |
| 1741686 (DOB) | `1990-01-15` |
| 1741687 (Gender) | `Male` |
| 1741695 (Religion) | `Christianity` |
| 1741690 (Address) | `123 Test Street, Singapore` |
| 1741706 (Postal Code) | `123456` |
| 1741683 (Resume) | Resume URL from step 3 |
| 1741702 (Work Industry) | Industry ID from step 4 (as string) |
| 1741703 (Years of Exp) | `5` |
| 1741696 (NRIC/FIN) | `S1234567A` |
| 1741697 (Residential Status) | `Singaporean` |
| 1741699 (Passport No) | `E1234567X` |
| 1741700 (Place/Date Issue) | `Singapore, 2020-01-01` |
| 1741684 (Expected Salary) | `5000` |
| 1742501 (Highest Qual) | `Bachelors Degree` |
| 1742127 (Nationality) | `Singaporean` |
| 1741707 (References) | `<ol><li><ul><li><strong>Name:</strong> John Ref</li></ul></li></ol>` |
| 1741708 (Declaration) | `<ol><li>No</li></ol>` |
| 1741709 (Family) | `<ol><li><ul><li><strong>Name:</strong> Jane Family</li></ul></li></ol>` |
| 1749464 (Emergency Name) | `Jane Doe` |
| 1749465 (Emergency Rel) | `Spouse` |
| 1749466 (Emergency Addr) | `123 Test Street` |
| 1749467 (Emergency Phone) | `+6598765432` |
| 1749470 (Emergency Email) | `jane.doe@example.com` |
| 1771366 (Skip BG Check) | `false` |
| 1771465 (RC/BC Issued) | `false` |
| 1771466 (BC Issued) | `false` |
| 1741720 (Education) | `[{"school":"NUS","degree_name":"Bachelors","started_at":"2008-08-01","ended_at":"2012-06-01","status":1}]` |
| 1741721 (Experience) | `[{"title":"Teacher","employer":"Test School","started_at":"2013-01-01","ended_at":"2024-12-31","is_current_employer":false}]` |
| + metadata | `job_id`: `3684256`, `job_portal`: `career-page`, `organization_name`: `Test Client`, `position_name`: `sample 3` |

Use a unique email per run (append random digits) to avoid the duplicate candidate check.

### 6. Evaluate Response

Check the HTTP status and response body:

- **200 with `"success": true`** — Manatal submission and webhook both succeeded.
- **200 but `candidateId` is null/missing** — Known: Manatal career page API doesn't return candidate IDs. Not a bug.
- **400** — Manatal rejected the payload. Read `details` for which field failed.
- **404/500 on webhook** — Manatal succeeded but n8n test webhook is inactive. Note: this means the candidate WAS created even though the response looks like failure. Flag this as a known issue.

### 7. Revert Webhook

Change `N8N_TEST_WEBHOOK_URL` back to `N8N_PROD_WEBHOOK_URL` in `app/api/applications/route.ts`.

### 8. Report

Output a summary table:

| Check | Result |
|-------|--------|
| Dev server | up / had to start |
| Resume URL | found / not found |
| Industry ID | resolved / failed |
| Manatal submission | success / failed (reason) |
| Webhook | success / failed (expected if test webhook inactive) |
| Nationality conversion | verified / failed |
| Candidate cleanup | deleted / not found / failed (reason) |

### 9. Save Log

Create the `logs/` directory if it doesn't exist, then **append** a structured log entry to `logs/test-submission.log` using this format:

```
=====================================
TEST RUN: <ISO 8601 timestamp>
=====================================
Test Email:       <email used for this run>
Resume URL:       <Supabase resume URL used>
Industry ID:      <resolved industry ID>
Nationality:      <input demonym> -> <converted ID>
Job ID:           3684256 (sample 3 — Test Client)

HTTP Status:      <status code from /api/applications>
Response Body:    <full JSON response>

Results:
  Dev Server:           <up / had to start>
  Resume Lookup:        <found / not found>
  Industry Lookup:      <resolved / failed>
  Manatal Submission:   <success / failed>
  Webhook:              <success / failed (reason)>
  Nationality Convert:  <verified / failed>

Candidate Cleanup:  <deleted (ID: <id>) / not found / failed (reason)>

Verdict: <PASS / FAIL>
Errors:  <error details if any, or "None">
=====================================
```

### 10. Clean Up Test Candidate

After logging, delete the test candidate from Manatal to avoid accumulating junk data.

1. **Search** for the candidate by the test email used in this run:

```
curl -s "https://api.manatal.com/open/v3/candidates/?email=<test-email>" \
  -H "Authorization: Token <MANATAL_API_KEY from .env.local>"
```

2. **Extract** the candidate `id` from the first result in `results[]`. If `results` is empty, log "not found" and skip deletion.

3. **Delete** the candidate:

```
curl -s -o /dev/null -w "%{http_code}" -X DELETE "https://api.manatal.com/open/v3/candidates/<id>/" \
  -H "Authorization: Token <MANATAL_API_KEY from .env.local>"
```

- **204** — successfully deleted.
- **404** — candidate not found (may have already been deleted).
- Any other status — log as failed with the status code.

4. Include the cleanup result in both the summary table (Step 8) and the log entry (Step 9).

### Rules

- **Always** revert the webhook URL change, even if the test fails.
- **Never** use the production webhook — always swap to test.
- **Always** append results to `logs/test-submission.log` — create the `logs/` directory if it doesn't exist. Log even on failure.
- The test creates a real candidate in Manatal under the "sample 3" test job. Step 10 cleans it up.
- **Candidate cleanup is best-effort** — a failure to delete should NOT change the overall verdict from PASS to FAIL. Log the failure and move on.
- Read env vars from `.env.local` — never hardcode API keys in the curl commands.
