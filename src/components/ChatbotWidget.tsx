import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatMsg = { role: "user" | "assistant"; content: string };
type Mode = "mentor" | "support";

// ----- Hardened helpers -----
async function parseResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return { ok: res.ok, data: null, text: "" };
  }
  try {
    if (isJSON) {
      const data = await res.json();
      return { ok: res.ok, data, text: "" };
    } else {
      const text = await res.text();
      return { ok: res.ok, data: null, text };
    }
  } catch (_) {
    const text = await res.text().catch(() => "");
    return { ok: res.ok, data: null, text };
  }
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 25000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  const merged: RequestInit = { ...init, signal: ctrl.signal };
  return fetch(input, merged).finally(() => clearTimeout(id));
}

export default function ChatbotWidget() {
  const [mode, setMode] = useState<Mode>("support");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [vectorStoreId, setVectorStoreId] = useState<string | undefined>(undefined);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const handleSend = async () => {
    if (!canSend) return;

    const userText = input.trim();
    setInput("");
    const nextMessages = [...messages, { role: "user", content: userText } as ChatMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const history = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10);

      // Use REACT_APP_API_BASE_URL and fallback to an empty string if undefined
      const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
      const endpoint = `${baseUrl}/api/chat`;

      console.log("Final endpoint being used:", endpoint); // Debugging log

      const res = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        message: userText,
        history,
        vector_store_id: vectorStoreId || undefined,
      }),
      credentials: "include"
});

      const { ok, data, text } = await parseResponse(res);

      if (!ok) {
        const snippet = (data?.detail || data?.error || data?.upstream_body || text || "")
          .toString()
          .slice(0, 400);
        const errMsg = snippet
          ? `Request failed (${res.status}). ${snippet}`
          : `Request failed (${res.status}). No details provided.`;
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `Sorry, something went wrong: ${errMsg}` },
        ]);
        return;
      }

      const reply = data?.reply ?? (text ? text.slice(0, 400) : "…");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      const isAbort = e?.name === "AbortError";
      const msg = isAbort ? "Request timed out. Please try again." : (e?.message || "Network error");
      setMessages((m) => [...m, { role: "assistant", content: `Network error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[380px] max-h-[80vh] bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
<div className="p-4 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
  <div className="font-semibold text-gray-100">PSA Assistant</div>
  <div className="flex gap-2">
    <button
      aria-label="Career Mentor"
      onClick={() => setMode("mentor")}
      className={`px-3 py-1 rounded-full text-sm border ${
        mode === "mentor"
          ? "bg-blue-500 text-white border-blue-500" // Active button: blue background with white text
          : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-gray-100" // Inactive button: dark gray background with lighter text
      }`}
    >
      Mentor
    </button>
    <button
      aria-label="Emotional Support"
      onClick={() => setMode("support")}
      className={`px-3 py-1 rounded-full text-sm border ${
        mode === "support"
          ? "bg-blue-500 text-white border-blue-500" // Active button: blue background with white text
          : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:text-gray-100" // Inactive button: dark gray background with lighter text
      }`}
    >
      Support
    </button>
  </div>
</div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">
            {mode === "mentor"
              ? "You’re chatting with PSA’s AI Career Mentor. Ask about skills, pathways, and next steps."
              : "You’re chatting with a supportive companion. Share what’s on your mind—I'm here to listen."}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === "user"
                  ? mode === "mentor"
                    ? "bg-blue-500 text-white" // Bright blue for mentor mode
                    : "bg-green-500 text-white" // Bright green for support mode
                  : "bg-gray-700 text-gray-100" // Dark gray for assistant messages
                }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-300 text-gray-800 rounded-2xl px-3 py-2 text-sm">Thinking…</div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={mode === "mentor" ? "Ask about roles, skills, learning plans…" : "How are you feeling today?"}
            className="w-full resize-none rounded-xl border border-gray-300 bg-white text-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${canSend ? "bg-blue-600 text-white hover:opacity-90" : "bg-gray-300 text-gray-600"
              }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
