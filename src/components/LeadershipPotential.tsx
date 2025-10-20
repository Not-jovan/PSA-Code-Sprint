import { useState } from "react";

export default function LeadershipPotential() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    try {
      setError(null);
      setLoading(true);
      setResult(null);

      // ✅ Call backend route for the logged-in user's leadership potential
      const res = await fetch("http://localhost:8080/api/leadership/me", {
        method: "GET",
        credentials: "include", // needed so Flask session (login) is recognized
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend evaluation failed (${res.status}): ${text}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">My Leadership Potential</h1>

      <button
        onClick={handleEvaluate}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Evaluating..." : "View My Leadership Score"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {result && (
        <div className="bg-white p-4 rounded shadow mt-6">
          <h3 className="text-lg font-semibold">{result.name}</h3>
          <p className="text-sm text-gray-700">
            Leadership Score: <strong>{result.leadership_score}</strong>
          </p>

          <h4 className="font-medium mt-3 mb-1">Dimension Scores</h4>
          <pre className="bg-gray-50 text-xs p-2 rounded overflow-auto">
            {JSON.stringify(result.dimension_scores, null, 2)}
          </pre>

          <h4 className="font-medium mt-3 mb-1">AI Summary</h4>
          <p className="text-gray-600 mt-2 whitespace-pre-line">{result.ai_summary}</p>
        </div>
      )}
    </div>
  );
}
