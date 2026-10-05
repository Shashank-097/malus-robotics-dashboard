"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");

    if (!user || user.role !== "admin") {
      router.push("/login");
    }
  }, [router]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file");
      return;
    }

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null"
    );

    if (!currentUser?.email || currentUser.role !== "admin") {
      alert("Please login as admin first");
      router.push("/login");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userEmail", currentUser.email);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-4">Upload Progress Sheet</h1>

        <p className="text-gray-500 mb-6">
          Upload your Excel project status sheet to update the dashboard.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border p-3 w-full rounded mb-5"
        />

        <button
          onClick={handleUpload}
          className="bg-green-600 text-white px-5 py-3 rounded w-full font-semibold"
        >
          Upload Excel Sheet
        </button>

        <button
          onClick={() => router.push("/admin")}
          className="bg-gray-700 text-white px-5 py-3 rounded w-full font-semibold mt-3"
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
}