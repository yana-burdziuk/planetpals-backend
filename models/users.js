const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String, // à hasher côté server
  departmentId: String, // À modifier plus tard
  totalPoints: Number,
  totalCo2SavingsPoints: Number,
  collectedBadges: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "badges",
    default: []
  },
  isAdmin: Boolean,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
