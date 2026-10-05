"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ViewDailyReportPage() {
  const params = useParams();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      const res = await fetch(`/api/daily-progress/${params.id}`);
      const data = await res.json();

      if (data.success) {
        setReport(data.report);
      }
    };

    if (params.id) fetchReport();
  }, [params.id]);

  if (!report) {
    return <div className="p-8">Loading report...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <Link href="/admin/daily-reports" className="text-blue-600">
          ← Back to Previous Reports
        </Link>

        <h1 className="text-3xl font-bold mt-4">Daily Report</h1>
        <p>Date: {report.saveDate}</p>
        <p>Total Projects: {report.records?.length || 0}</p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-700 text-white">
              <th className="p-3 text-left">Project ID</th>
              <th className="p-3 text-left">Project Name</th>
              <th className="p-3 text-left">Owner</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Remarks</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {[...(report.records || [])]
  .sort((a: any, b: any) =>
    String(a.projectId || "").localeCompare(String(b.projectId || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  )
  .map((item: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.projectId || "N/A"}</td>
                <td className="p-3">{item.projectName || "N/A"}</td>
                <td className="p-3">{item.owner || "N/A"}</td>
                <td className="p-3">{item.status || "N/A"}</td>
                <td className="p-3">{item.remarks || "N/A"}</td>
                <td className="p-3">{item.date || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}