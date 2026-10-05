"use client";

import { useState } from "react";

export default function SubmitReportPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description, location }),
    });

    const data = await response.json();

    if (data.success) {
      alert("Report Submitted Successfully!");
      setTitle("");
      setDescription("");
      setLocation("");
    } else {
      alert("Error: " + data.message);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Submit Report</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Report Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <button type="submit">Submit Report</button>
        </form>
      </div>
    </div>
  );
}