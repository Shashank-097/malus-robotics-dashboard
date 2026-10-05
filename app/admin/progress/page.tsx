"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function ProgressPage() {
  const [progress, setProgress] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then((data) => setProgress(data.progress || []));
  }, []);

  const downloadExcel = () => {
    const exportData = progress.map((item) => ({
      "Project ID": item.projectId || "",
      Priority: item.priority || "",
      Application: item.projectName || "",
      Location: item.location || "",
      "Customer / POC": item.customer || "",
      Stage: item.stage || "",
      Owner: item.owner || "",
      Status: item.status || "",
      "Action Taken": item.actionTaken || "",
      Remark: item.remarks || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Project Status");

    XLSX.writeFile(workbook, "Project_Status_Sheet.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Project Status Dashboard</h1>

          <button
            onClick={downloadExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Download Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="border p-3">Project ID</th>
                <th className="border p-3">Priority</th>
                <th className="border p-3">Application</th>
                <th className="border p-3">Location</th>
                <th className="border p-3">Customer / POC</th>
                <th className="border p-3">Stage</th>
                <th className="border p-3">Owner</th>
                <th className="border p-3">Status</th>
                <th className="border p-3">Action Taken</th>
                <th className="border p-3">Remark</th>
              </tr>
            </thead>

            <tbody>
              {progress.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="border p-3">{item.projectId || "-"}</td>
                  <td className="border p-3">{item.priority || "-"}</td>
                  <td className="border p-3">{item.projectName || "-"}</td>
                  <td className="border p-3">{item.location || "-"}</td>
                  <td className="border p-3">{item.customer || "-"}</td>
                  <td className="border p-3">{item.stage || "-"}</td>
                  <td className="border p-3">{item.owner || "-"}</td>

                  <td className="border p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        item.status === "Open"
                          ? "bg-blue-100 text-blue-700"
                          : item.status === "Hold"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.status === "Completed"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Closed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.status || "N/A"}
                    </span>
                  </td>

                  <td className="border p-3 whitespace-pre-line">
                    {item.actionTaken || "-"}
                  </td>

                  <td className="border p-3">{item.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {progress.length === 0 && (
            <p className="text-center py-6 text-gray-500">
              No progress data found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}