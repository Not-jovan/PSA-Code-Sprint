import { useState } from "react";
import { validateEmployees } from "../validation/schemas";

export default function LeadershipPotential() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    try {
      setError(null);
      setLoading(true);

      // Load JSON from public/Data/employees.json
      const response = await fetch(`${process.env.PUBLIC_URL}/Data/employees.json`);
      if (!response.ok) throw new Error("Failed to load employees.json");

      const employeesData = await response.json();

      // Validate quietly — keep valid, skip invalid
      const validEmployees = validateEmployees(employeesData);
      if (!Array.isArray(validEmployees) || validEmployees.length === 0) {
        throw new Error("No valid employee entries found.");
      }

      // ---- CHANGE IS HERE ----
      // Option A: absolute URL (no proxy)
      const res = await fetch("http://localhost:8080/api/leadership/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: validEmployees }),
      });

      // // Option B: relative URL (use CRA proxy in package.json)
      // const res = await fetch("/api/leadership", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ employees: validEmployees }),
      // });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend evaluation failed (${res.status}): ${text}`);
      }

      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Leadership Potential Evaluation</h1>

      <button
        onClick={handleEvaluate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Evaluating..." : "Run Leadership Analysis"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-6 space-y-4">
        {results.map((r) => (
          <div key={r.employee_id} className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">{r.name}</h3>
            <p className="text-sm text-gray-700">
              Leadership Score: <strong>{r.leadership_score}</strong>
            </p>
            <pre className="bg-gray-50 text-xs p-2 rounded overflow-auto mt-2">
              {JSON.stringify(r.dimension_scores, null, 2)}
            </pre>
            <p className="text-gray-600 mt-2 whitespace-pre-line">{r.ai_summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
