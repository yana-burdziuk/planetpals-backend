const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String, // à hasher côté server
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "departments",
  },
  totalPoints: Number,
  totalCo2SavingsPoints: Number,
  collectedBadges: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "badges",
  },
  isAdmin: Boolean,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
