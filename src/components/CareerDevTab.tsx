import React from "react";
import type { EmployeeProfile } from "../validation/schemas";

type Props = {
  user: EmployeeProfile;
  employees: EmployeeProfile[];
};

const CareerDevTab: React.FC<Props> = ({ user, employees }) => {
  // EMPLOYEE VIEW
  if (user.employee_id) {
    const profile = employees.find((e) => e.employee_id === user.employee_id);
    const currentRole = profile?.employment_info.job_title ?? "N/A";

    // Demo suggestions based on title
    const title = currentRole.toLowerCase();
    const nextRoles = title.includes("cloud")
      ? ["Lead Cloud Architect", "Cloud Infrastructure Manager"]
      : title.includes("analyst")
      ? ["Senior Analyst", "Team Lead"]
      : ["Expanded Role in Current Field", "Cross-functional Project Lead"];

    const training = title.includes("cloud")
      ? ["AWS/Azure Solutions Architect Certification", "Advanced Cloud Security Training"]
      : title.includes("analyst")
      ? ["Professional Certification (e.g. CISSP for cybersecurity)", "Leadership & Management Workshop"]
      : ["Advanced skills training in specialization", "Management 101 course"];

    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">My Career Development</h2>
        <p className="mb-2">
          Current Role: <strong>{currentRole}</strong>
        </p>

        <div className="mb-4">
          <h4 className="font-medium">Potential Next Roles:</h4>
          <ul className="list-disc list-inside">
            {nextRoles.map((role, idx) => (
              <li key={idx}>{role}</li>
            ))}
          </ul>
        </div>

        <div className="mb-4">
          <h4 className="font-medium">Recommended Training & Upskilling:</h4>
          <ul className="list-disc list-inside">
            {training.map((course, idx) => (
              <li key={idx}>{course}</li>
            ))}
          </ul>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm">
          *These suggestions are based on your current role and skill set. Consider discussing with your
          manager or a mentor for personalized career advice.*
        </p>
      </div>
    );
  }

  // MANAGER VIEW
  const getMetrics = (emp: EmployeeProfile) => {
    const role = emp.employment_info.job_title.toLowerCase();

    // Calculate years in role (YYYY-MM-DD → YYYY)
    const startYearStr = emp.employment_info.in_role_since?.slice(0, 4) ?? "";
    const startYear = Number(startYearStr);
    const yearsInRole =
      Number.isFinite(startYear) && startYear > 0
        ? new Date().getFullYear() - startYear
        : 0;

    let promotionChance = "50%";
    let leadershipPotential = "Medium";

    if (yearsInRole >= 3) promotionChance = "70%";
    if (yearsInRole >= 5) promotionChance = "85%";
    if (role.includes("manager") || role.includes("lead")) leadershipPotential = "High";

    const hasLeadershipComp = (emp.competencies ?? []).some(
      (c) => c.name.toLowerCase().includes("management") && c.level === "Advanced"
    );
    if (hasLeadershipComp) leadershipPotential = "High";

    // Demo overrides to vary output (optional)
    switch (emp.employee_id) {
      case "EMP-20001":
        promotionChance = "80%";
        leadershipPotential = "High";
        break;
      case "EMP-20002":
        promotionChance = "30%";
        leadershipPotential = "Medium";
        break;
      case "EMP-20003":
        promotionChance = "70%";
        leadershipPotential = "High";
        break;
      case "EMP-20004":
        promotionChance = "60%";
        leadershipPotential = "High";
        break;
      case "EMP-20005":
        promotionChance = "40%";
        leadershipPotential = "Medium";
        break;
    }

    return { promotionChance, leadershipPotential };
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Team Career Insights</h2>
      <p className="mb-4">Overview of team members' promotion readiness and leadership potential:</p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-200 dark:bg-gray-700 text-left">
            <tr>
              <th className="px-2 py-1">Name</th>
              <th className="px-2 py-1">Current Role</th>
              <th className="px-2 py-1">Promotion Probability</th>
              <th className="px-2 py-1">Leadership Potential</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const metrics = getMetrics(emp);
              return (
                <tr key={emp.employee_id} className="border-t border-gray-300 dark:border-gray-700">
                  <td className="px-2 py-1">{emp.personal_info.name}</td>
                  <td className="px-2 py-1">{emp.employment_info.job_title}</td>
                  <td className="px-2 py-1">{metrics.promotionChance}</td>
                  <td className="px-2 py-1">{metrics.leadershipPotential}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
        *These metrics are autogenerated for demonstration. In a real system, they'd be based on HR analytics data.*
      </p>
    </div>
  );
};

export default CareerDevTab;