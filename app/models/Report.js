import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema(
  {
    date: String,
    projectId: String,
    projectName: String,
    component: String,
    processStep: String,
    owner: String,
    status: String,
    workDone: Number,
    remarks: String,
    nextStep: String,
  },
  { timestamps: true }
);

const Progress =
  mongoose.models.Progress || mongoose.model("Progress", ProgressSchema);

export default Progress;  
