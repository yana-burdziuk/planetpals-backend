const mongoose = require("mongoose");

const departmentSchema = mongoose.Schema({
  name: String,
  totalPoints: Number,
  totalCo2SavingsPoints: Number,
  isActive: Boolean,
});

const Department = mongoose.model("departments", departmentSchema);

module.exports = Department;
