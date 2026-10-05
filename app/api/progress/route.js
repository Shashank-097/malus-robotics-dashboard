import { connectDB } from "../../lib/mongodb";
import Progress from "../../../models/Progress";
import Activity from "../../../models/Activity";

const getCurrentTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

const getCurrentDateTime = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

export async function GET() {
  try {
    await connectDB();

    const progress = await Progress.find().sort({ projectId: 1 });

    return Response.json({
      success: true,
      progress,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    // body.ownerId flows through automatically via the spread below,
    // now that the schema declares it — no change needed here.
    const newProgress = await Progress.create({
      ...body,
      lastUpdated: getCurrentDateTime(),
    });

    await Activity.create({
      title: "New Project Added",
      description: `${newProgress.projectId || "Project"} - ${
        newProgress.projectName || "New project"
      } was added.`,
      type: "add",
      time: getCurrentTime(),
    });

    return Response.json({
      success: true,
      message: "Project added successfully",
      progress: newProgress,
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

    const updatedProgress = await Progress.findByIdAndUpdate(
      body.id,
      {
        projectId: body.projectId,
        projectName: body.projectName,
        startDate: body.startDate,
        endDate: body.endDate,
        priority: body.priority,
        location: body.location,
        customer: body.customer,
        stage: body.stage,
        department: body.department,
        owner: body.owner,
        ownerId: body.ownerId,
        seenByOwner: false, // manager touched this — employee should see it as new again
        uploadedBy: body.uploadedBy,
        status: body.status,
        remarks: body.remarks,
        date: body.date,
        pendingPoints: body.pendingPoints,
        actionTaken: body.actionTaken,
        lastUpdated: getCurrentDateTime(),
      },
      { new: true }
    );

    if (!updatedProgress) {
      return Response.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    await Activity.create({
      title: "Project Updated",
      description: `${updatedProgress.projectId || "Project"} - ${
        updatedProgress.projectName || "Project"
      } was updated.`,
      type: "edit",
      time: getCurrentTime(),
    });

    return Response.json({
      success: true,
      message: "Project updated successfully",
      progress: updatedProgress,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    const body = await req.json();

    if (body.id) {
      const deletedProgress = await Progress.findByIdAndDelete(body.id);

      await Activity.create({
        title: "Project Deleted",
        description: `${deletedProgress?.projectId || "Project"} - ${
          deletedProgress?.projectName || "Project"
        } was deleted.`,
        type: "delete",
        time: getCurrentTime(),
      });

      return Response.json({
        success: true,
        message: "One record deleted",
      });
    }

    await Progress.deleteMany({});

    await Activity.create({
      title: "All Projects Deleted",
      description: "All project records were deleted.",
      type: "delete",
      time: getCurrentTime(),
    });

    return Response.json({
      success: true,
      message: "All records deleted",
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}