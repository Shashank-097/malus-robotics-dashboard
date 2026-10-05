"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DailyReport = {
  _id: string;
  saveDate: string;
  savedBy: string;
  records: any[];
  createdAt: string;
};

export default function DailyReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);

  const fetchReports = async () => {
    const res = await fetch("/api/daily-progress");
    const data = await res.json();

    if (data.success) {
      setReports(data.reports);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const deleteReport = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/daily-progress/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      alert("Report deleted successfully");
      fetchReports();
    } else {
      alert(data.message || "Failed to delete report");
    }
  };

  const getSavedBy = (savedBy: string) => {
    return savedBy || "Malus Robotics";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Previous Daily Reports</h1>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-700 text-white">
              <th className="p-3 text-left">Save Date</th>
              <th className="p-3 text-left">Saved By</th>
              <th className="p-3 text-left">Total Projects</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <tr key={report._id} className="border-b">
                <td className="p-3">{report.saveDate}</td>
                <td className="p-3">Malus Robotics</td>
                <td className="p-3">{report.records?.length || 0}</td>

                <td className="p-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/daily-reports/${report._id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded inline-block"
                    >
                      View Report
                    </Link>

                    <button
                      onClick={() => deleteReport(report._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="p-5 text-center text-gray-500">
                  No previous reports found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}