import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    type: String,
    time: String,
  },
  { timestamps: true }
);

export default mongoose.models.Activity ||
  mongoose.model("Activity", ActivitySchema);