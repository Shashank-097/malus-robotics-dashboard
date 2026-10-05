// ============================================================
// PM TOOL REPO — models/Progress.js
// Only change from your current version: added `ownerId`.
// ============================================================

import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema(
  {
    uploadedBy: String,
    projectId: String,
    date: String,

    startDate: String,
    endDate: String,

    priority: String,
    projectName: String,
    location: String,
    customer: String,
    stage: String,

    owner: String,       // legacy free-text name — kept for old entries, no longer written to
    ownerId: String,     // Employee Portal's employeeId, set by the owner dropdown
    seenByOwner: { type: Boolean, default: false }, // NEW: false whenever a task is assigned/reassigned
    pendingPoints: String,

    status: String,
    actionTaken: String,
    department: String,
    remarks: String,
    lastUpdated: {
      type: String,
      default: () =>
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
    },
  },
  { timestamps: true }
);

const Progress =
  mongoose.models.Progress ||
  mongoose.model("Progress", ProgressSchema);

export default Progress;