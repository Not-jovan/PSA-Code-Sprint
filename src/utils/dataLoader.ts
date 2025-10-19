// dataLoader.ts
// Fully updated loader with schema-safe validation, Excel skill transformation, and logging

import * as XLSX from "xlsx";
import { z } from "zod";
import {
  EmployeesSchema,
  SkillsCsvSchema,
  type EmployeeProfile,
  type SkillCsvRow,
  type SkillIndex,
} from "../validation/schemas";

/**
 * Validate parsed employees.json against Zod schema
 */
export async function loadEmployeesJson(path = "/Data/employees.json"): Promise<EmployeeProfile[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  const json = await res.json();

  const parsed = EmployeesSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Employee JSON validation errors:", parsed.error.format());
    throw new Error("Employee data is invalid");
  }
  return parsed.data;
}

/**
 * Validate parsed Excel rows against skill row schema
 */
export function validateSkillsCsv(rows: unknown[]): SkillCsvRow[] {
  return rows.filter((row, i) => {
    const parsed = SkillsCsvSchema.safeParse(row);
    if (!parsed.success) {
      console.warn(`Invalid skill row [${i}]`, parsed.error.format());
      return false;
    }
    return true;
  }) as SkillCsvRow[];
}

/**
 * Load and normalize the Functions_Skills.xlsx file
 */
export async function loadSkillsXlsx(url = "/Data/Functions_Skills.xlsx"): Promise<SkillCsvRow[]> {
  const res = await fetch(url);
  console.log("Fetching skills file from:", url);
  if (!res.ok) throw new Error(`Failed to fetch ${url} (${res.status})`);
  const arrayBuffer = await res.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

  const normalizedData: SkillCsvRow[] = rawData.map((rowRaw) => {
    const row = rowRaw as Record<string, string>;
    const function_area = (row["Function / Unit / Skill"] || "").trim();
    const specialization = (row["Specialisation / Unit"] || "").trim();
    const skill_name = specialization.includes(":")
      ? (specialization.split(":").pop() || "").trim()
      : specialization;
    return { function_area, specialization, skill_name };
  });

  return validateSkillsCsv(normalizedData);
}

/**
 * Build a quick index for skill name lookups
 */
export function indexSkills(rows: SkillCsvRow[]): SkillIndex {
  const index: SkillIndex = {};
  for (const row of rows) {
    index[row.skill_name] = row;
  }
  return index;
}

/**
 * Mark each employee's skills with an `in_taxonomy` boolean based on the index
 */
export function annotateEmployeeSkills(
  employees: EmployeeProfile[],
  index: SkillIndex
): EmployeeProfile[] {
  return employees.map((employee) => {
    const updatedSkills = (employee.skills || []).map((s) => ({
      ...s,
      in_taxonomy: !!index[s.skill_name],
    }));
    return { ...employee, skills: updatedSkills };
  });
}
