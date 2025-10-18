import React, { useState } from "react";

export default function FeedbackForm() {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Feedback Form</h2>

        <form
          method="POST"
          onSubmit={onSubmit}
          autoComplete="off"
          className="grid gap-4"
        >
          <input
            className="border p-2 rounded"
            type="text"
            name="entry.1719452068"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            type="email"
            name="entry.632080792"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            className="border p-2 rounded bg-white"
            name="entry.662039979"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="" disabled>Select Feedback Type</option>
            <option value="Comments">Comments</option>
            <option value="Suggestions">Suggestions</option>
            <option value="Questions">Questions</option>
          </select>

          <textarea
            className="border p-2 rounded min-h-[100px]"
            name="entry.151011902"
            placeholder="Write your feedback..."
            required
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white font-semibold py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}