import mongoose from "mongoose";
import { connectDB } from "../../lib/mongodb";
import Progress from "../../../models/Progress";
import DailyProgress from "../../../models/DailyProgress";
import Activity from "../../../models/Activity";

export async function POST(req) {
  try {
    await connectDB();

    console.log("DB NAME:", mongoose.connection.name);
    console.log("HOST:", mongoose.connection.host);
    console.log("DAILY COLLECTION:", DailyProgress.collection.name);

    const body = await req.json();
    const savedBy = body.savedBy || "Admin";
    const today = new Date().toLocaleDateString("en-GB");

    const progressData = await Progress.find().lean();

    console.log("Progress Records:", progressData.length);

    if (!progressData || progressData.length === 0) {
      return Response.json(
        {
          success: false,
          message: "No progress data found to save",
        },
        { status: 400 }
      );
    }

    const saved = await DailyProgress.findOneAndUpdate(
      { saveDate: today },
      {
        saveDate: today,
        savedBy,
        records: progressData,
      },
      { upsert: true, new: true }
    );

    await Activity.create({
      title: "Daily Report Saved",
      description: `${progressData.length} projects were saved successfully.`,
      type: "save",
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }),
    });

    console.log("Saved Document:", saved);

    return Response.json({
      success: true,
      message: `Progress sheet saved successfully for ${today}`,
    });
  } catch (error) {
    console.error("SAVE ERROR:", error);

    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}