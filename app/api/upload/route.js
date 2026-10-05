import * as XLSX from "xlsx";
import { connectDB } from "../../lib/mongodb";
import Progress from "../../../models/Progress";

function extractDateFromHeader(header) {
  const match = header.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  return match ? match[1] : "";
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const userEmail = formData.get("userEmail");

    if (!file) {
      return Response.json({ success: false, message: "No file uploaded" });
    }

    if (!userEmail) {
      return Response.json({ success: false, message: "User not logged in" });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    await connectDB();

    const formattedData = data
      .filter(
        (row) =>
          (row["Project Number"] ||
            row["Project ID"] ||
            row["Project Id"] ||
            row["projectId"]) &&
          (row["Application"] ||
            row["Project Name"] ||
            row["projectName"])
      )
      .map((row) => {
        const dateColumns = Object.keys(row).filter((key) =>
          key.toLowerCase().includes("date")
        );

        const lastDateColumn = dateColumns
          .filter((key) => row[key] !== "")
          .pop();

        return {
          uploadedBy: userEmail,

          date: lastDateColumn ? extractDateFromHeader(lastDateColumn) : "",

          startDate:
            row["Start Date"] ||
            row["Start date"] ||
            row["startDate"] ||
            row["StartDate"] ||
            "",

          endDate:
            row["End Date"] ||
            row["End date"] ||
            row["endDate"] ||
            row["EndDate"] ||
            "",

          projectId:
            row["Project Number"] ||
            row["Project ID"] ||
            row["Project Id"] ||
            row["projectId"] ||
            "",

          projectName:
            row["Application"] ||
            row["Project Name"] ||
            row["projectName"] ||
            "",

          owner:
            row["Resource"] ||
            row["Owner"] ||
            row["owner"] ||
            "",

          status: row["Status"] || row["status"] || "Open",

          remarks:
            row["Remark"] ||
            row["Remarks"] ||
            row["remarks"] ||
            "",

          location:
            row["Location / Address"] ||
            row["Location"] ||
            "",

          customer:
            row["Customer Name / POC"] ||
            row["Customer"] ||
            "",

          stage: row["Stage"] || "",

          priority: row["Priority"] || "",

          department: row["Responsible Department"] || "",
        };
      });

    if (formattedData.length === 0) {
      return Response.json({
        success: false,
        message: "No valid rows found. Please check Excel column names.",
        rawData: data.slice(0, 3),
      });
    }

    await Progress.deleteMany({ uploadedBy: userEmail });
    await Progress.insertMany(formattedData);

    return Response.json({
      success: true,
      message: "Excel data saved successfully",
      count: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return Response.json(
      {
        success: false,
        message: error.message || "Upload failed",
      },
      { status: 500 }
    );
  }
}