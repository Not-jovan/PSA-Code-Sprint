import Papa from "papaparse";
import * as XLSX from "xlsx";
import { validateEmployees, validateSkillsCsv, type EmployeeProfile } from "../validation/schemas";

export async function loadEmployeesJson(
    url = "public/Data/employees.json"
  ): Promise<EmployeeProfile[]> {
    console.log("Fetching employees.json from:", url);
    const res = await fetch(url);
    const text = await res.text(); // Read the raw response as text
    console.log("Raw response:", text);
  
    if (!res.ok) {
      console.error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
      throw new Error(`Failed to fetch ${url} (${res.status})`);
    }
  
    try {
      const raw = JSON.parse(text); // Parse the JSON
      console.log("Parsed JSON:", raw);
      const validated = validateEmployees(raw);
      console.log("Validated employees data:", validated);
      return validated;
    } catch (e) {
      console.error("Error parsing or validating JSON:", e);
      throw new Error("Invalid employees data format.");
    }
  }

  
export type SkillCsvRow = {
  function_area: string;
  specialization: string;
  skill_name: string;
};

export async function loadSkillsXlsx(
    url = "public/Data/Functions & Skills.xlsx"
  ): Promise<SkillCsvRow[]> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
    const arrayBuffer = await res.arrayBuffer();
  
    // Parse XLSX file
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0]; // Use the first sheet
    const sheet = workbook.Sheets[sheetName];
  
    // Convert the sheet to JSON
    const jsonData: SkillCsvRow[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "", // Default value for empty cells
      raw: false, // Parse values as strings
    });
  
    console.log("Raw parsed XLSX data:", jsonData); // Log the raw parsed data
  
    // Validate the parsed data
    const rows = validateSkillsCsv(jsonData);
    return rows;
  }

/** Optional helper:
 * index skills for quick lookups (function_area + specialization + skill_name -> true)
 */
export function indexSkills(rows: SkillCsvRow[]) {
  const set = new Set<string>();
  for (const r of rows) {
    set.add(keyOf(r.function_area, r.specialization, r.skill_name));
  }
  return {
    has(function_area: string, specialization: string, skill_name: string) {
      return set.has(keyOf(function_area, specialization, skill_name));
    },
  };
}

function keyOf(fa: string, sp: string, sn: string) {
  return `${fa}__${sp}__${sn}`.toLowerCase();
}

/** Optional helper:
 * annotate each employee's skills with a flag whether it exists in the taxonomy CSV
 */
export function annotateEmployeeSkills(
  employees: EmployeeProfile[],
  skillsIndex: ReturnType<typeof indexSkills>
) {
  return employees.map((e) => {
    const enrichedSkills =
      e.skills?.map((s) => ({
        ...s,
        in_taxonomy: skillsIndex.has(s.function_area, s.specialization, s.skill_name),
      })) ?? [];
    return { ...e, skills: enrichedSkills as any };
  });
}
