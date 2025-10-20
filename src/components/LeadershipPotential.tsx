// LeadershipPotential.tsx
import { useEffect, useState } from "react";

export default function LeadershipPotential() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [allResults, setAllResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);  // controls the toggle
  const [viewAll, setViewAll] = useState(false);

  // ✅ fetch whoami on mount so the toggle can render immediately
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/whoami", {
          method: "GET",
          credentials: "include", // send session cookie
        });
        if (!res.ok) return;
        const data = await res.json();
        // coerce to number, then boolean
        setIsAdmin(Number(data.isadmin) === 1);
      } catch (e) {
        // ignore – just means not logged in or no cookie
      }
    })();
  }, []);

  const handleEvaluate = async () => {
    setError(null); setLoading(true); setResult(null); setAllResults([]);
    try {
      if (isAdmin && viewAll) {
        const r = await fetch("http://localhost:8080/api/leadership/all?noai=1", {
          method: "GET",
          credentials: "include",
        });
        if (!r.ok) throw new Error(await r.text());
        const d = await r.json();
        setAllResults(d.results || []);
      } else {
        const r = await fetch("http://localhost:8080/api/leadership/me", {
          method: "GET",
          credentials: "include",
        });
        if (!r.ok) throw new Error(await r.text());
        const d = await r.json();
        setResult(d);
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Leadership Potential</h1>

        {/* ✅ toggle only if admin */}
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={viewAll}
              onChange={(e) => setViewAll(e.target.checked)}
            />
            View All Employees (Admin)
          </label>
        )}
      </div>

      <button
        onClick={handleEvaluate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Loading..." : viewAll ? "Load All Employees" : "View My Leadership Score"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {!viewAll && result && (
        <div className="bg-white p-4 rounded shadow mt-6">
          <h3 className="text-lg font-semibold">{result.name}</h3>
          <p className="text-sm text-gray-700">Leadership Score: <strong>{result.leadership_score}</strong></p>
          <h4 className="font-medium mt-3 mb-1">Dimension Scores</h4>
          <pre className="bg-gray-50 text-xs p-2 rounded overflow-auto">
            {JSON.stringify(result.dimension_scores, null, 2)}
          </pre>
          <h4 className="font-medium mt-3 mb-1">AI Summary</h4>
          <p className="text-gray-600 mt-2 whitespace-pre-line">{result.ai_summary}</p>
        </div>
      )}

      {viewAll && allResults.length > 0 && (
        <div className="mt-6 space-y-4">
          {allResults.map((r) => (
            <div key={r.employee_id} className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold">{r.name}</h3>
              <p className="text-sm text-gray-700">Leadership Score: <strong>{r.leadership_score}</strong></p>
              <pre className="bg-gray-50 text-xs p-2 rounded overflow-auto mt-2">
                {JSON.stringify(r.dimension_scores, null, 2)}
              </pre>
              <p className="text-gray-600 mt-2 whitespace-pre-line">{r.ai_summary}</p>
            </div>
          ))}
        </div>
      )}

      {viewAll && allResults.length === 0 && !loading && (
        <p className="text-gray-500 mt-4">No data available.</p>
      )}
    </div>
  );
}
