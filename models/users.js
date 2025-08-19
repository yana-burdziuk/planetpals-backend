const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String, // à hasher côté server
  departmentId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "departments",
    default: []
  },
  token : String,
  totalPoints: { type: Number, default: 0 },
  totalCo2SavingsPoints: { type: Number, default: 0 },
  collectedBadges: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "badges",
    default: []
  },
  isAdmin: Boolean,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
