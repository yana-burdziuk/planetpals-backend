const mongoose = require("mongoose");

const departmentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  totalPoints: {
    type: Number,
    required: true,
  },
  totalCo2SavingsPoints: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
});

const Department = mongoose.model("departments", departmentSchema);

module.exports = Department;
