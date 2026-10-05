import mongoose from "mongoose";

const DailyProgressSchema = new mongoose.Schema(
  {
    saveDate: String,
    savedBy: String,
    records: Array,
  },
  { timestamps: true }
);

export default mongoose.models.DailyProgress ||
  mongoose.model("DailyProgress", DailyProgressSchema);