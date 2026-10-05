import { connectDB } from "../../../lib/mongodb";
import DailyProgress from "../../../../models/DailyProgress";

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const report = await DailyProgress.findById(id);

    if (!report) {
      return Response.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      report,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const report = await DailyProgress.findById(id);

    if (!report) {
      return Response.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 }
      );
    }

    await DailyProgress.findByIdAndDelete(id);

    return Response.json({
      success: true,
      message: "Daily report deleted successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}