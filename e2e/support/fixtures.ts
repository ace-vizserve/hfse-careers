/**
 * Stand-ins for the two Manatal responses the apply page loads at mount. Field
 * `name` must equal the Zod schema key, because the page derives the form path
 * from `slug || name || id`. IDs mirror the real Manatal custom-field IDs where
 * the page branches on them (resume is matched by id 1741683).
 */

export const JOB_ID = "999001";

/**
 * Manatal returns an organization id; the name, logo and site are attached from
 * `entity_list` by matching it. An id that matches nothing leaves the job
 * without an employer, and the submitted payload then carries an empty
 * `organization_name` -- so this has to be a real one.
 */
export const JOB_ORGANIZATION_ID = 3779172;
export const JOB_ORGANIZATION_NAME = "HFSE International School";

export const jobFixture = {
  id: Number(JOB_ID),
  position_name: "Secondary Mathematics Teacher",
  location: "Singapore",
  employment_type: "Full time",
  description: "<p>Teach secondary mathematics.</p>",
  organization: JOB_ORGANIZATION_ID,
};

type FixtureField = {
  id: number | string;
  name: string;
  label: string;
  type: string;
  required?: boolean;
  fieldCategory?: string;
  options?: string[];
};

export const formFieldsFixture: FixtureField[] = [
  { id: 1741678, name: "expected_salary", label: "Expected Salary", type: "text", required: true },
  { id: 1741681, name: "linkedin", label: "LinkedIn Profile URL", type: "url", fieldCategory: "social_media" },
  { id: 1741702, name: "industries", label: "Work Industry", type: "text", required: true },
  { id: 1741682, name: "years_of_experience", label: "Years of Experience", type: "integer", required: true },
  { id: 1741683, name: "resume", label: "Resume", type: "file", required: true, fieldCategory: "resume" },
  { id: 1741684, name: "preferredsubjectsandlevels", label: "Preferred Subjects and Levels", type: "text" },

  { id: 1741679, name: "full_name", label: "Full Name", type: "text", required: true },
  { id: 1741685, name: "preferredname", label: "Preferred Name", type: "text", required: true },
  { id: 1741686, name: "residentialstatus", label: "Residential Status", type: "select", required: true },
  { id: 1742127, name: "nationalities", label: "Nationality", type: "text", required: true },
  { id: 1741687, name: "birth_date", label: "Date of Birth", type: "date", required: true },
  { id: 1741688, name: "gender", label: "Gender", type: "select", required: true },
  { id: 1741689, name: "religion", label: "Religion", type: "text", required: true },
  { id: 1741690, name: "nricfin", label: "NRIC/FIN", type: "text", required: true },
  { id: 1741692, name: "latest_degree", label: "Highest Qualification", type: "select", required: true },
  { id: 1741693, name: "passportno", label: "Passport Number", type: "text", required: true },
  { id: 1741694, name: "placedateofissue", label: "Place & Date of Issue", type: "text", required: true },

  { id: 1741695, name: "phone_number", label: "WhatsApp Number", type: "tel", required: true },
  { id: 1741680, name: "email", label: "Email", type: "email", required: true },
  { id: 1741696, name: "address", label: "Complete Address", type: "text", required: true },
  { id: 1741697, name: "postalcode", label: "Postal Code", type: "text", required: true },
  // Only rendered once Residential Status is "Foreigner".
  { id: 1741691, name: "overseasaddress", label: "Overseas Address", type: "text" },
  { id: 1741698, name: "workpermitpass", label: "Work Pass", type: "select" },

  { id: 1741699, name: "name", label: "Emergency Contact Name", type: "text", required: true },
  { id: 1741700, name: "relationship", label: "Emergency Contact Relationship", type: "text", required: true },
  { id: 1741701, name: "address_b", label: "Emergency Contact Address", type: "text", required: true },
  { id: 1741703, name: "mobilenumber", label: "Emergency Contact Mobile Number", type: "tel", required: true },
  { id: 1741704, name: "hometelephonenumber", label: "Emergency Contact Home Telephone Number", type: "tel" },
  { id: 1741705, name: "officetelephonenumber", label: "Emergency Contact Office Telephone Number", type: "tel" },
  { id: 1741706, name: "emailaddress", label: "Emergency Contact Email Address", type: "email", required: true },

  // Section fields rather than inputs: the form renders education and
  // experience from its own schema, and only reaches into Manatal's field list
  // to find the ids to file them under. Without these two the submitted
  // payload silently carries neither.
  { id: 1741715, name: "educations", label: "Education", type: "section" },
  { id: 1741716, name: "experiences", label: "Employment History", type: "section" },

  { id: 1741710, name: "coursename", label: "Course Name", type: "text" },
  { id: 1741711, name: "coursestartdate", label: "Course Start Date", type: "date" },
  { id: 1741712, name: "expectedyearofcompletion", label: "Expected Year of Completion", type: "integer" },

  { id: 1741713, name: "membershipsassociations", label: "Memberships & Associations", type: "textarea" },
  {
    id: 1741714,
    name: "description",
    label: "Briefly share your skills, experiences, and achievements beyond your resume",
    type: "textarea",
  },
];

/** A tiny but genuine PDF, so the dropzone's type/size checks pass. */
export const resumePdf = {
  name: "alex-tan-resume.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from(
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
      "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
      "3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj\n" +
      "trailer<</Root 1 0 R>>\n%%EOF\n",
    "utf8",
  ),
};

export const applicant = {
  fullName: "Alex Tan",
  preferredName: "Alex",
  email: "alex.tan.e2e@example.com",
  phone: "+6591234567",
  nationality: "Singaporean",
  nric: "S1234567A",
};
