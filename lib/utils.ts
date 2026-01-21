import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ===========================
   TAILWIND CLASS MERGE
=========================== */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ===========================
   CHARACTER REFERENCES
=========================== */
type Reference = {
  name: string;
  email: string;
  contact_no: string;
  company_occupation: string;
  relationship: string;
};

export function formatReferencesToHTML(refs: Reference[]): string {
  return `
<ol>
  ${refs
    .map(
      (ref) => `
    <li>
      <ul>
        <li><strong>Name:</strong> ${ref.name}</li>
        <li><strong>Email:</strong> ${ref.email}</li>
        <li><strong>Contact Number:</strong> ${ref.contact_no}</li>
        <li><strong>Occupation & Company:</strong> ${ref.company_occupation}</li>
        <li><strong>Relationship to Applicant:</strong> ${ref.relationship}</li>
      </ul>
    </li>
  `
    )
    .join("")}
</ol>
`.trim();
}

/* ===========================
   DECLARATIONS
=========================== */
type DeclarationAnswer = {
  answer: "Yes" | "No";
  details?: string;
};

export function generateDeclarationList(
  declarations: Record<number, DeclarationAnswer>
): string {
  const declarationQuestions = [
    "Have you been or are you suffering from any disease/major medical condition/mental illness or physical impairment?",
    "Have you been discharged or dismissed from the service of your previous employers?",
    "Have you been convicted in a Court of law in any country or any ongoing legal proceedings?",
    "Have you been served with a Garnishee Order by any organisation or been declared a bankrupt?",
    "Have you any relatives and/or friends who have worked or are working in HFSE International School?",
  ];

  return `
<ol>
  ${declarationQuestions
    .map((question, idx) => {
      const data = declarations[idx];

      return `
    <li>
      ${question}
      <ul>
        <li><strong>Answer:</strong> ${data?.answer || "-"}</li>
        ${
          data?.answer === "Yes" && data.details?.trim()
            ? `<li><strong>Details:</strong> ${data.details}</li>`
            : ""
        }
      </ul>
    </li>
  `;
    })
    .join("")}
</ol>
`.trim();
}
