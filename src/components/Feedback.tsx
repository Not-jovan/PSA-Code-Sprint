import React, { useState } from "react";

interface FeedbackProps {
  darkMode: boolean; // Use the darkMode prop passed from the parent
}

export default function FeedbackForm({ darkMode }: FeedbackProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLSdtABxZyxx3QO_SylGWInOqhCWcoy7LixRQivH6iBVJMwYExg/formResponse";

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    fetch(FORM_ACTION, {
      method: "POST",
      body: formData,
      mode: "no-cors",
    })
      .then(() => {
        setName("");
        setEmail("");
        setType("");
        setFeedback("");
        setSubmitting(false);
        alert("✅ Feedback submitted successfully!");
      })
      .catch((error) => {
        console.error(error);
        setSubmitting(false);
        alert("Error submitting feedback.");
      });
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-slate-50 text-gray-900"
      } p-4`}
    >
      <div
        className={`w-full max-w-md ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"
        } border rounded-2xl shadow p-6`}
      >
        <h2 className="text-xl font-semibold mb-4 text-center">Feedback Form</h2>

        <form
          method="POST"
          onSubmit={onSubmit}
          autoComplete="off"
          className="grid gap-4"
        >
          {/* Name Input */}
          <input
            className={`border p-2 rounded ${
              darkMode ? "bg-gray-700 text-gray-100 border-gray-600" : ""
            }`}
            type="text"
            name="entry.1719452068"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Email Input */}
          <input
            className={`border p-2 rounded ${
              darkMode ? "bg-gray-700 text-gray-100 border-gray-600" : ""
            }`}
            type="email"
            name="entry.632080792"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Feedback Type Dropdown */}
          <select
            className={`border p-2 rounded ${
              darkMode ? "bg-gray-700 text-gray-100 border-gray-600" : "bg-white"
            }`}
            name="entry.662039979"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="" disabled>
              Select Feedback Type
            </option>
            <option value="Comments">Comments</option>
            <option value="Suggestions">Suggestions</option>
            <option value="Questions">Questions</option>
          </select>

          {/* Feedback Textarea */}
          <textarea
            className={`border p-2 rounded min-h-[100px] ${
              darkMode ? "bg-gray-700 text-gray-100 border-gray-600" : ""
            }`}
            name="entry.151011902"
            placeholder="Write your feedback..."
            required
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className={`font-semibold py-2 rounded hover:bg-opacity-90 ${
              darkMode
                ? "bg-green-700 text-gray-100 disabled:opacity-60"
                : "bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            }`}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}