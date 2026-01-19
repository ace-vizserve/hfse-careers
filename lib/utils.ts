import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
        <li>Name : ${ref.name}</li>
        <li>Email : ${ref.email}</li>
        <li>Contact Number : ${ref.contact_no}</li>
        <li>Occupation & Company : ${ref.company_occupation}</li>
        <li>Relationship to Applicant : ${ref.relationship}</li>
      </ul>
    </li>
  `
    )
    .join("")}
</ol>
`.trim();
}

export function generateDeclarationList(declarations: Record<number, string>) {
  const answers = Object.values(declarations);
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
        .map((declaration, idx) => {
          const answer = answers[idx];

          return `
        <li>
          ${declaration}
          <ul>
            <li><strong>Answer:</strong> ${answer || "-"}</li>
           
          </ul>
        </li>
      `;
        })
        .join("")}
    </ol>
  `;
}
