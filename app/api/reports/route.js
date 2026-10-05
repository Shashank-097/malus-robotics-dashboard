import { connectDB } from "../../lib/mongodb";
import Report from "../../models/Report";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const report = await Report.create({
      title: body.title,
      description: body.description,
      location: body.location,
    });

    return Response.json({ success: true, report });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const reports = await Report.find().sort({ createdAt: -1 });

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
export async function PATCH(req) {
  try {
    await connectDB();

    const body = await req.json();

    const updatedReport = await Report.findByIdAndUpdate(
      body.id,
      { status: body.status },
      { new: true }
    );

    return Response.json({ success: true, report: updatedReport });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}