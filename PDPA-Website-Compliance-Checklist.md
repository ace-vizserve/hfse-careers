# PDPA Compliance Checklist for Website Development

A reference guide derived from Singapore's Personal Data Protection Act (PDPA) to apply when designing, building, or auditing a website that collects or processes personal data.

---

## 1. Know What Counts as Personal Data

- Treat as personal data anything that can identify an individual, either alone or combined with other data the organisation has/can access (e.g. NRIC, photos with a visible face, full name + contact details).
- A residential address _alone_ is less likely to identify someone, but avoid relying on this — context can change the assessment.
- **Website checklist:**
  - [ ] Inventory every field your site collects (forms, cookies, analytics, account signup) and flag which are personal data.
  - [ ] Don't assume a data point is "safe" just because it seems generic — check combination risk.

## 2. Business Contact Information (BCI) vs Personal Data

- BCI (name, title, business phone/email/address given in a business capacity) is **exempted** from most PDPA consent obligations — but only when collected for a business purpose.
- If the same business card/info is given for a **personal/consumer transaction** (e.g. signing up for a personal gym membership), it is **not** BCI and full PDPA obligations apply.
- **Website checklist:**
  - [ ] Distinguish B2B contact forms (BCI, lighter obligations) from B2C signup/checkout forms (full personal data obligations).
  - [ ] Don't mislabel consumer-facing forms as "business contact" to sidestep consent requirements.

## 3. Notification & Purpose Specification

- Users must be told **specific, clear purposes** for collection, use, and disclosure — including any third parties/affiliates/vendors data will be shared with.
- Vague catch-all language (e.g. "used for any purpose we deem fit," or unnamed "affiliates/partners") is **not** sufficient notification.
- **Website checklist:**
  - [ ] Write a specific, itemised privacy notice/policy — no generic blanket clauses.
  - [ ] Name categories of third parties (e.g. "our logistics partner," "our email marketing vendor") rather than leaving it open-ended.
  - [ ] Display the notice prominently at the point of collection (e.g. modal, banner, or inline near the form), not buried in a footer link only.

## 4. Consent Requirements

- Consent must be **clear and unambiguous** — silence, inaction, or failure to opt out does **not** count as valid consent.
- Pre-ticked checkboxes or "opt-out by default" marketing consent designs are non-compliant.
- Verbal consent must be **documented in writing** by the organisation collecting it.
- Users have the right to **withdraw consent** at any time; you must honor withdrawal, but should first inform them of consequences (e.g. inability to continue providing the service).
- **Website checklist:**
  - [ ] Use unchecked, opt-in checkboxes for marketing/non-essential data uses — never pre-checked.
  - [ ] Build a consent withdrawal mechanism (e.g. account settings, unsubscribe link, support request flow).
  - [ ] When consent is withdrawn, show/send a message explaining service impact before final termination.
  - [ ] If consent is captured verbally (e.g. via a call center feature), log it in writing/system record.

## 5. Deemed Consent

- Consent can be **deemed** in specific circumstances, including:
  - **By conduct** (individual voluntarily provides data for an obvious purpose).
  - **By contractual necessity** (data must be disclosed to a third party to perform the contract, e.g. a delivery partner).
  - **By notification** (with a right to opt out, under specific conditions defined by PDPC).
- **Website checklist:**
  - [ ] Where you rely on deemed consent (e.g. sharing address with a delivery partner to fulfill an order), document why it qualifies and disclose it in your privacy notice anyway.

## 6. Marketing & "Do Not Call" (DNC) Compliance

- If sending marketing SMS/calls/faxes to Singapore numbers, you must:
  - [ ] Clearly identify your organisation as the sender.
  - [ ] Provide accurate, reachable contact information (e.g. valid SG phone number).
  - [ ] Ensure contact/identifying info stays valid for a reasonable period after sending.
  - [ ] Check numbers against the DNC Registry before sending, unless clear consent/exemption applies.
- If you **outsource marketing** (e.g. to a call center or vendor), **both your organisation and the vendor** are considered "senders" and are jointly responsible for DNC compliance.
- **Website checklist:**
  - [ ] Build DNC registry-check into any SMS/telemarketing signup flow.
  - [ ] Contractually bind any marketing vendor/processor to PDPA obligations.

## 7. Legitimate Interest Exception

- Can be used for things like fraud detection, security threats, network/IT security, or preventing misuse of services — **without** consent.
- **Cannot** be used to justify personalisation of goods/services — that still requires consent or another valid basis.
- **Website checklist:**
  - [ ] Don't use "legitimate interest" as a blanket excuse for personalization/recommendation engines or targeted ads — get proper consent instead.
  - [ ] Reserve this basis for security/fraud-prevention features (e.g. bot detection, account takeover prevention).

## 8. Retention & Disposal

- Cease retaining personal data as soon as:
  - The purpose it was collected for is no longer served, **and**
  - Retention is no longer necessary for legal or business purposes (e.g. audit, tax, dispute resolution).
- Acceptable ways to "cease retention":
  - Secure destruction/disposal (e.g. shredding, secure deletion).
  - Anonymisation (removing means to re-identify the individual).
  - Returning/transferring data per the individual's instruction.
