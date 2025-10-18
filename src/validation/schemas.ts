import { z } from "zod";

/** --- Employees --- */
export const LanguageSchema = z.object({
  language: z.string(),
  proficiency: z.enum(["Fluent", "Intermediate", "Basic"]),
});

export const PersonalInfoSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  office_location: z.string(),
  languages: z.array(LanguageSchema),
});

export const EmploymentInfoSchema = z.object({
  job_title: z.string(),
  department: z.string(),
  unit: z.string(),
  line_manager: z.string(),
  in_role_since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export const SkillSchema = z.object({
  function_area: z.string(),
  specialization: z.string(),
  skill_name: z.string(),
});

export const CompetencySchema = z.object({
  name: z.string(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export const PeriodSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").nullable(),
});

export const PositionHistorySchema = z.object({
  role_title: z.string(),
  organization: z.string(),
  period: PeriodSchema,
  focus_areas: z.array(z.string()).optional(),
  key_skills_used: z.array(z.string()).optional(),
});

export const ProjectSchema = z.object({
  project_name: z.string(),
  role: z.string(),
  period: PeriodSchema,
  description: z.string(),
  outcomes: z.array(z.string()).optional(),
});

export const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  period: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  }),
});

export const EmployeeProfileSchema = z.object({
  employee_id: z.string(),
  personal_info: PersonalInfoSchema,
  employment_info: EmploymentInfoSchema,
  skills: z.array(SkillSchema).optional(),
  competencies: z.array(CompetencySchema).optional(),
  positions_history: z.array(PositionHistorySchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  education: z.array(EducationSchema).optional(),
});

export const EmployeesSchema = z.array(EmployeeProfileSchema);
export type EmployeeProfile = z.infer<typeof EmployeeProfileSchema>;

/** --- Skills CSV rows ---
 * Expect a headered CSV like:
 * function_area,specialization,skill_name
 * Info Tech: Infrastructure,Cloud Computing: Cloud Architecture,Cloud Architecture
 */
export const SkillsCsvSchema = z.object({
    function_area: z.string().min(1, "Function area is required"),
    specialization: z.string().min(1, "Specialization is required"),
    skill_name: z.string().min(1, "Skill name is required"),
  });
  

export function validateEmployees(raw: unknown) {
    console.log("Validating employees data...");
    const parsed = EmployeeProfileSchema.array().safeParse(raw);
    if (!parsed.success) {
      console.error("Validation errors:", parsed.error.format());
      // Ensure raw is an array before filtering
      if (Array.isArray(raw)) {
        const validEntries = raw.filter((entry, index) => !parsed.error.errors.some(e => e.path[0] === index));
        console.warn("Some entries were invalid and have been skipped.");
        return validEntries;
      } else {
        console.error("Invalid data format: expected an array.");
        return [];
      }
    }
    return parsed.data;
  }

  export function validateSkillsCsv(rawRows: unknown) {
    console.log("Raw rows before validation:", rawRows); // Log raw rows
    if (!Array.isArray(rawRows)) {
      console.error("Invalid data format: expected an array.");
      return [];
    }
    const parsed = SkillsCsvSchema.array().safeParse(rawRows);
    if (!parsed.success) {
      console.warn("Some rows failed validation and will be skipped:", parsed.error.format());
      const validRows = rawRows.filter((row, index) =>
        !parsed.error.errors.some((e) => e.path[0] === index)
      );
      return validRows;
    }
    return parsed.data;
  }
