import React, { useMemo, useState } from "react";
import type { EmployeeProfile } from "../validation/schemas";

/** UI helpers */
const badge = (text: string, tone: "neutral" | "success" | "warn" | "info") => {
  const classes: Record<typeof tone, string> = {
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800/70 dark:text-gray-200 ring-1 ring-gray-300/70 dark:ring-gray-700",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 ring-1 ring-emerald-200/60 dark:ring-emerald-700",
    warn: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 ring-1 ring-amber-200/60 dark:ring-amber-700",
    info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 ring-1 ring-blue-200/60 dark:ring-blue-700",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classes[tone]}`}>{text}</span>;
};
const potentialTone = (p: string) => (p.toLowerCase() === "high" ? "success" : p.toLowerCase() === "medium" ? "info" : "neutral");
const percentToBar = (p: string) => Math.max(0, Math.min(100, Number((p || "0").replace("%", "")) || 0));
const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-3">
    <h3 className="text-base md:text-lg font-semibold tracking-tight">{title}</h3>
    {subtitle && <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
  </div>
);

type Props = {
  user: EmployeeProfile & { isadmin?: number };
  employees: EmployeeProfile[];
};

const CareerDevTab: React.FC<Props> = ({ user, employees }) => {
  /** --------- TOP-LEVEL HOOKS ONLY (always in same order) --------- */
  const isAdmin = Number((user as any).isadmin) === 1;
  const [adminView, setAdminView] = useState<"my" | "team">(isAdmin ? "team" : "my");
  const [query, setQuery] = useState(""); // used only in team view, but declared unconditionally
  const [sortBy, setSortBy] = useState<"name" | "role" | "promotion" | "potential">("promotion");

  // helper (no hooks inside)
  const getMetrics = (emp: EmployeeProfile) => {
    const role = emp.employment_info.job_title?.toLowerCase?.() ?? "";
    const startYearStr = emp.employment_info.in_role_since?.slice(0, 4) ?? "";
    const startYear = Number(startYearStr);
    const yearsInRole = Number.isFinite(startYear) && startYear > 0 ? new Date().getFullYear() - startYear : 0;

    let promotionChance = "50%";
    let leadershipPotential = "Medium";
    if (yearsInRole >= 3) promotionChance = "70%";
    if (yearsInRole >= 5) promotionChance = "85%";
    if (role.includes("manager") || role.includes("lead")) leadershipPotential = "High";

    const hasLeadershipComp = (emp.competencies ?? []).some(
      (c) => c.name.toLowerCase().includes("management") && c.level === "Advanced"
    );
    if (hasLeadershipComp) leadershipPotential = "High";

    switch (emp.employee_id) {
      case "EMP-20001": promotionChance = "80%"; leadershipPotential = "High"; break;
      case "EMP-20002": promotionChance = "30%"; leadershipPotential = "Medium"; break;
      case "EMP-20003": promotionChance = "70%"; leadershipPotential = "High"; break;
      case "EMP-20004": promotionChance = "60%"; leadershipPotential = "High"; break;
      case "EMP-20005": promotionChance = "40%"; leadershipPotential = "Medium"; break;
    }
    return { promotionChance, leadershipPotential };
  };

  // rows computed unconditionally; only rendered in team view
  const rows = useMemo(() => {
    const base = employees.map((e) => {
      const m = getMetrics(e);
      return { id: e.employee_id, name: e.personal_info.name, role: e.employment_info.job_title, promotion: m.promotionChance, potential: m.leadershipPotential };
    });
    const filtered = query
      ? base.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.role.toLowerCase().includes(query.toLowerCase()))
      : base;
    const sorter: Record<typeof sortBy, (a: any, b: any) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      role: (a, b) => a.role.localeCompare(b.role),
      promotion: (a, b) => percentToBar(b.promotion) - percentToBar(a.promotion),
      potential: (a, b) => ({ High: 3, Medium: 2, Low: 1 } as any)[b.potential] - ({ High: 3, Medium: 2, Low: 1 } as any)[a.potential],
    };
    return filtered.sort(sorter[sortBy]);
  }, [employees, query, sortBy]); // ✅ stable deps

  /** View selection */
  const showSelf = isAdmin ? adminView === "my" : !!user.employee_id;

  /** --------- RENDER --------- */
  if (showSelf) {
    const profile = employees.find((e) => e.employee_id === user.employee_id);
    const currentRole = profile?.employment_info.job_title ?? "N/A";
    const title = (currentRole || "").toLowerCase();
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
      <div className="space-y-6">
        {isAdmin && (
          <div className="mb-1 flex gap-2">
            <button onClick={() => setAdminView("my")} className={`px-3 py-1 rounded ${adminView === "my" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>My Career</button>
            <button onClick={() => setAdminView("team")} className={`px-3 py-1 rounded ${adminView === "team" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>Team Insights</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">My Career Development</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalised suggestions based on your current role and skills.</p>
          </div>
          <div className="flex items-center gap-2">
            {badge(currentRole, "neutral")}
            {badge("Future-Ready", "info")}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800"><SectionTitle title="Potential Next Roles" subtitle="Where you could grow next" /></div>
            <ul className="p-4 space-y-2">
              {nextRoles.map((role, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/50 px-3 py-2">
                  <span className="text-sm">{role}</span>{badge("Suggested", "success")}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800"><SectionTitle title="Recommended Training & Upskilling" subtitle="Build capabilities for the next step" /></div>
            <ul className="p-4 space-y-3">
              {training.map((course, idx) => (
                <li key={idx} className="group rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{course}</span>
                    <button className="opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded-md bg-blue-600 text-white" onClick={() => alert(`Added to learning plan: ${course}`)}>Add to Plan</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-xs">*Suggestions are generated for demonstration. Discuss with your manager or mentor for tailored guidance.</p>
      </div>
    );
  }

  /** Team view (no hooks created here) */
  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="mb-1 flex gap-2">
          <button onClick={() => setAdminView("my")} className={`px-3 py-1 rounded ${adminView === "my" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>My Career</button>
          <button onClick={() => setAdminView("team")} className={`px-3 py-1 rounded ${adminView === "team" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700"}`}>Team Insights</button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Team Career Insights</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview of promotion readiness and leadership potential across your team.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or role…"
              className="w-full sm:w-64 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute right-2 top-2.5 text-gray-400">⌘K</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="promotion">Sort by Promotion %</option>
            <option value="potential">Sort by Potential</option>
            <option value="name">Sort by Name</option>
            <option value="role">Sort by Role</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/40 text-left">
            <tr className="*:*:px-4 *:*:py-3 *:font-semibold">
              <th>Name</th>
              <th>Current Role</th>
              <th className="w-52">Promotion Probability</th>
              <th className="w-40">Leadership Potential</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, i) => {
              const pct = percentToBar(row.promotion);
              return (
                <tr key={row.id} className={i % 2 ? "bg-gray-50/40 dark:bg-gray-800/20" : ""}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-gray-500">ID: {row.id}</div>
                  </td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all ${pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums">{row.promotion}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{badge(row.potential, potentialTone(row.potential) as any)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No matching team members found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-gray-500 dark:text-gray-400 text-xs">
        *Metrics are autogenerated for demonstration. In a real system, they’d be based on HR analytics signals.
      </p>
    </div>
  );
};

export default CareerDevTab;