- **Recycling paper documents is NOT sufficient disposal** — use shredding, incineration, or pulping instead.
- **Website checklist:**
  - [ ] Define and document data retention periods per data category (e.g. account data, order history, marketing leads).
  - [ ] Build automated deletion/anonymisation jobs for expired data (cron jobs, scheduled purges).
  - [ ] Ensure backend/database deletion also covers backups, logs, and third-party processor copies.
  - [ ] For any physical records generated by the site (e.g. printed invoices), specify shredding/incineration in your ops process — never recycling bins.

## 9. Access & Correction Requests

- Individuals can request:
  - Access to their personal data and how it's been used/disclosed.
  - Correction of inaccurate data.
- For access requests, organisations generally only need to provide info on usage/disclosure within the **past 1 year** before the request date, and may withhold info covered by PDPA exceptions/prohibitions.
- Before fulfilling a request, verify:
  - The requester's identity.
  - If made on behalf of someone else, that the requester is legally authorised to act for that individual.
- **Website checklist:**
  - [ ] Build a "Download my data" / "Request my data" feature or documented manual process.
  - [ ] Add identity verification step (e.g. verified login, ID check) before releasing data.
  - [ ] Add a data correction/update flow (e.g. editable profile fields, or a support request path).
  - [ ] Cap default disclosure history shown/exported to the last 12 months unless otherwise required.

## 10. Data Breach Notification

When a data breach occurs, notifications to affected individuals should include (where applicable):

- [ ] Facts of the breach.
- [ ] Data breach management and remediation plan/steps taken.
- [ ] Contact details for the organisation (how affected individuals can reach you).
- ❌ You do **not** need to disclose information about _other_ affected individuals in a notification to any one individual.

**Website checklist:**

- [ ] Prepare an incident response / breach notification template in advance.
- [ ] Build monitoring/alerting so breaches (e.g. leaked DB, exposed API) are detected quickly — PDPA has mandatory notification timelines to PDPC and affected individuals for notifiable breaches.
- [ ] Ensure your breach comms never expose details of _other_ affected users.

## 11. Cross-Border Data Transfers

Transferring personal data outside Singapore (e.g. cloud hosting, overseas vendors) is compliant when:

- [ ] Data is merely in transit through Singapore, **or**
- [ ] Data is already publicly available in Singapore, **or**
- [ ] Transfer is necessary to fulfil a contract with the individual, **or**
- [ ] Comparable safeguards required under PDPA are otherwise in place (e.g. contractual clauses with the overseas recipient).

**Website checklist:**

- [ ] Document where your hosting, CDN, analytics, email, and payment providers store/process data.
- [ ] Ensure contracts with overseas processors include data protection clauses (comparable to PDPA standards).
- [ ] Disclose in your privacy policy which providers/countries data may be transferred to.

## 12. Security Safeguards (Protection Obligation)

Organisations must implement **administrative, physical, and technical** safeguards:

**Administrative**

- [ ] Regular staff/developer training on data handling.
- [ ] Collect and retain only the appropriate/minimum amount of personal data (data minimisation).

**Physical**

- [ ] Restrict access to confidential records/servers on a need-to-know basis.
- [ ] Secure disposal of physical documents (shred/incinerate/pulp — not recycle).
- [ ] Lock physical storage (file cabinets, server rooms).

**Technical**

- [ ] Auto-lock/auto-logout for idle sessions (admin panels, CMS, dashboards).
- [ ] Secure network configuration (HTTPS/TLS, firewalls, up-to-date security patches).
- [ ] Encrypt personal data at rest and in transit.
- [ ] Use role-based access control (RBAC) in the backend/CMS.
- [ ] Appropriate security software and settings on all servers/endpoints.

## 13. Accountability & Governance

- [ ] Appoint at least one **Data Protection Officer (DPO)** — this can be a dedicated role, an added responsibility for an existing employee, **or outsourced to a third party** (a DPO does _not_ have to be an employee).
- [ ] Ensure the DPO's contact is readily accessible from Singapore (published on the site, e.g. in the privacy policy/contact page).
- [ ] Consider implementing a Data Protection Management Programme (DPMP).
- [ ] Consider conducting a Data Protection Impact Assessment (DPIA) for higher-risk features (e.g. new data collection, profiling, third-party integrations).
- [ ] Consider pursuing Data Protection Trustmark (DPTM) certification for credibility.

## 14. Data Accuracy & Completeness

- [ ] Collect all relevant parts of required data at the point of entry (avoid partial/incomplete forms).
- [ ] Validate and record data accurately at the point of collection (form validation, confirmation steps).
- [ ] Provide users a way to update/correct their information (self-service profile edits or support request).

---

## Quick Pre-Launch Website Audit

- [ ] Privacy policy published, specific (not generic), and covers all collection/use/disclosure purposes.
- [ ] All marketing consent checkboxes are opt-in, unchecked by default.
- [ ] Consent withdrawal and account/data deletion flows exist and work.
- [ ] Retention periods defined and enforced with automated purging/anonymisation.
- [ ] Data access/correction request process exists and includes identity verification.
- [ ] Breach response plan and notification templates prepared in advance.
- [ ] Third-party/overseas data processors contractually bound to PDPA-equivalent protections.
- [ ] HTTPS, encryption, RBAC, and session timeouts implemented site-wide.
- [ ] DPO appointed and contact info published.
- [ ] DNC registry check integrated for any SMS/call marketing features.

---

_This checklist is a practical development reference based on common PDPA assessment scenarios and is not a substitute for legal advice. For binding compliance decisions, consult PDPC's official Advisory Guidelines or a qualified data protection professional._
