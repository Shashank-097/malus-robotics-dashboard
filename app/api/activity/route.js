import { connectDB } from "../../lib/mongodb";
import Activity from "../../../models/Activity";

export async function GET() {
  try {
    await connectDB();

    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(20);

    return Response.json({
      success: true,
      activities,
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

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const activity = await Activity.create(body);

    return Response.json({
      success: true,
      activity,
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