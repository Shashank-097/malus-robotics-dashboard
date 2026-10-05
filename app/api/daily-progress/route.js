import { connectDB } from "../../lib/mongodb";
import DailyProgress from "../../../models/DailyProgress";

export async function GET() {
  try {
    await connectDB();

    const reports = await DailyProgress.find().sort({ createdAt: -1 });

    return Response.json({
      success: true,
      reports,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}